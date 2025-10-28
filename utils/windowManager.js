const { BrowserWindow, screen } = require('electron');
const path = require('path');
const EventEmitter = require('events');

/**
 * Window Manager
 * Manages multiple windows with lifecycle, state persistence, and positioning
 */
class WindowManager extends EventEmitter {
  constructor(storeManager) {
    super();

    this.storeManager = storeManager;

    // Window registry: windowId => BrowserWindow instance
    this.windows = new Map();

    // Window configurations
    this.windowConfigs = {
      about: {
        width: 500,
        height: 400,
        resizable: false,
        minimizable: false,
        maximizable: false,
        modal: true,
        autoHideMenuBar: true,
        title: 'About Electron Feature Explorer'
      },
      settings: {
        width: 800,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        title: 'Settings',
        autoHideMenuBar: true,
        persistent: true
      },
      floatingNote: {
        width: 300,
        height: 200,
        minWidth: 200,
        minHeight: 150,
        frame: false,
        transparent: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        title: 'Floating Note',
        hasShadow: true
      },
      overlay: {
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        title: 'Overlay Window'
      }
    };

    // Statistics
    this.stats = {
      totalCreated: 0,
      totalClosed: 0,
      currentOpen: 0
    };
  }

  /**
   * Create a new window
   * @param {string} type - Window type (about, settings, floatingNote, overlay)
   * @param {Object} options - Additional window options
   * @param {BrowserWindow} parent - Parent window (for modal)
   * @returns {BrowserWindow} Created window instance
   */
  createWindow(type, options = {}, parent = null) {
    const windowId = `${type}-${Date.now()}`;

    // Get base configuration
    const baseConfig = this.windowConfigs[type] || {};

    // Load saved window state if persistent
    let savedState = null;
    if (baseConfig.persistent) {
      savedState = this.loadWindowState(type);
    }

    // Merge configurations
    const windowConfig = {
      ...baseConfig,
      ...savedState,
      ...options,
      backgroundColor: '#0d1117',
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, '..', 'preload.js')
      }
    };

    // Set parent if modal
    if (baseConfig.modal && parent) {
      windowConfig.parent = parent;
      windowConfig.modal = true;
    }

    // Ensure window is on screen
    if (savedState) {
      const bounds = { x: savedState.x, y: savedState.y, width: savedState.width, height: savedState.height };
      if (!this.isWindowOnScreen(bounds)) {
        // Center on primary display if saved position is off-screen
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        windowConfig.x = Math.round((width - windowConfig.width) / 2);
        windowConfig.y = Math.round((height - windowConfig.height) / 2);
      }
    }

    // Create window
    const window = new BrowserWindow(windowConfig);

    // Load HTML file
    const htmlFile = this.getHtmlFile(type);
    window.loadFile(htmlFile);

    // Show when ready
    window.once('ready-to-show', () => {
      window.show();
      if (options.focus !== false) {
        window.focus();
      }
    });

    // Setup window event handlers
    this.setupWindowHandlers(window, type, windowId);

    // Store window reference
    this.windows.set(windowId, {
      window,
      type,
      created: Date.now()
    });

    // Update stats
    this.stats.totalCreated++;
    this.stats.currentOpen++;

    // Emit event
    this.emit('window-created', { windowId, type, window });

    console.log(`Window created: ${type} (${windowId})`);

    return window;
  }

  /**
   * Setup window event handlers
   * @param {BrowserWindow} window - Window instance
   * @param {string} type - Window type
   * @param {string} windowId - Window identifier
   * @private
   */
  setupWindowHandlers(window, type, windowId) {
    // Save window state before closing (for persistent windows)
    window.on('close', () => {
      const config = this.windowConfigs[type];
      if (config && config.persistent) {
        this.saveWindowState(type, window);
      }
    });

    // Cleanup on closed
    window.on('closed', () => {
      this.windows.delete(windowId);
      this.stats.currentOpen--;
      this.stats.totalClosed++;

      this.emit('window-closed', { windowId, type });

      console.log(`Window closed: ${type} (${windowId})`);
    });

    // Focus events
    window.on('focus', () => {
      this.emit('window-focused', { windowId, type, window });
    });

    window.on('blur', () => {
      this.emit('window-blurred', { windowId, type, window });
    });

    // Minimize/maximize events
    window.on('minimize', () => {
      this.emit('window-minimized', { windowId, type });
    });

    window.on('maximize', () => {
      this.emit('window-maximized', { windowId, type });
    });

    window.on('unmaximize', () => {
      this.emit('window-unmaximized', { windowId, type });
    });
  }

  /**
   * Get HTML file path for window type
   * @param {string} type - Window type
   * @returns {string} HTML file path
   * @private
   */
  getHtmlFile(type) {
    const htmlFiles = {
      about: 'windows/about.html',
      settings: 'windows/settings.html',
      floatingNote: 'windows/floating-note.html',
      overlay: 'windows/overlay.html'
    };

    return htmlFiles[type] || 'index.html';
  }

  /**
   * Save window state to store
   * @param {string} type - Window type
   * @param {BrowserWindow} window - Window instance
   * @private
   */
  saveWindowState(type, window) {
    try {
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();

      const state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized
      };

      this.storeManager.set(`windowState.${type}`, state);

      console.log(`Window state saved: ${type}`, state);
    } catch (error) {
      console.error(`Error saving window state for ${type}:`, error);
    }
  }

  /**
   * Load window state from store
   * @param {string} type - Window type
   * @returns {Object|null} Window state or null
   * @private
   */
  loadWindowState(type) {
    try {
      const state = this.storeManager.get(`windowState.${type}`, null);

      if (state) {
        console.log(`Window state loaded: ${type}`, state);
        return state;
      }
    } catch (error) {
      console.error(`Error loading window state for ${type}:`, error);
    }

    return null;
  }

  /**
   * Check if window bounds are on screen
   * @param {Object} bounds - Window bounds {x, y, width, height}
   * @returns {boolean} True if on screen
   * @private
   */
  isWindowOnScreen(bounds) {
    const displays = screen.getAllDisplays();

    for (const display of displays) {
      const area = display.workArea;

      // Check if window center is within display
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      if (centerX >= area.x && centerX < area.x + area.width &&
          centerY >= area.y && centerY < area.y + area.height) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get window by ID
   * @param {string} windowId - Window identifier
   * @returns {BrowserWindow|null} Window instance or null
   */
  getWindow(windowId) {
    const entry = this.windows.get(windowId);
    return entry ? entry.window : null;
  }

  /**
   * Get windows by type
   * @param {string} type - Window type
   * @returns {Array} Array of window instances
   */
  getWindowsByType(type) {
    const windows = [];

    for (const [windowId, entry] of this.windows.entries()) {
      if (entry.type === type) {
        windows.push({
          windowId,
          window: entry.window,
          created: entry.created
        });
      }
    }

    return windows;
  }

  /**
   * Get all windows
   * @returns {Array} Array of all window entries
   */
  getAllWindows() {
    const windows = [];

    for (const [windowId, entry] of this.windows.entries()) {
      const bounds = entry.window.getBounds();
      windows.push({
        windowId,
        type: entry.type,
        created: entry.created,
        title: entry.window.getTitle(),
        isVisible: entry.window.isVisible(),
        isFocused: entry.window.isFocused(),
        isMinimized: entry.window.isMinimized(),
        isMaximized: entry.window.isMaximized(),
        bounds: bounds
      });
    }

    return windows;
  }

  /**
   * Show About window (convenience method)
   * @param {BrowserWindow} parent - Parent window for modal
   * @returns {BrowserWindow} Created window
   */
  showAbout(parent = null) {
    // Check if about window already exists
    const existing = this.getWindowsByType('about');
    if (existing.length > 0) {
      // Focus existing window
      this.focusWindow(existing[0].windowId);
      return existing[0].window;
    }

    // Create new about window
    return this.createWindow('about', {}, parent);
  }

  /**
   * Show Settings window (convenience method)
   * @returns {BrowserWindow} Created window
   */
  showSettings() {
    // Check if settings window already exists
    const existing = this.getWindowsByType('settings');
    if (existing.length > 0) {
      // Focus existing window
      this.focusWindow(existing[0].windowId);
      return existing[0].window;
    }

    // Create new settings window
    return this.createWindow('settings');
  }

  /**
   * Create floating note window (convenience method)
   * @returns {BrowserWindow} Created window
   */
  createFloatingNote() {
    return this.createWindow('floatingNote');
  }

  /**
   * Create overlay window (convenience method)
   * @param {Object} options - Additional options
   * @returns {BrowserWindow} Created window
   */
  createOverlay(options = {}) {
    const window = this.createWindow('overlay', options);

    // Auto-close overlay after 5 seconds
    setTimeout(() => {
      if (window && !window.isDestroyed()) {
        window.close();
      }
    }, 5000);

    return window;
  }

  /**
   * Close window by ID
   * @param {string} windowId - Window identifier
   * @returns {boolean} True if closed
   */
  closeWindow(windowId) {
    const entry = this.windows.get(windowId);

    if (entry && entry.window) {
      entry.window.close();
      return true;
    }

    return false;
  }

  /**
   * Close all windows of a specific type
   * @param {string} type - Window type
   * @returns {number} Number of windows closed
   */
  closeWindowsByType(type) {
    let count = 0;

    for (const [windowId, entry] of this.windows.entries()) {
      if (entry.type === type) {
        entry.window.close();
        count++;
      }
    }

    return count;
  }

  /**
   * Close all windows except main
   * @returns {number} Number of windows closed
   */
  closeAllWindows() {
    let count = 0;

    for (const [windowId, entry] of this.windows.entries()) {
      entry.window.close();
      count++;
    }

    return count;
  }

  /**
   * Focus window by ID
   * @param {string} windowId - Window identifier
   * @returns {boolean} True if focused
   */
  focusWindow(windowId) {
    const entry = this.windows.get(windowId);

    if (entry && entry.window) {
      if (entry.window.isMinimized()) {
        entry.window.restore();
      }
      entry.window.show();
      entry.window.focus();
      return true;
    }

    return false;
  }

  /**
   * Get window statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      windowsByType: this.getWindowCountByType()
    };
  }

  /**
   * Get window count by type
   * @returns {Object} Count by type
   * @private
   */
  getWindowCountByType() {
    const counts = {};

    for (const entry of this.windows.values()) {
      counts[entry.type] = (counts[entry.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Position window at specific location
   * @param {string} windowId - Window identifier
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if positioned
   */
  positionWindow(windowId, x, y) {
    const entry = this.windows.get(windowId);

    if (entry && entry.window) {
      entry.window.setPosition(x, y);
      return true;
    }

    return false;
  }

  /**
   * Resize window
   * @param {string} windowId - Window identifier
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {boolean} True if resized
   */
  resizeWindow(windowId, width, height) {
    const entry = this.windows.get(windowId);

    if (entry && entry.window) {
      entry.window.setSize(width, height);
      return true;
    }

    return false;
  }

  /**
   * Center window on screen
   * @param {string} windowId - Window identifier
   * @returns {boolean} True if centered
   */
  centerWindow(windowId) {
    const entry = this.windows.get(windowId);

    if (entry && entry.window) {
      entry.window.center();
      return true;
    }

    return false;
  }

  /**
   * Cleanup - close all managed windows
   */
  cleanup() {
    console.log('WindowManager cleaning up...');

    for (const [windowId, entry] of this.windows.entries()) {
      try {
        if (!entry.window.isDestroyed()) {
          entry.window.close();
        }
      } catch (error) {
        console.error(`Error closing window ${windowId}:`, error);
      }
    }

    this.windows.clear();
  }
}

module.exports = WindowManager;
