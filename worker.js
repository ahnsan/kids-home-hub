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

<meta name="theme-color" content="#6366f1">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.webmanifest">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<style>
  :root {
    /* Primary - Playful Purple/Indigo */
    --primary-50: #f0f4ff;
    --primary-100: #e0e7ff;
    --primary-200: #c7d2fe;
    --primary-300: #a5b4fc;
    --primary-400: #818cf8;
    --primary-500: #6366f1;
    --primary-600: #4f46e5;
    --primary-700: #4338ca;
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --primary-light: #e0e7ff;

    /* Secondary - Energetic Pink/Magenta */
    --secondary-400: #e879f9;
    --secondary-500: #d946ef;
    --secondary-600: #c026d3;

    /* Accent - Vibrant Orange */
    --accent-400: #fb923c;
    --accent-500: #f97316;

    /* Success - Bright Green */
    --success: #22c55e;
    --success-light: #dcfce7;
    --success-dark: #16a34a;

    /* Reward - Golden Yellow */
    --reward-400: #facc15;
    --reward-500: #eab308;
    --reward-light: #fef9c3;

    /* Warning & Danger */
    --warning: #f59e0b;
    --warning-light: #fef3c7;
    --danger: #ef4444;
    --danger-light: #fee2e2;

    /* Surfaces */
    --surface: #ffffff;
    --background: #fafbff;
    --text-primary: #1a1a2e;
    --text-secondary: #525273;
    --text-muted: #8888a8;
    --border: #e4e4f0;

    /* Gradients */
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    --gradient-secondary: linear-gradient(135deg, #ec4899 0%, #d946ef 100%);
    --gradient-success: linear-gradient(135deg, #22c55e 0%, #10b981 100%);
    --gradient-reward: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    --gradient-rainbow: linear-gradient(135deg, #ec4899 0%, #8b5cf6 25%, #6366f1 50%, #06b6d4 75%, #10b981 100%);
    --gradient-ocean: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);
    --gradient-sunset: linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ec4899 100%);

    /* Colored Shadows */
    --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.06);
    --shadow-md: 0 4px 16px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 8px 32px rgba(15, 23, 42, 0.1);
    --shadow-xl: 0 16px 48px rgba(15, 23, 42, 0.12);
    --shadow-primary: 0 8px 32px rgba(99, 102, 241, 0.25);
    --shadow-success: 0 8px 32px rgba(34, 197, 94, 0.25);
    --shadow-reward: 0 8px 32px rgba(251, 191, 36, 0.25);

    /* Glass Morphism */
    --glass-bg: rgba(255, 255, 255, 0.7);
    --glass-border: 1px solid rgba(255, 255, 255, 0.3);
    --glass-blur: blur(12px);

    /* Radii */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 24px;
    --radius-2xl: 32px;

    /* Animation */
    --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--background);
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    background-image:
      radial-gradient(at 20% 10%, rgba(99, 102, 241, 0.08) 0px, transparent 50%),
      radial-gradient(at 80% 20%, rgba(217, 70, 239, 0.06) 0px, transparent 50%),
      radial-gradient(at 50% 80%, rgba(34, 197, 94, 0.04) 0px, transparent 50%);
  }

  .app {
    min-height: 100vh;
    padding: 5rem 1rem 6rem;
    max-width: 500px;
    margin: 0 auto;
  }

  /* Floating decorative elements */
  .app::before {
    content: '';
    position: fixed;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: var(--gradient-primary);
    opacity: 0.06;
    border-radius: 50%;
    pointer-events: none;
    z-index: -1;
  }

  h1 {
    font-family: 'Nunito', sans-serif;
    color: var(--text-primary);
    font-size: 1.75rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.03em;
  }

  /* Fixed top navigation for child switching */
  .child-switch-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-md);
  }

  .child-tab {
    flex: 1;
    border: none;
    background: transparent;
    padding: 1rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.3s var(--ease-spring);
    position: relative;
  }

  .child-tab::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: transparent;
    transition: all 0.3s ease;
  }

  .child-tab .avatar-small {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    object-fit: cover;
    border: 3px solid var(--border);
    transition: all 0.3s ease;
  }

  /* Adam - Blue theme */
  .child-tab[data-child="adam"].active {
    color: #2563eb;
    background: linear-gradient(180deg, rgba(37, 99, 235, 0.08) 0%, transparent 100%);
  }

  .child-tab[data-child="adam"].active::after {
    background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  }

  .child-tab[data-child="adam"].active .avatar-small {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }

  .child-tab[data-child="adam"]:not(.active):hover {
    background: rgba(59, 130, 246, 0.05);
    color: #3b82f6;
  }

  /* Sami - Green theme */
  .child-tab[data-child="sami"].active {
    color: #16a34a;
    background: linear-gradient(180deg, rgba(22, 163, 74, 0.08) 0%, transparent 100%);
  }

  .child-tab[data-child="sami"].active::after {
    background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  }

  .child-tab[data-child="sami"].active .avatar-small {
    border-color: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
  }

  .child-tab[data-child="sami"]:not(.active):hover {
    background: rgba(34, 197, 94, 0.05);
    color: #22c55e;
  }

  .child-tab:active {
    transform: scale(0.98);
  }

  /* Child-specific theming for cards */
  body.child-adam {
    --child-primary: #3b82f6;
    --child-primary-dark: #2563eb;
    --child-primary-light: #dbeafe;
    --child-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    --child-shadow: 0 8px 32px rgba(59, 130, 246, 0.25);
  }

  body.child-sami {
    --child-primary: #22c55e;
    --child-primary-dark: #16a34a;
    --child-primary-light: #dcfce7;
    --child-gradient: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    --child-shadow: 0 8px 32px rgba(34, 197, 94, 0.25);
  }

  /* Apply child theme to cards */
  body.child-adam .card-balance,
  body.child-sami .card-balance {
    background: var(--child-gradient);
  }

  body.child-adam .card::before,
  body.child-sami .card::before {
    background: var(--child-gradient);
  }

  body.child-adam .btn.primary,
  body.child-sami .btn.primary {
    background: var(--child-gradient);
    box-shadow: var(--shadow-md), var(--child-shadow);
  }

  body.child-adam .view-title .icon,
  body.child-sami .view-title .icon {
    background: var(--child-primary-light);
  }

  body.child-adam .chore-item .points,
  body.child-sami .chore-item .points {
    background: var(--child-primary-light);
    color: var(--child-primary-dark);
  }

  .view { display: none; }
  .view.active { display: block; animation: pageSlideIn 0.4s var(--ease-spring); }

  @keyframes pageSlideIn {
    from { opacity: 0; transform: translateY(20px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .view-title {
    font-family: 'Nunito', sans-serif;
    font-size: 1.2rem;
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding-left: 0.25rem;
  }

  .view-title .icon {
    font-size: 1.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--primary-100);
    border-radius: var(--radius-md);
  }

  .view-child { display: none; }
  .view-child.active { display: block; animation: cardEnter 0.5s var(--ease-spring); }

  @keyframes cardEnter {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }

  .card {
    background: var(--surface);
    border-radius: var(--radius-2xl);
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
    border: 1px solid rgba(228, 228, 240, 0.6);
    position: relative;
    overflow: hidden;
    transition: all 0.3s var(--ease-smooth);
  }

  .card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-primary);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  .card:hover::before {
    opacity: 1;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .avatar {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    object-fit: cover;
    box-shadow: var(--shadow-md);
    border: 3px solid var(--primary-100);
    transition: all 0.3s ease;
  }

  .card:hover .avatar {
    transform: scale(1.05);
    border-color: var(--primary-300);
  }

  .card-title {
    font-family: 'Nunito', sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text-primary);
  }

  .card-subtitle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.15rem;
    font-weight: 500;
  }

  .card-balance {
    background: var(--gradient-primary);
    border-radius: var(--radius-xl);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.25rem;
    position: relative;
    overflow: hidden;
  }

  .card-balance::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -30%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .card-balance::after {
    content: '';
    position: absolute;
    bottom: -40%;
    left: -20%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
  }

  .balance-value {
    font-family: 'Nunito', sans-serif;
    font-size: 2.5rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
    letter-spacing: -0.03em;
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .balance-secondary {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.85);
    margin-top: 0.35rem;
    position: relative;
    z-index: 1;
    font-weight: 500;
  }

  /* Card variants */
  .card-balance.success {
    background: var(--gradient-success);
  }

  .card-balance.reward {
    background: var(--gradient-reward);
  }

  .card-balance.reward .balance-value,
  .card-balance.reward .balance-secondary {
    color: #1a1a2e;
  }

  .actions-row {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .btn {
    border-radius: var(--radius-lg);
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;
    transition: all 0.3s var(--ease-spring);
    position: relative;
    overflow: hidden;
  }

  .btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .btn:hover::before {
    opacity: 1;
  }

  .btn.primary {
    background: var(--gradient-primary);
    color: #ffffff;
    box-shadow: var(--shadow-md), 0 4px 16px rgba(99, 102, 241, 0.3);
  }

  .btn.primary:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg), 0 8px 24px rgba(99, 102, 241, 0.4);
  }

  .btn.primary:active {
    transform: translateY(0) scale(0.98);
  }

  .btn.success {
    background: var(--gradient-success);
    color: #ffffff;
    box-shadow: var(--shadow-md), 0 4px 16px rgba(34, 197, 94, 0.3);
  }

  .btn.success:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-lg), 0 8px 24px rgba(34, 197, 94, 0.4);
  }

  .btn.ghost {
    background: var(--primary-100);
    color: var(--primary-600);
    border: 2px solid var(--primary-200);
  }

  .btn.ghost:hover {
    background: var(--primary-200);
    border-color: var(--primary-300);
    transform: translateY(-1px);
  }

  .btn.full {
    width: 100%;
    margin-top: 1rem;
    padding: 0.875rem;
    font-size: 0.95rem;
  }

  /* Ripple effect on click */
  @keyframes btnRipple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .inline-form {
    margin-top: 1rem;
    border-radius: var(--radius-xl);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(217, 70, 239, 0.02) 100%);
    padding: 1.25rem;
    display: none;
    border: 1px solid rgba(99, 102, 241, 0.1);
    backdrop-filter: blur(8px);
  }

  .inline-form.open {
    display: block;
    animation: formSlideIn 0.4s var(--ease-spring);
  }

  @keyframes formSlideIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .segmented {
    display: inline-flex;
    border-radius: var(--radius-lg);
    background: var(--surface);
    padding: 5px;
    margin-bottom: 1rem;
    border: 2px solid var(--border);
    box-shadow: var(--shadow-sm);
  }

  .segmented label {
    position: relative;
    border-radius: var(--radius-md);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.3s var(--ease-spring);
  }

  .segmented input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .segmented input:checked + span {
    background: var(--gradient-primary);
    color: #ffffff;
    box-shadow: var(--shadow-md), 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: scale(1.02);
  }

  .segmented span {
    display: inline-block;
    border-radius: var(--radius-md);
    padding: 0.5rem 1.25rem;
    transition: all 0.3s ease;
  }

  .segmented label:hover span {
    background: var(--primary-50);
  }

  .segmented input:checked + span:hover {
    background: var(--gradient-primary);
  }

  .form-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.875rem;
    gap: 0.35rem;
  }

  .form-row label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-left: 0.125rem;
  }

  .form-row input,
  .form-row select {
    border-radius: var(--radius-md);
    border: 2px solid var(--border);
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    background: var(--surface);
    transition: all 0.3s var(--ease-smooth);
    font-family: inherit;
  }

  .form-row input:hover,
  .form-row select:hover {
    border-color: var(--primary-300);
  }

  .form-row input:focus,
  .form-row select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px var(--primary-100);
  }

  .form-row input::placeholder {
    color: var(--text-muted);
  }

  .recent {
    margin-top: 1.25rem;
    padding-top: 1.25rem;
    border-top: 2px solid var(--border);
  }

  .recent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .activity-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .activity-item {
    padding: 0.875rem 1rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, transparent 100%);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(228, 228, 240, 0.5);
    transition: all 0.3s ease;
  }

  .activity-item:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, transparent 100%);
    transform: translateX(4px);
  }

  .activity-item + .activity-item {
    border-top: none;
  }

  .activity-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .activity-title {
    font-size: 0.9rem;
    color: var(--text-primary);
    font-weight: 600;
  }

  .activity-amount {
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    border-radius: var(--radius-md);
    font-family: 'Nunito', sans-serif;
  }

  .activity-amount.positive {
    color: #166534;
    background: linear-gradient(135deg, var(--success-light) 0%, #bbf7d0 100%);
    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.15);
  }

  .activity-amount.negative {
    color: #991b1b;
    background: linear-gradient(135deg, var(--danger-light) 0%, #fecaca 100%);
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
  }

  .activity-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.35rem;
    font-weight: 500;
  }

  .chore-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .chore-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: var(--surface);
    border-radius: var(--radius-lg);
    border: 2px solid var(--border);
    transition: all 0.3s var(--ease-spring);
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .chore-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: var(--gradient-primary);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .chore-item:hover {
    border-color: var(--primary-300);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .chore-item:hover::before {
    opacity: 1;
  }

  .chore-item:has(input:checked) {
    background: linear-gradient(135deg, var(--success-light) 0%, #bbf7d0 100%);
    border-color: var(--success);
    transform: scale(0.98);
  }

  .chore-item:has(input:checked)::before {
    background: var(--gradient-success);
    opacity: 1;
  }

  .chore-item label {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    flex: 1;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-primary);
  }

  .chore-item input[type="checkbox"] {
    width: 22px;
    height: 22px;
    accent-color: var(--success);
    cursor: pointer;
    border-radius: var(--radius-sm);
  }

  .chore-item .points {
    font-family: 'Nunito', sans-serif;
    font-weight: 800;
    color: var(--primary-600);
    font-size: 0.95rem;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    padding: 0.35rem 0.875rem;
    border-radius: var(--radius-md);
    background: var(--primary-100);
    color: var(--primary-600);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
  }

  .chore-item:has(input:checked) .points {
    background: rgba(255, 255, 255, 0.8);
    color: var(--success-dark);
  }

  .small {
    font-size: 0.85rem;
    color: var(--text-secondary);
    background: linear-gradient(135deg, var(--reward-light) 0%, #fef3c7 100%);
    padding: 0.75rem 1rem;
    border-radius: var(--radius-lg);
    border: 1px solid rgba(251, 191, 36, 0.3);
    font-weight: 500;
  }

  .small strong {
    color: var(--reward-500);
    font-weight: 700;
  }

  .progress {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.3);
    overflow: hidden;
    margin-top: 0.75rem;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
    transition: width 0.8s var(--ease-spring);
    position: relative;
    overflow: hidden;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
    animation: progressShine 2s infinite;
  }

  @keyframes progressShine {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  .progress-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 0.5rem;
    font-weight: 500;
  }

  .bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-top: 1px solid rgba(255, 255, 255, 0.5);
    padding: 0.625rem 0.75rem calc(0.625rem + env(safe-area-inset-bottom));
    z-index: 100;
    box-shadow: 0 -8px 32px rgba(99, 102, 241, 0.1);
  }

  .nav-btn {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.6rem 0.5rem;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    color: var(--text-muted);
    border-radius: var(--radius-lg);
    transition: all 0.3s var(--ease-spring);
    cursor: pointer;
    position: relative;
  }

  .nav-btn .icon {
    font-size: 1.6rem;
    line-height: 1;
    transition: all 0.3s var(--ease-spring);
  }

  .nav-btn.active {
    color: var(--primary-600);
  }

  .nav-btn.active .icon {
    transform: scale(1.15);
  }

  .nav-btn.active::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 3px;
    background: var(--gradient-primary);
    border-radius: 999px;
  }

  .nav-btn:not(.active):hover {
    color: var(--primary-400);
    background: var(--primary-50);
  }

  .nav-btn:active {
    transform: scale(0.92);
  }

  /* Toast notification */
  .toast {
    position: fixed;
    bottom: 6rem;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: var(--gradient-primary);
    color: white;
    padding: 1rem 1.75rem;
    border-radius: var(--radius-xl);
    font-size: 0.95rem;
    font-weight: 600;
    z-index: 200;
    opacity: 0;
    transition: all 0.4s var(--ease-spring);
    pointer-events: none;
    box-shadow: var(--shadow-xl), 0 8px 32px rgba(99, 102, 241, 0.4);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .toast::before {
    content: '✓';
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-size: 0.8rem;
  }

  .toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, transparent 100%);
    border-radius: var(--radius-xl);
  }

  .empty-state .icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    display: block;
  }

  /* Success celebration animation */
  @keyframes celebrate {
    0% { transform: scale(1); }
    25% { transform: scale(1.1) rotate(-3deg); }
    50% { transform: scale(1.15) rotate(3deg); }
    75% { transform: scale(1.1) rotate(-2deg); }
    100% { transform: scale(1); }
  }

  .celebrate {
    animation: celebrate 0.6s var(--ease-bounce);
  }

  /* Coin floating animation for rewards */
  @keyframes coinFloat {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(-80px) scale(1); opacity: 0; }
  }

  .coin-animation {
    position: fixed;
    font-size: 2rem;
    animation: coinFloat 1s var(--ease-out) forwards;
    pointer-events: none;
    z-index: 300;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
</head>
<body>
  <div class="child-switch-wrapper" role="tablist" aria-label="Choose child">
    <button class="child-tab active" data-child="adam" role="tab" aria-selected="true">
      <img src="${adamImage}" alt="" class="avatar-small">
      <span>Adam</span>
    </button>
    <button class="child-tab" data-child="sami" role="tab" aria-selected="false">
      <img src="${samImage}" alt="" class="avatar-small">
      <span>Sami</span>
    </button>
  </div>

  <div class="app">

    <!-- BANK VIEW -->
    <main id="view-bank" class="view active" role="tabpanel" aria-label="Bank">
      <div class="view-title"><span class="icon">💰</span> Bank Account</div>

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
      <div class="view-title"><span class="icon">⭐</span> Reward Points</div>

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
      <div class="view-title"><span class="icon">✨</span> Weekly Chores</div>

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
      <div class="view-title"><span class="icon">📱</span> Screen Time</div>

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

  <!-- Toast notification -->
  <div id="toast" class="toast"></div>

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

    // Toast notification helper
    function showToast(message, duration = 2500) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), duration);
    }

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

      // Update body class for theming
      document.body.classList.remove('child-adam', 'child-sami');
      document.body.classList.add('child-' + child);

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

    // Form submission with loading state
    (function initFormSubmit() {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
          const btn = form.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:0.5rem;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg> Saving...</span>';
          }
        });
      });
    })();

    // Add spin animation
    const styleSheet = document.createElement('style');
    styleSheet.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(styleSheet);

    // Service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
      });
    }

    // Celebration effects for completing chores
    function createCelebration(x, y) {
      const emojis = ['⭐', '🎉', '✨', '💫', '🌟'];
      for (let i = 0; i < 5; i++) {
        const coin = document.createElement('div');
        coin.className = 'coin-animation';
        coin.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        coin.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
        coin.style.top = y + 'px';
        coin.style.animationDelay = (i * 0.1) + 's';
        document.body.appendChild(coin);
        setTimeout(() => coin.remove(), 1200);
      }
    }

    // Add celebration on chore checkbox
    document.querySelectorAll('.chore-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function(e) {
        if (this.checked) {
          const rect = this.getBoundingClientRect();
          createCelebration(rect.left + rect.width / 2, rect.top);
          this.closest('.chore-item').classList.add('celebrate');
          setTimeout(() => this.closest('.chore-item').classList.remove('celebrate'), 600);
        }
      });
    });
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
    background_color: "#fafbff",
    theme_color: "#6366f1",
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
