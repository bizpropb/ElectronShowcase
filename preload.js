const { contextBridge, ipcRenderer } = require('electron');

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

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Platform information
   */
  platform: process.platform,

  /**
   * Get application version
   * @returns {Promise<string>} Application version
   */
  getVersion: () => ipcRenderer.invoke('app:get-version'),

  /**
   * IPC Communication Helper
   * Sends a message to the main process and waits for response
   * @param {string} channel - IPC channel name
   * @param {any} data - Data to send
   * @returns {Promise<any>} Response from main process
   */
  invoke: (channel, data) => {
    // Whitelist of allowed channels for security
    const validChannels = [
      'app:get-version',
      'system:info',
      'notification:show'
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    } else {
      console.error(`Invalid IPC channel: ${channel}`);
      return Promise.reject(new Error(`Channel ${channel} not allowed`));
    }
  },

  /**
   * Event listener registration
   * @param {string} channel - Event channel name
   * @param {Function} callback - Callback function
   */
  on: (channel, callback) => {
    const validChannels = ['notification:received', 'update:status'];

    if (validChannels.includes(channel)) {
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
    const validChannels = ['notification:received', 'update:status'];

    if (validChannels.includes(channel)) {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});

// Log that preload script has loaded successfully
console.log('Preload script loaded - Secure IPC bridge established');
