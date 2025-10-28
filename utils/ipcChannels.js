/**
 * IPC Channel Registry
 *
 * Centralized registry of all IPC channels with validation and documentation
 */

/**
 * @typedef {Object} ChannelDefinition
 * @property {string} channel - Channel name
 * @property {string} description - What this channel does
 * @property {string} direction - 'main-to-renderer' or 'renderer-to-main' or 'bidirectional'
 * @property {boolean} requiresResponse - Whether this channel expects a response
 */

/**
 * All registered IPC channels
 * @type {Object.<string, ChannelDefinition>}
 */
const IPC_CHANNELS = {
  // Application
  'app:get-version': {
    description: 'Get application version',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Notifications
  'notification:show': {
    description: 'Show a notification',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:show-typed': {
    description: 'Show a typed notification (info, success, warning, error)',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:close': {
    description: 'Close a notification by ID',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:close-all': {
    description: 'Close all active notifications',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:get-history': {
    description: 'Get notification history',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:clear-history': {
    description: 'Clear notification history',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:get-queue': {
    description: 'Get queued notifications',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:clear-queue': {
    description: 'Clear notification queue',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:dnd-enable': {
    description: 'Enable Do Not Disturb mode',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:dnd-disable': {
    description: 'Disable Do Not Disturb mode',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:dnd-toggle': {
    description: 'Toggle Do Not Disturb mode',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:dnd-status': {
    description: 'Get Do Not Disturb status',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:get-stats': {
    description: 'Get notification statistics',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'notification:reply-received': {
    description: 'Notification reply received event',
    direction: 'main-to-renderer',
    requiresResponse: false
  },
  'notification:action-clicked': {
    description: 'Notification action clicked event',
    direction: 'main-to-renderer',
    requiresResponse: false
  },

  // File Dialogs
  'dialog:openFile': {
    description: 'Open file dialog',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'dialog:openFiles': {
    description: 'Open multiple files dialog',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'dialog:saveFile': {
    description: 'Save file dialog',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'dialog:selectDirectory': {
    description: 'Select directory dialog',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // System
  'system:info': {
    description: 'Get system information',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'system:power': {
    description: 'Get power status',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'system:screen': {
    description: 'Get screen information',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Window
  'window:minimize': {
    description: 'Minimize window',
    direction: 'renderer-to-main',
    requiresResponse: false
  },
  'window:maximize': {
    description: 'Maximize window',
    direction: 'renderer-to-main',
    requiresResponse: false
  },
  'window:close': {
    description: 'Close window',
    direction: 'renderer-to-main',
    requiresResponse: false
  },

  // Store
  'store:get': {
    description: 'Get value from store',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:set': {
    description: 'Set value in store',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:delete': {
    description: 'Delete value from store',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:clear': {
    description: 'Clear entire store',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Shell Integration
  'shell:openExternal': {
    description: 'Open URL in default browser',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shell:openPath': {
    description: 'Open file in default application',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shell:showItemInFolder': {
    description: 'Show item in file explorer',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shell:moveItemToTrash': {
    description: 'Move item to trash',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shell:beep': {
    description: 'Play system beep sound',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'protocol:url-received': {
    description: 'Custom protocol URL received event',
    direction: 'main-to-renderer',
    requiresResponse: false
  }
};

/**
 * Check if a channel is registered
 * @param {string} channel - Channel name
 * @returns {boolean}
 */
function isValidChannel(channel) {
  return channel in IPC_CHANNELS;
}

/**
 * Get all registered channels
 * @returns {string[]}
 */
function getAllChannels() {
  return Object.keys(IPC_CHANNELS);
}

/**
 * Get channels by direction
 * @param {'main-to-renderer'|'renderer-to-main'|'bidirectional'} direction
 * @returns {string[]}
 */
function getChannelsByDirection(direction) {
  return Object.entries(IPC_CHANNELS)
    .filter(([_, def]) => def.direction === direction)
    .map(([channel]) => channel);
}

/**
 * Get channel definition
 * @param {string} channel
 * @returns {ChannelDefinition|null}
 */
function getChannelDefinition(channel) {
  return IPC_CHANNELS[channel] || null;
}

module.exports = {
  IPC_CHANNELS,
  isValidChannel,
  getAllChannels,
  getChannelsByDirection,
  getChannelDefinition
};
