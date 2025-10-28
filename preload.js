const { contextBridge, ipcRenderer } = require('electron');
const { isValidChannel, getChannelsByDirection } = require('./utils/ipcChannels');

/**
 * Preload script for secure IPC communication
 *
 * This script runs in a special context that has access to both Node.js APIs
 * and the renderer's DOM. We use contextBridge to safely expose specific
 * functionality to the renderer process.
 *
 * Security: With contextIsolation enabled, this is the ONLY way for the
 * renderer to communicate with the main process.
 */

// Get all valid renderer-to-main channels
const validInvokeChannels = getChannelsByDirection('renderer-to-main');
const validEventChannels = getChannelsByDirection('main-to-renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Platform information
   */
  platform: process.platform,

  /**
   * Version information
   */
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },

  /**
   * Get application version
   * @returns {Promise<string>} Application version
   */
  getVersion: () => ipcRenderer.invoke('app:get-version'),

  /**
   * Notification APIs
   */

  /**
   * Show desktop notification with full options
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body text
   * @param {boolean} [options.silent] - Whether to play sound
   * @param {string} [options.urgency] - Urgency level: low, normal, critical
   * @param {Array} [options.actions] - Action buttons
   * @param {boolean} [options.hasReply] - Enable reply functionality
   * @param {string} [options.replyPlaceholder] - Reply input placeholder
   * @param {string} [options.type] - Notification type: info, success, warning, error
   * @returns {Promise<Object>} Result object with success status and notification ID
   */
  showNotification: (options) => ipcRenderer.invoke('notification:show', options),

  /**
   * Show typed notification (convenience method)
   * @param {string} type - Notification type: info, success, warning, error
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Result object
   */
  showNotificationTyped: (type, title, body, options) =>
    ipcRenderer.invoke('notification:show-typed', type, title, body, options),

  /**
   * Close specific notification by ID
   * @param {number} id - Notification ID
   * @returns {Promise<Object>} Result object
   */
  closeNotification: (id) => ipcRenderer.invoke('notification:close', id),

  /**
   * Close all active notifications
   * @returns {Promise<Object>} Result with count of closed notifications
   */
  closeAllNotifications: () => ipcRenderer.invoke('notification:close-all'),

  /**
   * Get notification history
   * @param {number} [limit=10] - Maximum number of items to return
   * @returns {Promise<Array>} Array of notification objects
   */
  getNotificationHistory: (limit) => ipcRenderer.invoke('notification:get-history', limit),

  /**
   * Clear notification history
   * @returns {Promise<Object>} Result object
   */
  clearNotificationHistory: () => ipcRenderer.invoke('notification:clear-history'),

  /**
   * Get queued notifications (DND mode)
   * @returns {Promise<Array>} Array of queued notification objects
   */
  getNotificationQueue: () => ipcRenderer.invoke('notification:get-queue'),

  /**
   * Clear notification queue
   * @returns {Promise<Object>} Result with count of cleared notifications
   */
  clearNotificationQueue: () => ipcRenderer.invoke('notification:clear-queue'),

  /**
   * Enable Do Not Disturb mode
   * @returns {Promise<Object>} Result object with enabled status
   */
  enableDND: () => ipcRenderer.invoke('notification:dnd-enable'),

  /**
   * Disable Do Not Disturb mode
   * @returns {Promise<Object>} Result object with enabled status
   */
  disableDND: () => ipcRenderer.invoke('notification:dnd-disable'),

  /**
   * Toggle Do Not Disturb mode
   * @returns {Promise<Object>} Result object with new enabled status
   */
  toggleDND: () => ipcRenderer.invoke('notification:dnd-toggle'),

  /**
   * Get Do Not Disturb status
   * @returns {Promise<Object>} Object with enabled property
   */
  getDNDStatus: () => ipcRenderer.invoke('notification:dnd-status'),

  /**
   * Get notification statistics
   * @returns {Promise<Object>} Statistics object
   */
  getNotificationStats: () => ipcRenderer.invoke('notification:get-stats'),

  /**
   * File Dialog APIs
   */

  /**
   * Show open file dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Result with canceled flag and filePaths array
   */
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),

  /**
   * Show open multiple files dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Result with canceled flag and filePaths array
   */
  openFilesDialog: (options) => ipcRenderer.invoke('dialog:openFiles', options),

  /**
   * Show save file dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Result with canceled flag and filePath string
   */
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  /**
   * Show select directory dialog
   * @param {Object} options - Dialog options
   * @returns {Promise<Object>} Result with canceled flag and filePaths array
   */
  selectDirectoryDialog: (options) => ipcRenderer.invoke('dialog:selectDirectory', options),

  /**
   * Show message box with custom buttons
   * @param {Object} options - Message box options
   * @param {string} options.type - Type: 'none', 'info', 'error', 'question', 'warning'
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Main message
   * @param {string} [options.detail] - Additional detail text
   * @param {Array<string>} [options.buttons] - Button labels
   * @returns {Promise<Object>} Result with response (button index clicked)
   */
  showMessageBox: (options) => ipcRenderer.invoke('dialog:showMessageBox', options),

  /**
   * File Operations APIs
   */

  /**
   * Read file content
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with success, content, and metadata
   */
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),

  /**
   * Write file content
   * @param {string} filePath - Path to file
   * @param {string} content - Content to write
   * @returns {Promise<Object>} Result with success flag
   */
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),

  /**
   * Get file metadata
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with metadata (size, dates, etc)
   */
  getFileMetadata: (filePath) => ipcRenderer.invoke('file:getMetadata', filePath),

  /**
   * Check if file exists
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with exists boolean
   */
  fileExists: (filePath) => ipcRenderer.invoke('file:exists', filePath),

  /**
   * Get recent files list
   * @returns {Promise<Object>} Result with recentFiles array
   */
  getRecentFiles: () => ipcRenderer.invoke('file:getRecent'),

  /**
   * Clear recent files list
   * @returns {Promise<Object>} Result with success flag
   */
  clearRecentFiles: () => ipcRenderer.invoke('file:clearRecent'),

  /**
   * Persistent Storage APIs (electron-store)
   */

  /**
   * Get value from store
   * @param {string} key - Key to retrieve
   * @param {any} [defaultValue] - Default value if key doesn't exist
   * @returns {Promise<Object>} Result with value
   */
  storeGet: (key, defaultValue) => ipcRenderer.invoke('store:get', key, defaultValue),

  /**
   * Set value in store
   * @param {string} key - Key to set
   * @param {any} value - Value to store
   * @returns {Promise<Object>} Result with success flag
   */
  storeSet: (key, value) => ipcRenderer.invoke('store:set', key, value),

  /**
   * Check if key exists in store
   * @param {string} key - Key to check
   * @returns {Promise<Object>} Result with exists boolean
   */
  storeHas: (key) => ipcRenderer.invoke('store:has', key),

  /**
   * Delete key from store
   * @param {string} key - Key to delete
   * @returns {Promise<Object>} Result with success flag
   */
  storeDelete: (key) => ipcRenderer.invoke('store:delete', key),

  /**
   * Clear all store data
   * @returns {Promise<Object>} Result with success flag
   */
  storeClear: () => ipcRenderer.invoke('store:clear'),

  /**
   * Reset store to defaults
   * @returns {Promise<Object>} Result with success flag
   */
  storeReset: () => ipcRenderer.invoke('store:reset'),

  /**
   * Get all store data
   * @returns {Promise<Object>} Result with data object
   */
  storeGetAll: () => ipcRenderer.invoke('store:getAll'),

  /**
   * Get store statistics
   * @returns {Promise<Object>} Result with stats
   */
  storeGetStats: () => ipcRenderer.invoke('store:getStats'),

  /**
   * Export store data as JSON
   * @param {boolean} [includeSecrets=false] - Include encrypted secrets
   * @returns {Promise<Object>} Result with JSON data string
   */
  storeExport: (includeSecrets) => ipcRenderer.invoke('store:export', includeSecrets),

  /**
   * Import store data from JSON
   * @param {string} jsonString - JSON data to import
   * @param {boolean} [merge=false] - Merge with existing data
   * @returns {Promise<Object>} Result with success flag
   */
  storeImport: (jsonString, merge) => ipcRenderer.invoke('store:import', jsonString, merge),

  /**
   * Set encrypted secret
   * @param {string} key - Key to store secret under
   * @param {string} value - Value to encrypt
   * @returns {Promise<Object>} Result with success flag
   */
  storeSetSecret: (key, value) => ipcRenderer.invoke('store:setSecret', key, value),

  /**
   * Get encrypted secret
   * @param {string} key - Key to retrieve secret
   * @returns {Promise<Object>} Result with decrypted value
   */
  storeGetSecret: (key) => ipcRenderer.invoke('store:getSecret', key),

  /**
   * Delete encrypted secret
   * @param {string} key - Key to delete
   * @returns {Promise<Object>} Result with success flag
   */
  storeDeleteSecret: (key) => ipcRenderer.invoke('store:deleteSecret', key),

  /**
   * Clipboard APIs
   */

  /**
   * Read text from clipboard
   * @returns {Promise<Object>} Result with text
   */
  clipboardReadText: () => ipcRenderer.invoke('clipboard:readText'),

  /**
   * Write text to clipboard
   * @param {string} text - Text to write
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardWriteText: (text) => ipcRenderer.invoke('clipboard:writeText', text),

  /**
   * Read HTML from clipboard
   * @returns {Promise<Object>} Result with html
   */
  clipboardReadHTML: () => ipcRenderer.invoke('clipboard:readHTML'),

  /**
   * Write HTML to clipboard
   * @param {string} html - HTML to write
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardWriteHTML: (html) => ipcRenderer.invoke('clipboard:writeHTML', html),

  /**
   * Read RTF from clipboard
   * @returns {Promise<Object>} Result with rtf
   */
  clipboardReadRTF: () => ipcRenderer.invoke('clipboard:readRTF'),

  /**
   * Write RTF to clipboard
   * @param {string} rtf - RTF to write
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardWriteRTF: (rtf) => ipcRenderer.invoke('clipboard:writeRTF', rtf),

  /**
   * Read image from clipboard
   * @returns {Promise<Object>} Result with image data
   */
  clipboardReadImage: () => ipcRenderer.invoke('clipboard:readImage'),

  /**
   * Write image to clipboard
   * @param {string} dataURL - Image data URL
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardWriteImage: (dataURL) => ipcRenderer.invoke('clipboard:writeImage', dataURL),

  /**
   * Get available clipboard formats
   * @returns {Promise<Object>} Result with formats array
   */
  clipboardAvailableFormats: () => ipcRenderer.invoke('clipboard:availableFormats'),

  /**
   * Check if clipboard has specific format
   * @param {string} format - Format to check
   * @returns {Promise<Object>} Result with has boolean
   */
  clipboardHas: (format) => ipcRenderer.invoke('clipboard:has', format),

  /**
   * Read all clipboard content
   * @returns {Promise<Object>} Result with all data
   */
  clipboardReadAll: () => ipcRenderer.invoke('clipboard:readAll'),

  /**
   * Clear clipboard
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardClear: () => ipcRenderer.invoke('clipboard:clear'),

  /**
   * Get clipboard history
   * @param {number} [limit=10] - Max items to return
   * @returns {Promise<Object>} Result with history array
   */
  clipboardGetHistory: (limit) => ipcRenderer.invoke('clipboard:getHistory', limit),

  /**
   * Clear clipboard history
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardClearHistory: () => ipcRenderer.invoke('clipboard:clearHistory'),

  /**
   * Restore item from history to clipboard
   * @param {number} id - History item ID
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardRestoreFromHistory: (id) => ipcRenderer.invoke('clipboard:restoreFromHistory', id),

  /**
   * Start monitoring clipboard changes
   * @param {number} [interval=1000] - Check interval in ms
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardStartMonitoring: (interval) => ipcRenderer.invoke('clipboard:startMonitoring', interval),

  /**
   * Stop monitoring clipboard changes
   * @returns {Promise<Object>} Result with success flag
   */
  clipboardStopMonitoring: () => ipcRenderer.invoke('clipboard:stopMonitoring'),

  /**
   * Check if monitoring is active
   * @returns {Promise<Object>} Result with monitoring boolean
   */
  clipboardIsMonitoring: () => ipcRenderer.invoke('clipboard:isMonitoring'),

  /**
   * Get clipboard statistics
   * @returns {Promise<Object>} Result with stats
   */
  clipboardGetStats: () => ipcRenderer.invoke('clipboard:getStats'),

  /**
   * Shell Integration APIs
   */

  /**
   * Open URL in default browser
   * @param {string} url - URL to open (http/https only)
   * @returns {Promise<Object>} Result with success flag
   */
  shellOpenExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  /**
   * Open file in default application
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with success flag
   */
  shellOpenPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),

  /**
   * Show file in file explorer
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with success flag
   */
  shellShowItemInFolder: (filePath) => ipcRenderer.invoke('shell:showItemInFolder', filePath),

  /**
   * Move file to trash (safe delete)
   * @param {string} filePath - Path to file
   * @returns {Promise<Object>} Result with success flag
   */
  shellMoveItemToTrash: (filePath) => ipcRenderer.invoke('shell:moveItemToTrash', filePath),

  /**
   * Play system beep sound
   * @returns {Promise<Object>} Result with success flag
   */
  shellBeep: () => ipcRenderer.invoke('shell:beep'),

  /**
   * Global Shortcuts APIs
   */

  /**
   * Get all registered shortcuts
   * @returns {Promise<Object>} Result with shortcuts array
   */
  shortcutsGetAll: () => ipcRenderer.invoke('shortcuts:getAll'),

  /**
   * Get a specific shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Promise<Object>} Result with shortcut object
   */
  shortcutsGet: (id) => ipcRenderer.invoke('shortcuts:get', id),

  /**
   * Register a new global shortcut
   * @param {string} id - Unique identifier
   * @param {string} accelerator - Keyboard shortcut (e.g., 'CommandOrControl+Alt+E')
   * @param {string} action - Action to trigger
   * @param {string} description - Human-readable description
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsRegister: (id, accelerator, action, description) =>
    ipcRenderer.invoke('shortcuts:register', id, accelerator, action, description),

  /**
   * Unregister a shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsUnregister: (id) => ipcRenderer.invoke('shortcuts:unregister', id),

  /**
   * Update an existing shortcut's accelerator
   * @param {string} id - Shortcut identifier
   * @param {string} newAccelerator - New keyboard shortcut
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsUpdate: (id, newAccelerator) =>
    ipcRenderer.invoke('shortcuts:update', id, newAccelerator),

  /**
   * Enable a disabled shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsEnable: (id) => ipcRenderer.invoke('shortcuts:enable', id),

  /**
   * Disable an enabled shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsDisable: (id) => ipcRenderer.invoke('shortcuts:disable', id),

  /**
   * Toggle shortcut enabled state
   * @param {string} id - Shortcut identifier
   * @returns {Promise<Object>} Result with success flag and new enabled state
   */
  shortcutsToggle: (id) => ipcRenderer.invoke('shortcuts:toggle', id),

  /**
   * Check if an accelerator is available
   * @param {string} accelerator - Keyboard shortcut to check
   * @returns {Promise<Object>} Result with availability info
   */
  shortcutsCheckAvailability: (accelerator) =>
    ipcRenderer.invoke('shortcuts:checkAvailability', accelerator),

  /**
   * Reset all shortcuts to defaults
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsResetToDefaults: () => ipcRenderer.invoke('shortcuts:resetToDefaults'),

  /**
   * Export shortcuts configuration
   * @returns {Promise<Object>} Result with config object
   */
  shortcutsExport: () => ipcRenderer.invoke('shortcuts:export'),

  /**
   * Import shortcuts configuration
   * @param {Object} config - Shortcuts configuration
   * @returns {Promise<Object>} Result with success flag
   */
  shortcutsImport: (config) => ipcRenderer.invoke('shortcuts:import', config),

  /**
   * Get shortcut statistics
   * @returns {Promise<Object>} Result with statistics
   */
  shortcutsGetStats: () => ipcRenderer.invoke('shortcuts:getStats'),

  /**
   * IPC Communication Helper
   * Sends a message to the main process and waits for response
   * Uses centralized channel validation
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   * @returns {Promise<any>} Response from main process
   */
  invoke: (channel, data) => {
    // Use centralized channel validation
    if (validInvokeChannels.includes(channel) || isValidChannel(channel)) {
      return ipcRenderer.invoke(channel, data);
    } else {
      console.error(`Invalid IPC channel: ${channel}`);
      return Promise.reject(new Error(`Channel ${channel} not allowed`));
    }
  },

  /**
   * Event listener registration
   * Uses centralized channel validation
   * @param {string} channel - Event channel name
   * @param {Function} callback - Callback function
   */
  on: (channel, callback) => {
    // Use centralized channel validation for main-to-renderer channels
    if (validEventChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    } else {
      console.error(`Invalid event channel: ${channel}`);
    }
  },

  /**
   * Remove event listener
   * @param {string} channel - Event channel name
   * @param {Function} callback - Callback function to remove
   */
  off: (channel, callback) => {
    // Use centralized channel validation
    if (validEventChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Log that preload script has loaded successfully
console.log('Preload script loaded - Secure IPC bridge established');
