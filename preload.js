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
