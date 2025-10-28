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
  },

  // Global Shortcuts - Main to Renderer Events
  'shortcut:triggered': {
    description: 'Global shortcut triggered event',
    direction: 'main-to-renderer',
    requiresResponse: false
  },

  // Window Management
  'window:create': {
    description: 'Create a new window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:showAbout': {
    description: 'Show About window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:showSettings': {
    description: 'Show Settings window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:createFloatingNote': {
    description: 'Create floating note window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:createOverlay': {
    description: 'Create overlay window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:getAll': {
    description: 'Get all open windows',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:focus': {
    description: 'Focus a specific window',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'window:position': {
    description: 'Position a window on screen',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // File Operations
  'file:read': {
    description: 'Read file content',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'file:write': {
    description: 'Write file content',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'file:getMetadata': {
    description: 'Get file metadata',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'file:exists': {
    description: 'Check if file exists',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'file:getRecent': {
    description: 'Get recent files',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'file:clearRecent': {
    description: 'Clear recent files',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'dialog:showMessageBox': {
    description: 'Show message box dialog',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Store Operations (Extended)
  'store:has': {
    description: 'Check if key exists in store',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:reset': {
    description: 'Reset store to defaults',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:getAll': {
    description: 'Get all store data',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:getStats': {
    description: 'Get store statistics',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:export': {
    description: 'Export store data',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:import': {
    description: 'Import store data',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:setSecret': {
    description: 'Set encrypted secret',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:getSecret': {
    description: 'Get encrypted secret',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'store:deleteSecret': {
    description: 'Delete encrypted secret',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Clipboard Operations
  'clipboard:readText': {
    description: 'Read text from clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:writeText': {
    description: 'Write text to clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:readHTML': {
    description: 'Read HTML from clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:writeHTML': {
    description: 'Write HTML to clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:readRTF': {
    description: 'Read RTF from clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:writeRTF': {
    description: 'Write RTF to clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:readImage': {
    description: 'Read image from clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:writeImage': {
    description: 'Write image to clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:availableFormats': {
    description: 'Get available clipboard formats',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:has': {
    description: 'Check if clipboard has format',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:readAll': {
    description: 'Read all clipboard content',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:clear': {
    description: 'Clear clipboard',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:getHistory': {
    description: 'Get clipboard history',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:clearHistory': {
    description: 'Clear clipboard history',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:restoreFromHistory': {
    description: 'Restore from clipboard history',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:startMonitoring': {
    description: 'Start clipboard monitoring',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:stopMonitoring': {
    description: 'Stop clipboard monitoring',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:isMonitoring': {
    description: 'Check if monitoring is active',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'clipboard:getStats': {
    description: 'Get clipboard statistics',
    direction: 'renderer-to-main',
    requiresResponse: true
  },

  // Global Shortcuts Operations
  'shortcuts:getAll': {
    description: 'Get all shortcuts',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:get': {
    description: 'Get a specific shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:register': {
    description: 'Register a new shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:unregister': {
    description: 'Unregister a shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:update': {
    description: 'Update a shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:enable': {
    description: 'Enable a shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:disable': {
    description: 'Disable a shortcut',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:toggle': {
    description: 'Toggle shortcut enabled state',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:checkAvailability': {
    description: 'Check if accelerator is available',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:resetToDefaults': {
    description: 'Reset shortcuts to defaults',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:export': {
    description: 'Export shortcuts configuration',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:import': {
    description: 'Import shortcuts configuration',
    direction: 'renderer-to-main',
    requiresResponse: true
  },
  'shortcuts:getStats': {
    description: 'Get shortcut statistics',
    direction: 'renderer-to-main',
    requiresResponse: true
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
