// ui-sync-integration.js - UI Integration with Sync Manager

import { syncManager } from './sync-manager.js';

/**
 * OptimisticUI - Handles optimistic UI updates and rollbacks
 */
class OptimisticUI {
  constructor() {
    this.pendingUpdates = new Map();
  }

  /**
   * Update balance optimistically
   */
  updateBalance(childId, type, amount, action) {
    const elementId = `${type}-balance-${childId}`;
    const element = document.getElementById(elementId);

    if (!element) {
      console.warn(`Balance element not found: ${elementId}`);
      return;
    }

    // Store original value for potential rollback
    const originalValue = parseFloat(element.textContent) || 0;
    const updateId = `${childId}-${type}-${Date.now()}`;

    this.pendingUpdates.set(updateId, {
      elementId,
      originalValue,
      timestamp: Date.now(),
    });

    // Calculate new value
    const delta = action === 'add' ? amount : -amount;
    const newValue = originalValue + delta;

    // Update UI
    element.textContent = this.formatBalance(type, newValue);
    element.classList.add('pending-sync');

    // Show sync indicator
    this.showSyncIndicator(childId, 'syncing');

    return updateId;
  }

  /**
   * Confirm balance update (sync succeeded)
   */
  confirmBalance(updateId) {
    const update = this.pendingUpdates.get(updateId);

    if (!update) return;

    const element = document.getElementById(update.elementId);

    if (element) {
      element.classList.remove('pending-sync');
      element.classList.add('sync-success');

      // Remove success indicator after animation
      setTimeout(() => {
        element.classList.remove('sync-success');
      }, 2000);
    }

    this.pendingUpdates.delete(updateId);
  }

  /**
   * Rollback balance update (sync failed)
   */
  rollbackBalance(updateId) {
    const update = this.pendingUpdates.get(updateId);

    if (!update) return;

    const element = document.getElementById(update.elementId);

    if (element) {
      // Restore original value
      const type = update.elementId.split('-')[0];
      element.textContent = this.formatBalance(type, update.originalValue);

      element.classList.remove('pending-sync');
      element.classList.add('sync-error');

      // Remove error indicator after animation
      setTimeout(() => {
        element.classList.remove('sync-error');
      }, 2000);
    }

    this.pendingUpdates.delete(updateId);
  }

  /**
   * Add transaction to history optimistically
   */
  addToHistory(childId, transaction) {
    const historyId = `${transaction.type}-history-${childId}`;
    const historyElement = document.getElementById(historyId);

    if (!historyElement) return;

    const entry = this.createHistoryEntry(transaction);
    entry.dataset.transactionId = transaction.id;
    entry.classList.add('pending-sync');

    // Insert at the top
    historyElement.insertBefore(entry, historyElement.firstChild);
  }

  /**
   * Mark history entry as synced
   */
  markHistorySynced(transactionId) {
    const entry = document.querySelector(`[data-transaction-id="${transactionId}"]`);

    if (entry) {
      entry.classList.remove('pending-sync');
      entry.classList.add('synced');

      setTimeout(() => {
        entry.classList.remove('synced');
      }, 2000);
    }
  }

  /**
   * Remove history entry (rollback)
   */
  removeFromHistory(transactionId) {
    const entry = document.querySelector(`[data-transaction-id="${transactionId}"]`);

    if (entry) {
      entry.classList.add('removing');
      setTimeout(() => entry.remove(), 300);
    }
  }

  /**
   * Create history entry element
   */
  createHistoryEntry(transaction) {
    const li = document.createElement('li');
    li.className = 'activity-item';

    const actionSign = transaction.action === 'add' ? '+' : '−';
    const actionClass = transaction.action === 'add' ? 'positive' : 'negative';

    let amountDisplay;
    if (transaction.type === 'money') {
      amountDisplay = `${actionSign}£${transaction.amount.toFixed(2)}`;
    } else if (transaction.type === 'points') {
      amountDisplay = `${actionSign}${transaction.amount} pts`;
    } else {
      amountDisplay = `${actionSign}${transaction.amount} min`;
    }

    li.innerHTML = `
      <div class="activity-main">
        <span class="activity-title">${transaction.reason || 'Transaction'}</span>
        <span class="activity-amount ${actionClass}">${amountDisplay}</span>
      </div>
      <div class="activity-meta">${this.formatDate(transaction.timestamp)}</div>
    `;

    return li;
  }

  /**
   * Show sync status indicator
   */
  showSyncIndicator(childId, status) {
    const indicator = document.getElementById('sync-indicator') || this.createSyncIndicator();

    switch (status) {
      case 'syncing':
        indicator.textContent = 'Syncing...';
        indicator.className = 'sync-indicator syncing';
        indicator.style.display = 'block';
        break;

      case 'synced':
        indicator.textContent = 'Synced ✓';
        indicator.className = 'sync-indicator synced';
        indicator.style.display = 'block';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 2000);
        break;

      case 'offline':
        indicator.textContent = 'Offline - will sync when online';
        indicator.className = 'sync-indicator offline';
        indicator.style.display = 'block';
        break;

      case 'error':
        indicator.textContent = 'Sync failed - retrying...';
        indicator.className = 'sync-indicator error';
        indicator.style.display = 'block';
        break;

      default:
        indicator.style.display = 'none';
    }
  }

  /**
   * Create sync indicator element
   */
  createSyncIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.className = 'sync-indicator';
    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * Format balance for display
   */
  formatBalance(type, value) {
    if (type === 'money') {
      return `£${value.toFixed(2)}`;
    } else if (type === 'points') {
      return `${Math.round(value)} pts`;
    } else {
      return `${Math.round(value)} min`;
    }
  }

  /**
   * Format date for display
   */
  formatDate(timestamp) {
    try {
      return new Date(timestamp).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  }
}

/**
 * SyncStatusUI - Manages sync status display
 */
class SyncStatusUI {
  constructor() {
    this.statusElement = null;
    this.init();
  }

  init() {
    this.createStatusElement();
    this.attachEventListeners();
  }

  createStatusElement() {
    this.statusElement = document.createElement('div');
    this.statusElement.id = 'sync-status';
    this.statusElement.className = 'sync-status hidden';
    this.statusElement.innerHTML = `
      <div class="sync-status-content">
        <span class="sync-status-icon"></span>
        <span class="sync-status-text"></span>
        <button class="sync-status-close" onclick="this.parentElement.parentElement.classList.add('hidden')">×</button>
      </div>
    `;
    document.body.appendChild(this.statusElement);
  }

  attachEventListeners() {
    // Listen to sync manager events
    syncManager.on('sync-start', () => this.showStatus('Syncing...', 'syncing'));
    syncManager.on('sync-complete', () => this.showStatus('Synced successfully', 'success', 3000));
    syncManager.on('sync-error', (error) => this.showStatus(`Sync error: ${error.message}`, 'error'));
    syncManager.on('online', () => this.showStatus('Online - syncing...', 'online', 2000));
    syncManager.on('offline', () => this.showStatus('Offline - changes will sync when online', 'offline'));
    syncManager.on('conflict-detected', () => this.showConflictNotification());
  }

  showStatus(text, type, duration = null) {
    const textElement = this.statusElement.querySelector('.sync-status-text');
    const iconElement = this.statusElement.querySelector('.sync-status-icon');

    textElement.textContent = text;
    iconElement.className = `sync-status-icon ${type}`;

    this.statusElement.className = `sync-status ${type}`;

    if (duration) {
      setTimeout(() => {
        this.statusElement.classList.add('hidden');
      }, duration);
    }
  }

  showConflictNotification() {
    this.showStatus('Data conflict detected - tap to resolve', 'conflict');

    this.statusElement.style.cursor = 'pointer';
    this.statusElement.onclick = () => {
      window.location.href = '#/conflicts';
    };
  }

  async updatePendingCount() {
    const count = await syncManager.getPendingSyncCount();

    if (count > 0) {
      this.showStatus(`${count} change${count === 1 ? '' : 's'} pending sync`, 'pending');
    }
  }
}

/**
 * TransactionFormHandler - Handles transaction form submissions
 */
class TransactionFormHandler {
  constructor(optimisticUI) {
    this.optimisticUI = optimisticUI;
  }

  async handleMoneyTransaction(formData) {
    const transaction = {
      childId: formData.get('child'),
      type: 'money',
      action: formData.get('action'),
      amount: parseFloat(formData.get('amount')),
      currency: formData.get('currency'),
      reason: formData.get('reason'),
    };

    // Convert to GBP
    const conversionRates = { GBP: 1, AUD: 0.56 };
    const rate = conversionRates[transaction.currency];
    const convertedAmount = parseFloat((transaction.amount * rate).toFixed(2));

    // Optimistic UI update
    const updateId = this.optimisticUI.updateBalance(
      transaction.childId,
      'money',
      convertedAmount,
      transaction.action
    );

    try {
      // Add to sync manager
      const savedTransaction = await syncManager.addTransaction({
        ...transaction,
        amount: convertedAmount,
      });

      // Add to history
      this.optimisticUI.addToHistory(transaction.childId, savedTransaction);

      // Wait for sync (or timeout after 5s)
      await this.waitForSync(savedTransaction.id, 5000);

      // Confirm update
      this.optimisticUI.confirmBalance(updateId);
      this.optimisticUI.markHistorySynced(savedTransaction.id);

      return savedTransaction;

    } catch (error) {
      console.error('Transaction failed:', error);

      // Rollback UI
      this.optimisticUI.rollbackBalance(updateId);

      throw error;
    }
  }

  async handlePointsTransaction(formData) {
    const transaction = {
      childId: formData.get('child'),
      type: 'points',
      action: formData.get('action'),
      amount: parseInt(formData.get('amount'), 10),
      reason: formData.get('reason'),
    };

    const updateId = this.optimisticUI.updateBalance(
      transaction.childId,
      'points',
      transaction.amount,
      transaction.action
    );

    try {
      const savedTransaction = await syncManager.addTransaction(transaction);
      this.optimisticUI.addToHistory(transaction.childId, savedTransaction);

      await this.waitForSync(savedTransaction.id, 5000);

      this.optimisticUI.confirmBalance(updateId);
      this.optimisticUI.markHistorySynced(savedTransaction.id);

      return savedTransaction;

    } catch (error) {
      console.error('Transaction failed:', error);
      this.optimisticUI.rollbackBalance(updateId);
      throw error;
    }
  }

  async handleChores(childId, selectedChores) {
    const totalPoints = selectedChores.reduce((sum, c) => sum + c.points, 0);

    const chore = {
      childId,
      chores: selectedChores,
      totalPoints,
    };

    const updateId = this.optimisticUI.updateBalance(
      childId,
      'points',
      totalPoints,
      'add'
    );

    try {
      const savedChore = await syncManager.addChore(chore);

      await this.waitForSync(savedChore.id, 5000);

      this.optimisticUI.confirmBalance(updateId);

      return savedChore;

    } catch (error) {
      console.error('Chore submission failed:', error);
      this.optimisticUI.rollbackBalance(updateId);
      throw error;
    }
  }

  async waitForSync(entityId, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const checkSync = async () => {
        const transaction = await syncManager.db.transactions.get(entityId);
        const chore = await syncManager.db.chores.get(entityId);

        const entity = transaction || chore;

        if (entity?.syncStatus === 'synced') {
          resolve(entity);
        } else if (entity?.syncStatus === 'conflict') {
          reject(new Error('Sync conflict'));
        } else if (Date.now() - startTime > timeout) {
          // Timeout - but don't reject, just resolve
          // (sync will continue in background)
          resolve(entity);
        } else {
          setTimeout(checkSync, 100);
        }
      };

      checkSync();
    });
  }
}

/**
 * ConflictResolverUI - Handles conflict resolution UI
 */
class ConflictResolverUI {
  async showConflicts() {
    const conflicts = await syncManager.getUnresolvedConflicts();

    if (conflicts.length === 0) {
      this.showNoConflicts();
      return;
    }

    const container = document.getElementById('conflicts-container') || this.createConflictsContainer();

    container.innerHTML = '<h2>Resolve Data Conflicts</h2>';

    for (const conflict of conflicts) {
      const conflictElement = this.createConflictElement(conflict);
      container.appendChild(conflictElement);
    }

    container.style.display = 'block';
  }

  createConflictsContainer() {
    const container = document.createElement('div');
    container.id = 'conflicts-container';
    container.className = 'conflicts-container';
    document.body.appendChild(container);
    return container;
  }

  createConflictElement(conflict) {
    const div = document.createElement('div');
    div.className = 'conflict-item';
    div.innerHTML = `
      <div class="conflict-header">
        <h3>Conflict in ${conflict.entityType}</h3>
        <span class="conflict-time">${new Date(conflict.timestamp).toLocaleString()}</span>
      </div>

      <div class="conflict-versions">
        <div class="version local">
          <h4>Your Version (This Device)</h4>
          ${this.renderVersion(conflict.localVersion)}
          <button class="btn-resolve" onclick="resolveConflict('${conflict.id}', 'local')">
            Use My Version
          </button>
        </div>

        <div class="version server">
          <h4>Server Version (Other Device)</h4>
          ${this.renderVersion(conflict.serverVersion)}
          <button class="btn-resolve" onclick="resolveConflict('${conflict.id}', 'server')">
            Use Server Version
          </button>
        </div>
      </div>

      <div class="conflict-actions">
        <button class="btn-merge" onclick="resolveConflict('${conflict.id}', 'merge')">
          Merge Both (Keep Newer)
        </button>
      </div>
    `;
    return div;
  }

  renderVersion(version) {
    return `
      <div class="version-details">
        <p><strong>Type:</strong> ${version.type}</p>
        <p><strong>Action:</strong> ${version.action}</p>
        <p><strong>Amount:</strong> ${version.amount}</p>
        <p><strong>Reason:</strong> ${version.reason}</p>
        <p><strong>Time:</strong> ${new Date(version.timestamp).toLocaleString()}</p>
      </div>
    `;
  }

  showNoConflicts() {
    const container = document.getElementById('conflicts-container');

    if (container) {
      container.innerHTML = `
        <div class="no-conflicts">
          <h2>No Conflicts</h2>
          <p>All your data is in sync!</p>
        </div>
      `;
    }
  }
}

// ===============================================
// GLOBAL FUNCTIONS (for onclick handlers)
// ===============================================

window.resolveConflict = async (conflictId, strategy) => {
  try {
    await syncManager.resolveConflict(conflictId, strategy);

    // Refresh conflicts view
    const resolver = new ConflictResolverUI();
    await resolver.showConflicts();

    // Show success message
    showToast('Conflict resolved successfully', 'success');

  } catch (error) {
    console.error('Failed to resolve conflict:', error);
    showToast('Failed to resolve conflict', 'error');
  }
};

window.showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// ===============================================
// INITIALIZE
// ===============================================

const optimisticUI = new OptimisticUI();
const syncStatusUI = new SyncStatusUI();
const formHandler = new TransactionFormHandler(optimisticUI);

// Export for use in forms
export { optimisticUI, syncStatusUI, formHandler };

// Update pending count every 30 seconds
setInterval(() => {
  syncStatusUI.updatePendingCount();
}, 30000);

// Show conflicts page if hash is #/conflicts
if (window.location.hash === '#/conflicts') {
  const resolver = new ConflictResolverUI();
  resolver.showConflicts();
}
