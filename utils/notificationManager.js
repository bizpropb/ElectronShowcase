/**
 * Notification Manager Module
 *
 * Comprehensive notification system with:
 * - Queue management
 * - Do Not Disturb mode
 * - Notification history
 * - Actions and replies
 * - Multiple notification types
 */

const { Notification } = require('electron');
const path = require('path');

class NotificationManager {
  constructor() {
    // Notification queue for scheduled/pending notifications
    this.queue = [];

    // Notification history (last 50 notifications)
    this.history = [];
    this.maxHistorySize = 50;

    // Do Not Disturb mode
    this.doNotDisturb = false;

    // Active notifications map (id -> notification instance)
    this.activeNotifications = new Map();

    // Notification counter for unique IDs
    this.notificationCounter = 0;

    // Callbacks for events
    this.eventCallbacks = {
      'notification-shown': [],
      'notification-clicked': [],
      'notification-replied': [],
      'notification-action': [],
      'notification-closed': []
    };

    console.log('NotificationManager initialized');
  }

  /**
   * Check if notifications are supported
   */
  isSupported() {
    return Notification.isSupported();
  }

  /**
   * Enable Do Not Disturb mode
   */
  enableDoNotDisturb() {
    this.doNotDisturb = true;
    console.log('Do Not Disturb enabled');
  }

  /**
   * Disable Do Not Disturb mode
   */
  disableDoNotDisturb() {
    this.doNotDisturb = false;
    console.log('Do Not Disturb disabled');

    // Process any queued notifications
    this.processQueue();
  }

  /**
   * Toggle Do Not Disturb mode
   */
  toggleDoNotDisturb() {
    if (this.doNotDisturb) {
      this.disableDoNotDisturb();
    } else {
      this.enableDoNotDisturb();
    }
    return this.doNotDisturb;
  }

  /**
   * Get Do Not Disturb status
   */
  getDoNotDisturbStatus() {
    return this.doNotDisturb;
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @returns {Object} Result with success status and notification ID
   */
  show(options = {}) {
    if (!this.isSupported()) {
      return { success: false, error: 'Notifications not supported' };
    }

    // Generate unique ID
    const id = ++this.notificationCounter;

    // Create notification config
    const notificationConfig = {
      id,
      title: options.title || 'Notification',
      body: options.body || '',
      icon: options.icon || null,
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeoutType || 'default',
      actions: options.actions || [],
      hasReply: options.hasReply || false,
      replyPlaceholder: options.replyPlaceholder || 'Type a reply...',
      timestamp: new Date().toISOString(),
      type: options.type || 'info' // info, success, warning, error
    };

    // If Do Not Disturb is enabled, queue the notification
    if (this.doNotDisturb) {
      this.queue.push(notificationConfig);
      console.log(`Notification queued (DND mode): ${notificationConfig.title}`);
      return { success: true, id, queued: true };
    }

    try {
      // Create the notification
      const notification = new Notification({
        title: notificationConfig.title,
        body: notificationConfig.body,
        icon: notificationConfig.icon,
        silent: notificationConfig.silent,
        urgency: notificationConfig.urgency,
        timeoutType: notificationConfig.timeoutType,
        actions: notificationConfig.actions,
        hasReply: notificationConfig.hasReply,
        replyPlaceholder: notificationConfig.replyPlaceholder
      });

      // Store the notification
      this.activeNotifications.set(id, notification);

      // Handle notification events
      notification.on('show', () => {
        this.emit('notification-shown', { id, config: notificationConfig });
      });

      notification.on('click', () => {
        this.emit('notification-clicked', { id, config: notificationConfig });
      });

      notification.on('reply', (event, reply) => {
        this.emit('notification-replied', { id, reply, config: notificationConfig });
      });

      notification.on('action', (event, index) => {
        const action = notificationConfig.actions[index];
        this.emit('notification-action', { id, actionIndex: index, action, config: notificationConfig });
      });

      notification.on('close', () => {
        this.activeNotifications.delete(id);
        this.emit('notification-closed', { id, config: notificationConfig });
      });

      // Show the notification
      notification.show();

      // Add to history
      this.addToHistory(notificationConfig);

      console.log(`Notification shown: ${notificationConfig.title}`);
      return { success: true, id };

    } catch (error) {
      console.error('Error showing notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Show a notification of specific type with predefined styling
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} extraOptions - Additional options
   */
  showTyped(type, title, body, extraOptions = {}) {
    const typeConfig = {
      info: {
        urgency: 'normal',
        silent: false
      },
      success: {
        urgency: 'low',
        silent: false
      },
      warning: {
        urgency: 'normal',
        silent: false
      },
      error: {
        urgency: 'critical',
        silent: false
      }
    };

    const config = typeConfig[type] || typeConfig.info;

    return this.show({
      type,
      title,
      body,
      ...config,
      ...extraOptions
    });
  }

  /**
   * Close a notification by ID
   * @param {number} id - Notification ID
   */
  close(id) {
    const notification = this.activeNotifications.get(id);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(id);
      return { success: true };
    }
    return { success: false, error: 'Notification not found' };
  }

  /**
   * Close all active notifications
   */
  closeAll() {
    let count = 0;
    this.activeNotifications.forEach((notification, id) => {
      notification.close();
      count++;
    });
    this.activeNotifications.clear();
    console.log(`Closed ${count} active notifications`);
    return { success: true, count };
  }

  /**
   * Add notification to history
   */
  addToHistory(config) {
    this.history.unshift(config);

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get notification history
   * @param {number} limit - Maximum number of items to return
   */
  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }

  /**
   * Clear notification history
   */
  clearHistory() {
    this.history = [];
    console.log('Notification history cleared');
    return { success: true };
  }

  /**
   * Get queued notifications
   */
  getQueue() {
    return this.queue;
  }

  /**
   * Clear notification queue
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    console.log(`Cleared ${count} queued notifications`);
    return { success: true, count };
  }

  /**
   * Process notification queue
   * (Called when DND is disabled)
   */
  processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    console.log(`Processing ${this.queue.length} queued notifications`);
    const queueCopy = [...this.queue];
    this.queue = [];

    queueCopy.forEach(config => {
      // Remove id and re-show (will get new ID)
      const { id, ...configWithoutId } = config;
      this.show(configWithoutId);
    });
  }

  /**
   * Register event callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].push(callback);
    }
  }

  /**
   * Unregister event callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Emit event to all registered callbacks
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      historyCount: this.history.length,
      queuedCount: this.queue.length,
      activeCount: this.activeNotifications.size,
      doNotDisturb: this.doNotDisturb,
      totalShown: this.notificationCounter
    };
  }
}

// Export singleton instance
module.exports = new NotificationManager();
