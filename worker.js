// Cloudflare Worker (modules) – Kids Home Hub mini PWA
// Uses KV namespace: CHILD_SPEND
// Money keys preserved: total_adam, total_sami, log_adam, log_sami

const CHILDREN = ['adam', 'sami'];

// Static conversion rates: 1 AUD = 0.56 GBP
const conversionRates = { GBP: 1, AUD: 0.56 };

// Conversion rate: 1 point = 1 minute of screen time
const POINT_TO_MINUTES = 1;

const CHORES = [
  { id: 'tidy_room',    label: 'Tidy bedroom',            points: 10 },
  { id: 'homework',     label: 'Finish homework',         points: 8  },
  { id: 'set_table',    label: 'Set / clear the table',   points: 5  },
  { id: 'feed_pet',     label: 'Feed pet / help pet',     points: 6  },
  { id: 'help_laundry', label: 'Help with laundry',       points: 7  }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/transaction') {
      return handleTransaction(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/chores') {
      return handleChores(request, env);
    }

    // NEW: redeem points → screen time
    if (request.method === 'POST' && url.pathname === '/redeem') {
      return handleRedeem(request, env);
    }

    if (url.pathname === '/manifest.webmanifest') {
      return pwaManifest();
    }

    if (url.pathname === '/sw.js') {
      return serviceWorkerScript();
    }

    return serveUI(env);
  }
};

/* ----------------- TRANSACTIONS (money, points, screen) ----------------- */

async function handleTransaction(request, env) {
  const form      = await request.formData();
  const feature   = form.get('feature');      // 'money' | 'points' | 'screen'
  const child     = form.get('child');
  const action    = form.get('action');       // 'add' | 'deduct'
  const rawAmount = parseFloat(form.get('amount'));
  const currency  = form.get('currency');     // for money only
  const reason    = (form.get('reason') || '').trim();

  if (!CHILDREN.includes(child)
    || !['add', 'deduct'].includes(action)
    || isNaN(rawAmount) || rawAmount <= 0
    || !feature
  ) {
    return new Response('Invalid input', { status: 400 });
  }

  const timestamp = new Date().toISOString();

  if (feature === 'money') {
    if (!['GBP', 'AUD'].includes(currency) || !reason) {
      return new Response('Invalid money input', { status: 400 });
    }

    const rate      = conversionRates[currency] || 1;
    const converted = parseFloat((rawAmount * rate).toFixed(2));

    // Existing keys: total_adam, total_sami
    const totalKey = `total_${child}`;
    let total      = parseFloat(await env.CHILD_SPEND.get(totalKey) || '0');
    total = action === 'add' ? total + converted : total - converted;
    await env.CHILD_SPEND.put(totalKey, total.toFixed(2));

    // Existing keys: log_adam, log_sami
    const logKey = `log_${child}`;
    let log = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
    log.unshift({
      timestamp,
      action,
      rawAmount: rawAmount.toFixed(2),
      currency,
      converted: converted.toFixed(2),
      reason
    });
    await env.CHILD_SPEND.put(logKey, JSON.stringify(log));

  } else if (feature === 'points') {
    if (!reason) return new Response('Reason required for points', { status: 400 });

    const totalKey = `points:total:${child}`;
    let total      = parseInt(await env.CHILD_SPEND.get(totalKey) || '0', 10);
    const delta    = Math.round(rawAmount);
    total = action === 'add' ? total + delta : total - delta;
    await env.CHILD_SPEND.put(totalKey, String(total));

    const logKey = `points:log:${child}`;
    let log = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
    log.unshift({
      timestamp,
      action,
      amount: delta,
      reason,
      source: 'manual'
    });
    await env.CHILD_SPEND.put(logKey, JSON.stringify(log));

  } else if (feature === 'screen') {
    if (!reason) return new Response('Reason required for screen time', { status: 400 });

    const totalKey = `screen:total:${child}`;
    let total      = parseInt(await env.CHILD_SPEND.get(totalKey) || '0', 10);
    const minutes  = Math.round(rawAmount);
    total = action === 'add' ? total + minutes : total - minutes;
    await env.CHILD_SPEND.put(totalKey, String(total));

    const logKey = `screen:log:${child}`;
    let log = JSON.parse(await env.CHILD_SPEND.get(logKey) || '[]');
    log.unshift({
      timestamp,
      action,
      minutes,
      reason
    });
    await env.CHILD_SPEND.put(logKey, JSON.stringify(log));

  } else {
    return new Response('Unknown feature', { status: 400 });
  }

  return serveUI(env);
}

/* --------------------------- CHORES HANDLER --------------------------- */

async function handleChores(request, env) {
  const form  = await request.formData();
  const child = form.get('child');

  if (!CHILDREN.includes(child)) {
    return new Response('Invalid child', { status: 400 });
  }

  const doneIds = form.getAll('chore'); // array of chore ids
  if (!doneIds || doneIds.length === 0) {
    return serveUI(env);
  }

  const completed = CHORES.filter(c => doneIds.includes(c.id));
  if (completed.length === 0) {
    return serveUI(env);
  }

  const totalPoints = completed.reduce((sum, c) => sum + c.points, 0);
  const timestamp   = new Date().toISOString();

  // Update points balance
  const pointsTotalKey = `points:total:${child}`;
  let pointsTotal      = parseInt(await env.CHILD_SPEND.get(pointsTotalKey) || '0', 10);
  pointsTotal += totalPoints;
  await env.CHILD_SPEND.put(pointsTotalKey, String(pointsTotal));

  // Points log entry (source = chores)
  const pointsLogKey = `points:log:${child}`;
  let pointsLog = JSON.parse(await env.CHILD_SPEND.get(pointsLogKey) || '[]');
  const reason = 'Chores: ' + completed.map(c => c.label).join(', ');
  pointsLog.unshift({
    timestamp,
    action: 'add',
    amount: totalPoints,
    reason,
    source: 'chores'
  });
  await env.CHILD_SPEND.put(pointsLogKey, JSON.stringify(pointsLog));

  // Chores log
  const choreLogKey = `chores:log:${child}`;
  let choreLog = JSON.parse(await env.CHILD_SPEND.get(choreLogKey) || '[]');
  choreLog.unshift({
    timestamp,
    items: completed
  });
  await env.CHILD_SPEND.put(choreLogKey, JSON.stringify(choreLog));

  return serveUI(env);
}

/* ------------------- REDEEM POINTS → SCREEN TIME ------------------- */

async function handleRedeem(request, env) {
  const form   = await request.formData();
  const child  = form.get('child');
  const points = parseInt(form.get('points'), 10);
  const reason = (form.get('reason') || '').trim();

  if (!CHILDREN.includes(child)
    || !Number.isFinite(points) || points <= 0
    || !reason
  ) {
    return new Response('Invalid redeem input', { status: 400 });
  }

  const timestamp       = new Date().toISOString();
  const pointsTotalKey  = `points:total:${child}`;
  const pointsLogKey    = `points:log:${child}`;
  const screenTotalKey  = `screen:total:${child}`;
  const screenLogKey    = `screen:log:${child}`;

  let currentPoints = parseInt(await env.CHILD_SPEND.get(pointsTotalKey) || '0', 10);
  if (!Number.isFinite(currentPoints) || currentPoints < 0) currentPoints = 0;

  const spendPoints = Math.min(points, currentPoints);
  if (spendPoints <= 0) {
    return serveUI(env); // nothing to do
  }

  const minutes = spendPoints * POINT_TO_MINUTES;

  // Update points total
  currentPoints -= spendPoints;
  await env.CHILD_SPEND.put(pointsTotalKey, String(currentPoints));

  // Update points log
  let pointsLog = JSON.parse(await env.CHILD_SPEND.get(pointsLogKey) || '[]');
  pointsLog.unshift({
    timestamp,
    action: 'deduct',
    amount: spendPoints,
    reason: `${reason} (spent for screen time)`,
    source: 'redeem_to_screen'
  });
  await env.CHILD_SPEND.put(pointsLogKey, JSON.stringify(pointsLog));

  // Update screen total
  let screenTotal = parseInt(await env.CHILD_SPEND.get(screenTotalKey) || '0', 10);
  if (!Number.isFinite(screenTotal)) screenTotal = 0;
  screenTotal += minutes;
  await env.CHILD_SPEND.put(screenTotalKey, String(screenTotal));

  // Update screen log
  let screenLog = JSON.parse(await env.CHILD_SPEND.get(screenLogKey) || '[]');
  screenLog.unshift({
    timestamp,
    action: 'add',
    minutes,
    reason: `From points: ${spendPoints} pts → ${minutes} min (${reason})`
  });
  await env.CHILD_SPEND.put(screenLogKey, JSON.stringify(screenLog));

  return serveUI(env);
}

/* ------------------------------- UI ---------------------------------- */

async function serveUI(env) {
  // MONEY: existing keys
  const moneyTotalAdam = parseFloat(await env.CHILD_SPEND.get('total_adam') || '0');
  const moneyTotalSami = parseFloat(await env.CHILD_SPEND.get('total_sami') || '0');

  const adamGBP = moneyTotalAdam.toFixed(2);
  const adamAUD = (moneyTotalAdam / conversionRates.AUD).toFixed(2);
  const samiGBP = moneyTotalSami.toFixed(2);
  const samiAUD = (moneyTotalSami / conversionRates.AUD).toFixed(2);

  const moneyLogAdam = JSON.parse(await env.CHILD_SPEND.get('log_adam') || '[]');
  const moneyLogSami = JSON.parse(await env.CHILD_SPEND.get('log_sami') || '[]');

  // POINTS
  const pointsTotalAdam = parseInt(await env.CHILD_SPEND.get('points:total:adam') || '0', 10);
  const pointsTotalSami = parseInt(await env.CHILD_SPEND.get('points:total:sami') || '0', 10);

  const pointsLogAdam = JSON.parse(await env.CHILD_SPEND.get('points:log:adam') || '[]');
  const pointsLogSami = JSON.parse(await env.CHILD_SPEND.get('points:log:sami') || '[]');

  // SCREEN TIME (minutes)
  const screenTotalAdam = parseInt(await env.CHILD_SPEND.get('screen:total:adam') || '0', 10);
  const screenTotalSami = parseInt(await env.CHILD_SPEND.get('screen:total:sami') || '0', 10);

  const screenLogAdam = JSON.parse(await env.CHILD_SPEND.get('screen:log:adam') || '[]');
  const screenLogSami = JSON.parse(await env.CHILD_SPEND.get('screen:log:sami') || '[]');

  // CHORES LOG
  const choresLogAdam = JSON.parse(await env.CHILD_SPEND.get('chores:log:adam') || '[]');
  const choresLogSami = JSON.parse(await env.CHILD_SPEND.get('chores:log:sami') || '[]');

  // Images
  const adamImage = 'https://m.media-amazon.com/images/I/61GlRO63gBL.__AC_SX300_SY300_QL70_ML2_.jpg';
  const samImage  = 'https://www.positivepromotions.com/images/1000/OSA-324.jpg';
  const simbaURL  = 'https://upload.wikimedia.org/wikipedia/en/2/2e/Simba%28TheLionKing%29.png';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kids Home Hub</title>

<meta name="theme-color" content="#01579b">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.webmanifest">

<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f5f7fa;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1f2933;
  }
  .app {
    min-height: 100vh;
    padding: 1rem 1rem 4.5rem;
    max-width: 960px;
    margin: 0 auto;
  }
  header {
    text-align: center;
    margin-bottom: 0.75rem;
  }
  header img {
    max-width: 96px;
    height: auto;
    filter: drop-shadow(0 8px 20px rgba(15, 23, 42, 0.15));
  }
  h1 {
    color: #01579b;
    font-size: 1.7rem;
    margin: 0.75rem 0 0;
    letter-spacing: 0.02em;
  }

  .child-switch {
    display: inline-flex;
    margin: 0.75rem auto 0.75rem;
    padding: 0.15rem;
    border-radius: 999px;
    background: #e5edf9;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
  }
  .child-switch-wrapper {
    display: flex;
    justify-content: centre;
    margin-bottom: 0.25rem;
  }
  .child-tab {
    border: none;
    background: transparent;
    border-radius: 999px;
    padding: 0.25rem 0.9rem;
    font-size: 0.85rem;
    display: inline-flex;
    align-items: centre;
    gap: 0.35rem;
    cursor: pointer;
    color: #4b5563;
  }
  .child-tab .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #9ca3af;
  }
  .child-tab.active {
    background: #ffffff;
    color: #01579b;
    font-weight: 600;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16);
  }
  .child-tab.active .dot {
    background: #01579b;
  }

  .view { display: none; }
  .view.active { display: block; }

  .view-title {
    font-size: 1.05rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #102a43;
  }

  .view-child { display: none; }
  .view-child.active { display: block; }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }

  .card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1rem;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  }
  .card-header {
    display: flex;
    align-items: centre;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    object-fit: cover;
  }
  .card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #102a43;
  }
  .card-subtitle {
    font-size: 0.8rem;
    color: #6b7280;
  }

  .card-balance {
    margin-bottom: 0.75rem;
  }
  .balance-value {
    font-size: 1.6rem;
    font-weight: 700;
    color: #01579b;
  }
  .balance-secondary {
    font-size: 0.85rem;
    color: #6b7280;
    margin-top: 0.1rem;
  }

  .actions-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
    flex-wrap: wrap;
  }

  .btn {
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: centre;
    justify-content: centre;
    gap: 0.35rem;
    white-space: nowrap;
  }
  .btn.primary {
    background: #01579b;
    color: #ffffff;
  }
  .btn.primary:hover {
    background: #014170;
  }
  .btn.ghost {
    background: transparent;
    color: #01579b;
    border: 1px solid rgba(1, 87, 155, 0.15);
  }
  .btn.full {
    width: 100%;
    margin-top: 0.5rem;
  }

  .inline-form {
    margin-top: 0.5rem;
    border-radius: 12px;
    background: #f3f7ff;
    padding: 0.75rem;
    display: none;
  }
  .inline-form.open {
    display: block;
  }

  .segmented {
    display: inline-flex;
    border-radius: 999px;
    background: #e5edf9;
    padding: 0.15rem;
    margin-bottom: 0.5rem;
  }
  .segmented label {
    position: relative;
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    font-size: 0.8rem;
    cursor: pointer;
    color: #374151;
  }
  .segmented input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .segmented input:checked + span {
    background: #ffffff;
    color: #01579b;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }
  .segmented span {
    display: inline-block;
    border-radius: 999px;
    padding: 0.2rem 0.7rem;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.4rem;
    gap: 0.15rem;
  }
  .form-row label {
    font-size: 0.8rem;
    color: #4b5563;
  }
  .form-row input,
  .form-row select {
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
  }

  .recent {
    margin-top: 0.5rem;
  }
  .recent-header {
    display: flex;
    justify-content: space-between;
    align-items: centre;
    font-size: 0.8rem;
    color: #4b5563;
    margin-bottom: 0.25rem;
  }

  .activity-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .activity-item {
    padding: 0.35rem 0;
  }
  .activity-item + .activity-item {
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }
  .activity-main {
    display: flex;
    justify-content: space-between;
    align-items: centre;
  }
  .activity-title {
    font-size: 0.85rem;
    color: #111827;
  }
  .activity-amount {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .activity-amount.positive {
    color: #2e7d32;
  }
  .activity-amount.negative {
    color: #d32f2f;
  }
  .activity-meta {
    font-size: 0.72rem;
    color: #6b7280;
    margin-top: 0.05rem;
  }

  .chore-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0.5rem 0;
  }
  .chore-item {
    display: flex;
    justify-content: space-between;
    align-items: centre;
    font-size: 0.85rem;
  }
  .chore-item label {
    display: flex;
    align-items: centre;
    gap: 0.4rem;
    flex: 1;
  }
  .chore-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
  .chore-item .points {
    font-weight: 600;
    color: #01579b;
    margin-left: 0.5rem;
    font-size: 0.8rem;
  }

  .small {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .progress {
    width: 100%;
    height: 8px;
    border-radius: 999px;
    background: #e5edf9;
    overflow: hidden;
    margin-top: 0.35rem;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: #01579b;
    width: 0%;
  }
  .progress-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.25rem;
  }

  .bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    background: #ffffff;
    border-top: 1px solid rgba(15, 23, 42, 0.1);
    padding: 0.35rem 0.25rem;
    z-index: 100;
  }
  .nav-btn {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.8rem;
    padding: 0.25rem 0.35rem;
    display: inline-flex;
    flex-direction: column;
    align-items: centre;
    gap: 0.1rem;
    color: #6b7280;
    border-radius: 999px;
  }
  .nav-btn .icon {
    font-size: 1.2rem;
    line-height: 1;
  }
  .nav-btn.active {
    color: #01579b;
    font-weight: 600;
    background: rgba(1, 87, 155, 0.08);
  }
</style>
</head>
<body>
  <div class="app">
    <header>
      <img src="${simbaURL}" alt="Simba">
      <h1>Adam & Sami Home Hub</h1>
    </header>

    <div class="child-switch-wrapper">
      <div class="child-switch" role="tablist" aria-label="Choose child">
        <button class="child-tab active" data-child="adam" role="tab" aria-selected="true">
          <span class="dot"></span>
          <span>Adam</span>
        </button>
        <button class="child-tab" data-child="sami" role="tab" aria-selected="false">
          <span class="dot"></span>
          <span>Sami</span>
        </button>
      </div>
    </div>

    <!-- BANK VIEW -->
    <main id="view-bank" class="view active" role="tabpanel" aria-label="Bank">
      <div class="view-title">Bank account</div>

      <div class="view-child" data-child="adam">
        <div class="grid">
          ${renderMoneyCard('adam', 'Adam', adamGBP, adamAUD, moneyLogAdam, adamImage)}
        </div>
      </div>

      <div class="view-child" data-child="sami">
        <div class="grid">
          ${renderMoneyCard('sami', 'Sami', samiGBP, samiAUD, moneyLogSami, samImage)}
        </div>
      </div>
    </main>

    <!-- POINTS VIEW -->
    <main id="view-points" class="view" role="tabpanel" aria-label="Points">
      <div class="view-title">Reward points</div>

      <div class="view-child" data-child="adam">
        <div class="grid">
          ${renderPointsCard('adam', 'Adam', pointsTotalAdam, pointsLogAdam)}
        </div>
      </div>

      <div class="view-child" data-child="sami">
        <div class="grid">
          ${renderPointsCard('sami', 'Sami', pointsTotalSami, pointsLogSami)}
        </div>
      </div>
    </main>

    <!-- CHORES VIEW -->
    <main id="view-chores" class="view" role="tabpanel" aria-label="Chores">
      <div class="view-title">Weekly chores</div>

      <div class="view-child" data-child="adam">
        <div class="grid">
          ${renderChoresCard('adam', 'Adam', choresLogAdam)}
        </div>
      </div>

      <div class="view-child" data-child="sami">
        <div class="grid">
          ${renderChoresCard('sami', 'Sami', choresLogSami)}
        </div>
      </div>
    </main>

    <!-- SCREEN TIME VIEW -->
    <main id="view-screen" class="view" role="tabpanel" aria-label="Screen time">
      <div class="view-title">Screen time bank</div>

      <div class="view-child" data-child="adam">
        <div class="grid">
          ${renderScreenCard('adam', 'Adam', screenTotalAdam, screenLogAdam)}
        </div>
      </div>

      <div class="view-child" data-child="sami">
        <div class="grid">
          ${renderScreenCard('sami', 'Sami', screenTotalSami, screenLogSami)}
        </div>
      </div>
    </main>
  </div>

  <nav class="bottom-nav" role="tablist" aria-label="Main navigation">
    <button class="nav-btn active" data-view="bank" role="tab" aria-selected="true">
      <span class="icon">💰</span>
      <span class="label">Bank</span>
    </button>
    <button class="nav-btn" data-view="points" role="tab" aria-selected="false">
      <span class="icon">⭐</span>
      <span class="label">Points</span>
    </button>
    <button class="nav-btn" data-view="chores" role="tab" aria-selected="false">
      <span class="icon">🧹</span>
      <span class="label">Chores</span>
    </button>
    <button class="nav-btn" data-view="screen" role="tab" aria-selected="false">
      <span class="icon">📱</span>
      <span class="label">Screen</span>
    </button>
  </nav>

  <script>
    const POINT_TO_MINUTES = ${POINT_TO_MINUTES};

    function selectChild(child) {
      const childTabs = document.querySelectorAll('.child-tab');
      const viewChildren = document.querySelectorAll('.view-child');

      childTabs.forEach(tab => {
        const isActive = tab.dataset.child === child;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      viewChildren.forEach(vc => {
        vc.classList.toggle('active', vc.dataset.child === child);
      });

      try {
        if (window.localStorage) {
          localStorage.setItem('selectedChild', child);
        }
      } catch (e) {}
    }

    // Initialise child selection
    (function initChildSwitch() {
      const childTabs = document.querySelectorAll('.child-tab');
      const stored = (function () {
        try {
          return window.localStorage && localStorage.getItem('selectedChild');
        } catch (e) { return null; }
      })();
      const initialChild = stored === 'sami' ? 'sami' : 'adam';
      selectChild(initialChild);

      childTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const child = tab.dataset.child;
          selectChild(child);
        });
      });
    })();

    // Toggle inline adjust / redeem forms
    function bindInlineForms() {
      document.querySelectorAll('[data-toggle="inline-form"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-target');
          const panel = document.getElementById(targetId);
          if (!panel) return;
          const isOpen = panel.classList.contains('open');

          const card = btn.closest('.card');
          if (card) {
            card.querySelectorAll('.inline-form').forEach(f => {
              if (f !== panel) f.classList.remove('open');
            });
          }

          panel.classList.toggle('open', !isOpen);
        });
      });
    }
    bindInlineForms();

    // Redeem preview: live convert points → minutes
    (function initRedeemPreview() {
      document.querySelectorAll('.redeem-points-input').forEach(input => {
        const previewSelector = '.redeem-preview[data-for="' + input.id + '"]';
        const preview = document.querySelector(previewSelector);
        if (!preview) return;

        const update = () => {
          const val = parseInt(input.value || '0', 10);
          const pts = Number.isFinite(val) && val > 0 ? val : 0;
          preview.textContent = pts * POINT_TO_MINUTES;
        };

        input.addEventListener('input', update);
        update();
      });
    })();

    // Bottom navigation tabs
    (function initBottomNav() {
      const views = document.querySelectorAll('.view');
      const navButtons = document.querySelectorAll('.nav-btn');

      navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.view;

          views.forEach(view => {
            view.classList.toggle('active', view.id === 'view-' + target);
          });

          navButtons.forEach(b => {
            const isActive = b === btn;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-selected', isActive ? 'true' : 'false');
          });
        });
      });
    })();

    // Service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      });
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

/* ------------------------ RENDER HELPERS ------------------------ */

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {
    return ts;
  }
}

function renderMoneyCard(key, label, gbp, aud, log, image) {
  const adjustId = `money-adjust-${key}`;
  const recent = (log || []).slice(0, 5);

  const items = recent.map(item => {
    const date = formatDate(item.timestamp);
    const amount = (item.action === 'add' ? '+' : '−') + '£' + item.converted;
    const cls = item.action === 'add' ? 'activity-amount positive' : 'activity-amount negative';
    const reason = item.reason || `${item.rawAmount} ${item.currency}`;
    return `<li class="activity-item">
      <div class="activity-main">
        <span class="activity-title">${reason}</span>
        <span class="${cls}">${amount}</span>
      </div>
      <div class="activity-meta">${date}</div>
    </li>`;
  }).join('');

  return `<section class="card">
    <div class="card-header">
      <img src="${image}" alt="${label}" class="avatar">
      <div>
        <div class="card-title">${label}'s bank</div>
        <div class="card-subtitle">Pocket money & gifts</div>
      </div>
    </div>

    <div class="card-balance">
      <div class="balance-value">£${gbp}</div>
      <div class="balance-secondary">≈ A${aud}</div>
    </div>

    <div class="actions-row">
      <button class="btn primary" type="button"
        data-toggle="inline-form" data-target="${adjustId}">
        Adjust balance
      </button>
    </div>

    <div id="${adjustId}" class="inline-form">
      <form action="/transaction" method="POST">
        <input type="hidden" name="feature" value="money">
        <input type="hidden" name="child" value="${key}">
        <div class="segmented">
          <label>
            <input type="radio" name="action" value="add" checked>
            <span>Add</span>
          </label>
          <label>
            <input type="radio" name="action" value="deduct">
            <span>Deduct</span>
          </label>
        </div>
        <div class="form-row">
          <label>Amount</label>
          <input type="number" name="amount" step="0.01" min="0.01" required>
        </div>
        <div class="form-row">
          <label>Currency</label>
          <select name="currency">
            <option value="GBP">GBP</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        <div class="form-row">
          <label>Reason</label>
          <input type="text" name="reason" placeholder="e.g. Birthday gift" required>
        </div>
        <button type="submit" class="btn primary full">Save</button>
      </form>
    </div>

    <div class="recent">
      <div class="recent-header">
        <span>Recent activity</span>
      </div>
      <ul class="activity-list">
        ${items || '<li class="activity-item"><div class="activity-meta">No transactions yet</div></li>'}
      </ul>
    </div>
  </section>`;
}

function renderPointsCard(key, label, total, log) {
  const adjustId = `points-adjust-${key}`;
  const spendId  = `points-spend-${key}`;
  const inputId  = `redeem-points-${key}`;
  const recent   = (log || []).slice(0, 5);

  const items = recent.map(item => {
    const date = formatDate(item.timestamp);
    const amount = (item.action === 'add' ? '+' : '−') + item.amount + ' pts';
    const cls = item.action === 'add' ? 'activity-amount positive' : 'activity-amount negative';
    const source = item.source ? ` (${item.source})` : '';
    return `<li class="activity-item">
      <div class="activity-main">
        <span class="activity-title">${item.reason || 'Points'}${source}</span>
        <span class="${cls}">${amount}</span>
      </div>
      <div class="activity-meta">${date}</div>
    </li>`;
  }).join('');

  return `<section class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${label}'s points</div>
        <div class="card-subtitle">Rewards, chores & screen time</div>
      </div>
    </div>

    <div class="card-balance">
      <div class="balance-value">${total} pts</div>
      <div class="balance-secondary">Total reward points</div>
    </div>

    <div class="actions-row">
      <button class="btn primary" type="button"
        data-toggle="inline-form" data-target="${adjustId}">
        Adjust points
      </button>
      <button class="btn ghost" type="button"
        data-toggle="inline-form" data-target="${spendId}">
        Spend for screen time
      </button>
    </div>

    <!-- Manual adjust form -->
    <div id="${adjustId}" class="inline-form">
      <form action="/transaction" method="POST">
        <input type="hidden" name="feature" value="points">
        <input type="hidden" name="child" value="${key}">
        <div class="segmented">
          <label>
            <input type="radio" name="action" value="add" checked>
            <span>Add</span>
          </label>
          <label>
            <input type="radio" name="action" value="deduct">
            <span>Deduct</span>
          </label>
        </div>
        <div class="form-row">
          <label>Points</label>
          <input type="number" name="amount" step="1" min="1" required>
        </div>
        <div class="form-row">
          <label>Reason</label>
          <input type="text" name="reason" placeholder="e.g. Extra kind behaviour" required>
        </div>
        <button type="submit" class="btn primary full">Save</button>
      </form>
    </div>

    <!-- Spend points → screen time -->
    <div id="${spendId}" class="inline-form">
      <form action="/redeem" method="POST">
        <input type="hidden" name="child" value="${key}">
        <div class="form-row">
          <label>Points to spend</label>
          <input
            id="${inputId}"
            class="redeem-points-input"
            type="number"
            name="points"
            step="1"
            min="1"
            required
          >
        </div>
        <div class="small">
          Each point becomes 1 minute.
          This will give
          <strong><span class="redeem-preview" data-for="${inputId}">0</span> min</strong>
          of screen time.
        </div>
        <div class="form-row" style="margin-top:0.35rem;">
          <label>Reason</label>
          <input type="text" name="reason" placeholder="e.g. Movie night, extra gaming" required>
        </div>
        <button type="submit" class="btn primary full">Spend points</button>
      </form>
    </div>

    <div class="recent">
      <div class="recent-header">
        <span>Recent points</span>
      </div>
      <ul class="activity-list">
        ${items || '<li class="activity-item"><div class="activity-meta">No points history yet</div></li>'}
      </ul>
    </div>
  </section>`;
}

function renderChoresCard(key, label, log) {
  const recent = (log || []).slice(0, 5);

  const rows = recent.map(entry => {
    const date = formatDate(entry.timestamp);
    const items = (entry.items || []).map(i => i.label).join(', ');
    const total = (entry.items || []).reduce((s, i) => s + (i.points || 0), 0);
    return `<li class="activity-item">
      <div class="activity-main">
        <span class="activity-title">${items || 'Chores'}</span>
        <span class="activity-amount positive">+${total} pts</span>
      </div>
      <div class="activity-meta">${date}</div>
    </li>`;
  }).join('');

  const choreCheckboxes = CHORES.map(c => `
    <div class="chore-item">
      <label>
        <input type="checkbox" name="chore" value="${c.id}">
        ${c.label}
      </label>
      <span class="points">+${c.points}</span>
    </div>
  `).join('');

  return `<section class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${label}'s chores</div>
        <div class="card-subtitle">Tick for this week</div>
      </div>
    </div>

    <form action="/chores" method="POST">
      <input type="hidden" name="child" value="${key}">
      <div class="chore-list">
        ${choreCheckboxes}
      </div>
      <button type="submit" class="btn primary full">Save chores & add points</button>
    </form>

    <div class="recent" style="margin-top:0.75rem;">
      <div class="recent-header">
        <span>Recent chore sessions</span>
      </div>
      <ul class="activity-list">
        ${rows || '<li class="activity-item"><div class="activity-meta">No chores recorded yet</div></li>'}
      </ul>
    </div>
  </section>`;
}

function renderScreenCard(key, label, totalMinutes, log) {
  const adjustId = `screen-adjust-${key}`;
  const recent = (log || []).slice(0, 5);

  const hours = Math.floor(totalMinutes / 60);
  const mins  = totalMinutes % 60;
  const summary = `${totalMinutes} min (${hours} h ${mins} min) in bank`;

  const cap = 120;
  const pct = Math.max(0, Math.min(100, (Math.abs(totalMinutes) / cap) * 100));

  const items = recent.map(item => {
    const date = formatDate(item.timestamp);
    const sign = item.action === 'add' ? '+' : '−';
    const cls = item.action === 'add' ? 'activity-amount positive' : 'activity-amount negative';
    return `<li class="activity-item">
      <div class="activity-main">
        <span class="activity-title">${item.reason || 'Screen time'}</span>
        <span class="${cls}">${sign}${item.minutes} min</span>
      </div>
      <div class="activity-meta">${date}</div>
    </li>`;
  }).join('');

  return `<section class="card">
    <div class="card-header">
      <div>
        <div class="card-title">${label}'s screen time</div>
        <div class="card-subtitle">Screen time bank</div>
      </div>
    </div>

    <div class="card-balance">
      <div class="balance-value">${totalMinutes} min</div>
      <div class="balance-secondary">${summary}</div>
      <div class="progress">
        <div class="progress-fill" style="width:${pct}%;"></div>
      </div>
      <div class="progress-label">Approx. out of 120 min reference</div>
    </div>

    <div class="actions-row">
      <button class="btn primary" type="button"
        data-toggle="inline-form" data-target="${adjustId}">
        Adjust minutes
      </button>
    </div>

    <div id="${adjustId}" class="inline-form">
      <form action="/transaction" method="POST">
        <input type="hidden" name="feature" value="screen">
        <input type="hidden" name="child" value="${key}">
        <div class="segmented">
          <label>
            <input type="radio" name="action" value="add" checked>
            <span>Add</span>
          </label>
          <label>
            <input type="radio" name="action" value="deduct">
            <span>Deduct</span>
          </label>
        </div>
        <div class="form-row">
          <label>Minutes</label>
          <input type="number" name="amount" step="1" min="1" required>
        </div>
        <div class="form-row">
          <label>Reason</label>
          <input type="text" name="reason" placeholder="e.g. Movie night" required>
        </div>
        <button type="submit" class="btn primary full">Save</button>
      </form>
    </div>

    <div class="recent">
      <div class="recent-header">
        <span>Recent changes</span>
      </div>
      <ul class="activity-list">
        ${items || '<li class="activity-item"><div class="activity-meta">No screen time history yet</div></li>'}
      </ul>
    </div>
  </section>`;
}

/* -------------------------- PWA SUPPORT -------------------------- */

function pwaManifest() {
  const manifest = {
    name: "Kids Home Hub",
    short_name: "KidsHub",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#01579b",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" }
  });
}

function serviceWorkerScript() {
  const sw = `
const CACHE_NAME = 'kids-hub-v1';
const ASSETS = ['/', '/manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
`;
  return new Response(sw, {
    headers: { "Content-Type": "application/javascript" }
  });
}
