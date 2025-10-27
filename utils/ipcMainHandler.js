/**
 * IPC Main Handler Utilities
 *
 * Provides error handling wrappers for main process IPC handlers
 */

const { ipcMain } = require('electron');
const { isValidChannel } = require('./ipcChannels');

/**
 * Wrap an IPC handler with error handling and logging
 * @param {Function} handler - Handler function
 * @param {string} channel - Channel name for logging
 * @returns {Function} Wrapped handler
 */
function wrapHandler(handler, channel) {
  return async (event, ...args) => {
    try {
      const result = await handler(event, ...args);
      return result;
    } catch (error) {
      console.error(`IPC Handler Error [${channel}]:`, error);
      return {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  };
}

/**
 * Register an IPC handler with automatic error handling
 * @param {string} channel - Channel name
 * @param {Function} handler - Handler function
 * @param {Object} options - Options
 * @param {boolean} [options.validate=true] - Validate channel before registering
 * @param {boolean} [options.log=false] - Log IPC calls
 */
function handleIPC(channel, handler, options = {}) {
  const {
    validate = true,
    log = false
  } = options;

  // Validate channel
  if (validate && !isValidChannel(channel)) {
    console.warn(`Registering unvalidated IPC channel: ${channel}`);
  }

  // Wrap handler with error handling
  const wrappedHandler = wrapHandler(async (event, ...args) => {
    if (log) {
      console.log(`[IPC] ${channel}`, args);
    }

    const result = await handler(event, ...args);

    if (log) {
      console.log(`[IPC] ${channel} ->`, result);
    }

    return result;
  }, channel);

  ipcMain.handle(channel, wrappedHandler);
}

/**
 * Register multiple IPC handlers at once
 * @param {Object.<string, Function>} handlers - Map of channel to handler
 * @param {Object} options - Options
 */
function handleMultiple(handlers, options = {}) {
  Object.entries(handlers).forEach(([channel, handler]) => {
    handleIPC(channel, handler, options);
  });
}

/**
 * Remove an IPC handler
 * @param {string} channel - Channel name
 */
function removeHandler(channel) {
  ipcMain.removeHandler(channel);
}

/**
 * Send message to renderer
 * @param {import('electron').BrowserWindow} window - Window to send to
 * @param {string} channel - Channel name
 * @param {any} data - Data to send
 */
function sendToRenderer(window, channel, data) {
  if (!window || window.isDestroyed()) {
    console.warn(`Cannot send to destroyed window: ${channel}`);
    return;
  }

  window.webContents.send(channel, data);
}

module.exports = {
  wrapHandler,
  handleIPC,
  handleMultiple,
  removeHandler,
  sendToRenderer
};
