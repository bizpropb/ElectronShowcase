/**
 * IPC Helper Utilities
 *
 * Provides robust IPC communication with error handling, timeouts, and validation
 */

const { isValidChannel } = require('./ipcChannels');

/**
 * Default timeout for IPC calls (5 seconds)
 */
const DEFAULT_TIMEOUT = 5000;

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @param {string} channel - Channel name for error message
 * @returns {Promise}
 */
function createTimeout(ms, channel) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`IPC timeout: ${channel} did not respond within ${ms}ms`));
    }, ms);
  });
}

/**
 * Safe IPC invoke with timeout and error handling
 * @param {import('electron').IpcRenderer} ipcRenderer - IPC renderer instance
 * @param {string} channel - Channel name
 * @param {any} data - Data to send
 * @param {Object} options - Options
 * @param {number} [options.timeout=5000] - Timeout in milliseconds
 * @param {boolean} [options.validate=true] - Validate channel before sending
 * @returns {Promise<any>}
 */
async function safeInvoke(ipcRenderer, channel, data, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    validate = true
  } = options;

  // Validate channel if requested
  if (validate && !isValidChannel(channel)) {
    throw new Error(`Invalid IPC channel: ${channel}`);
  }

  try {
    // Race between the IPC call and timeout
    const result = await Promise.race([
      ipcRenderer.invoke(channel, data),
      createTimeout(timeout, channel)
    ]);

    return result;
  } catch (error) {
    // Enhance error with channel information
    const enhancedError = new Error(`IPC Error [${channel}]: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.channel = channel;
    throw enhancedError;
  }
}

/**
 * Batch IPC calls with error handling
 * @param {import('electron').IpcRenderer} ipcRenderer - IPC renderer instance
 * @param {Array<{channel: string, data: any}>} calls - Array of calls
 * @param {Object} options - Options
 * @returns {Promise<Array<{success: boolean, result?: any, error?: Error}>>}
 */
async function batchInvoke(ipcRenderer, calls, options = {}) {
  const promises = calls.map(async ({ channel, data }) => {
    try {
      const result = await safeInvoke(ipcRenderer, channel, data, options);
      return { success: true, result, channel };
    } catch (error) {
      return { success: false, error, channel };
    }
  });

  return Promise.all(promises);
}

/**
 * Create a progress-enabled IPC call
 * Useful for long-running operations
 * @param {import('electron').IpcRenderer} ipcRenderer - IPC renderer instance
 * @param {string} channel - Channel name
 * @param {any} data - Data to send
 * @param {Function} onProgress - Progress callback (percent: number) => void
 * @param {Object} options - Options
 * @returns {Promise<any>}
 */
async function invokeWithProgress(ipcRenderer, channel, data, onProgress, options = {}) {
  // Set up progress listener
  const progressChannel = `${channel}:progress`;

  const progressHandler = (event, progressData) => {
    if (typeof onProgress === 'function') {
      onProgress(progressData);
    }
  };

  ipcRenderer.on(progressChannel, progressHandler);

  try {
    const result = await safeInvoke(ipcRenderer, channel, data, options);
    return result;
  } finally {
    // Clean up progress listener
    ipcRenderer.removeListener(progressChannel, progressHandler);
  }
}

/**
 * Retry an IPC call with exponential backoff
 * @param {import('electron').IpcRenderer} ipcRenderer - IPC renderer instance
 * @param {string} channel - Channel name
 * @param {any} data - Data to send
 * @param {Object} options - Options
 * @param {number} [options.maxRetries=3] - Maximum number of retries
 * @param {number} [options.baseDelay=1000] - Base delay in milliseconds
 * @returns {Promise<any>}
 */
async function invokeWithRetry(ipcRenderer, channel, data, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    ...invokeOptions
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await safeInvoke(ipcRenderer, channel, data, invokeOptions);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: baseDelay * 2^attempt
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`IPC retry ${attempt + 1}/${maxRetries} for ${channel} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`IPC failed after ${maxRetries} retries: ${lastError.message}`);
}

/**
 * Logger for IPC calls (useful for debugging)
 */
class IPCLogger {
  constructor(enabled = false) {
    this.enabled = enabled;
    this.logs = [];
    this.maxLogs = 100;
  }

  log(type, channel, data, result) {
    if (!this.enabled) return;

    const entry = {
      timestamp: new Date().toISOString(),
      type,
      channel,
      data,
      result
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.log(`[IPC ${type}] ${channel}`, { data, result });
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

module.exports = {
  safeInvoke,
  batchInvoke,
  invokeWithProgress,
  invokeWithRetry,
  IPCLogger,
  DEFAULT_TIMEOUT
};
