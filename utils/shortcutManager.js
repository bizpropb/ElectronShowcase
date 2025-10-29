const { globalShortcut } = require('electron');
const EventEmitter = require('events');

/**
 * Global Shortcut Manager
 * Manages system-wide keyboard shortcuts with conflict detection,
 * customization, and persistence.
 */
class ShortcutManager extends EventEmitter {
  constructor() {
    super();

    // Registered shortcuts map: accelerator => { action, description, enabled }
    this.shortcuts = new Map();

    // Track which shortcuts are currently registered with Electron
    this.registeredAccelerators = new Set();

    // Default shortcuts configuration
    this.defaults = {
      'show-hide-window': {
        accelerator: 'CommandOrControl+Alt+E',
        description: 'Show/Hide main window',
        action: 'show-hide-window',
        enabled: true
      },
      'create-note': {
        accelerator: 'CommandOrControl+Alt+N',
        description: 'Create new note',
        action: 'create-note',
        enabled: true
      },
      'capture-clipboard': {
        accelerator: 'CommandOrControl+Alt+C',
        description: 'Capture clipboard content',
        action: 'capture-clipboard',
        enabled: true
      },
      'take-screenshot': {
        accelerator: 'CommandOrControl+Alt+S',
        description: 'Take screenshot',
        action: 'take-screenshot',
        enabled: true
      },
      'quick-search': {
        accelerator: 'CommandOrControl+Alt+Q',
        description: 'Quick search',
        action: 'quick-search',
        enabled: true
      }
    };

    // Statistics
    this.stats = {
      totalRegistered: 0,
      totalTriggered: 0,
      lastTriggered: null
    };
  }

  /**
   * Initialize shortcuts from saved configuration
   * @param {Object} savedShortcuts - Saved shortcuts from store
   */
  initialize(savedShortcuts = null) {
    console.log('ShortcutManager initialize() called');
    console.log('Saved shortcuts:', savedShortcuts);
    console.log('Default shortcuts available:', Object.keys(this.defaults).length);

    // Load saved shortcuts or use defaults
    // Check if savedShortcuts is an empty object or null
    const isEmptyObject = savedShortcuts && typeof savedShortcuts === 'object' && Object.keys(savedShortcuts).length === 0;
    const shortcuts = (savedShortcuts && !isEmptyObject) ? savedShortcuts : this.defaults;

    console.log('Using shortcuts config:', shortcuts);
    console.log('Number of shortcuts to register:', Object.keys(shortcuts).length);

    let successCount = 0;
    let failCount = 0;

    // Register each shortcut
    for (const [id, config] of Object.entries(shortcuts)) {
      console.log(`[${id}] Processing:`, JSON.stringify(config));

      if (config.enabled) {
        const result = this.register(id, config.accelerator, config.action, config.description);
        console.log(`[${id}] Registration result:`, JSON.stringify(result));

        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`[${id}] FAILED to register: ${result.error}`);
        }
      } else {
        // Store but don't register
        this.shortcuts.set(id, {
          ...config,
          registered: false
        });
        console.log(`[${id}] Stored as disabled`);
      }
    }

    console.log(`ShortcutManager initialized: ${this.shortcuts.size} total, ${successCount} registered, ${failCount} failed`);
  }

  /**
   * Register a global shortcut
   * @param {string} id - Unique identifier
   * @param {string} accelerator - Keyboard shortcut (e.g., 'CommandOrControl+Alt+E')
   * @param {string} action - Action to trigger
   * @param {string} description - Human-readable description
   * @returns {Object} Result object with success status
   */
  register(id, accelerator, action, description) {
    try {
      // Check if accelerator is already in use
      if (this.registeredAccelerators.has(accelerator)) {
        return {
          success: false,
          error: 'Shortcut already registered',
          conflict: true
        };
      }

      // Check if accelerator conflicts with system shortcuts
      if (!this.isAcceleratorValid(accelerator)) {
        return {
          success: false,
          error: 'Invalid accelerator format',
          conflict: false
        };
      }

      // Try to register with Electron
      const registered = globalShortcut.register(accelerator, () => {
        this.handleShortcutTriggered(id, action, accelerator);
      });

      if (!registered) {
        return {
          success: false,
          error: 'Failed to register shortcut (may be in use by system)',
          conflict: true
        };
      }

      // Store shortcut info
      this.shortcuts.set(id, {
        accelerator,
        action,
        description,
        enabled: true,
        registered: true
      });

      this.registeredAccelerators.add(accelerator);
      this.stats.totalRegistered++;

      console.log(`Registered shortcut: ${accelerator} -> ${action}`);

      return {
        success: true,
        id,
        accelerator,
        action
      };
    } catch (error) {
      console.error(`Error registering shortcut ${accelerator}:`, error);
      return {
        success: false,
        error: error.message,
        conflict: false
      };
    }
  }

  /**
   * Unregister a specific shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Object} Result object
   */
  unregister(id) {
    try {
      const shortcut = this.shortcuts.get(id);

      if (!shortcut) {
        return {
          success: false,
          error: 'Shortcut not found'
        };
      }

      if (shortcut.registered) {
        globalShortcut.unregister(shortcut.accelerator);
        this.registeredAccelerators.delete(shortcut.accelerator);
      }

      this.shortcuts.set(id, {
        ...shortcut,
        enabled: false,
        registered: false
      });

      console.log(`Unregistered shortcut: ${id}`);

      return {
        success: true,
        id
      };
    } catch (error) {
      console.error(`Error unregistering shortcut ${id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unregister all shortcuts
   */
  unregisterAll() {
    try {
      globalShortcut.unregisterAll();
      this.registeredAccelerators.clear();

      // Mark all as unregistered but keep in map
      for (const [id, shortcut] of this.shortcuts.entries()) {
        this.shortcuts.set(id, {
          ...shortcut,
          registered: false
        });
      }

      console.log('All shortcuts unregistered');

      return { success: true };
    } catch (error) {
      console.error('Error unregistering all shortcuts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update an existing shortcut
   * @param {string} id - Shortcut identifier
   * @param {string} newAccelerator - New accelerator
   * @returns {Object} Result object
   */
  update(id, newAccelerator) {
    try {
      const shortcut = this.shortcuts.get(id);

      if (!shortcut) {
        return {
          success: false,
          error: 'Shortcut not found'
        };
      }

      // Check for conflicts
      if (this.registeredAccelerators.has(newAccelerator)) {
        const conflictId = this.findShortcutByAccelerator(newAccelerator);
        return {
          success: false,
          error: 'Accelerator already in use',
          conflict: true,
          conflictWith: conflictId
        };
      }

      // Unregister old
      if (shortcut.registered) {
        globalShortcut.unregister(shortcut.accelerator);
        this.registeredAccelerators.delete(shortcut.accelerator);
      }

      // Register new
      const registered = globalShortcut.register(newAccelerator, () => {
        this.handleShortcutTriggered(id, shortcut.action, newAccelerator);
      });

      if (!registered) {
        // Try to restore old shortcut
        globalShortcut.register(shortcut.accelerator, () => {
          this.handleShortcutTriggered(id, shortcut.action, shortcut.accelerator);
        });

        return {
          success: false,
          error: 'Failed to register new shortcut (system conflict)',
          conflict: true
        };
      }

      // Update stored info
      this.shortcuts.set(id, {
        ...shortcut,
        accelerator: newAccelerator,
        registered: true
      });

      this.registeredAccelerators.add(newAccelerator);

      console.log(`Updated shortcut ${id}: ${shortcut.accelerator} -> ${newAccelerator}`);

      return {
        success: true,
        id,
        oldAccelerator: shortcut.accelerator,
        newAccelerator
      };
    } catch (error) {
      console.error(`Error updating shortcut ${id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enable a disabled shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Object} Result object
   */
  enable(id) {
    const shortcut = this.shortcuts.get(id);

    if (!shortcut) {
      return {
        success: false,
        error: 'Shortcut not found'
      };
    }

    if (shortcut.enabled && shortcut.registered) {
      return {
        success: true,
        message: 'Shortcut already enabled'
      };
    }

    return this.register(id, shortcut.accelerator, shortcut.action, shortcut.description);
  }

  /**
   * Disable an enabled shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Object} Result object
   */
  disable(id) {
    return this.unregister(id);
  }

  /**
   * Toggle shortcut enabled state
   * @param {string} id - Shortcut identifier
   * @returns {Object} Result object
   */
  toggle(id) {
    const shortcut = this.shortcuts.get(id);

    if (!shortcut) {
      return {
        success: false,
        error: 'Shortcut not found'
      };
    }

    if (shortcut.enabled && shortcut.registered) {
      return {
        ...this.disable(id),
        enabled: false
      };
    } else {
      return {
        ...this.enable(id),
        enabled: true
      };
    }
  }

  /**
   * Get all shortcuts
   * @returns {Array} Array of shortcut objects
   */
  getAll() {
    const shortcuts = [];

    for (const [id, config] of this.shortcuts.entries()) {
      shortcuts.push({
        id,
        ...config
      });
    }

    return shortcuts;
  }

  /**
   * Get a specific shortcut
   * @param {string} id - Shortcut identifier
   * @returns {Object|null} Shortcut object or null
   */
  get(id) {
    const shortcut = this.shortcuts.get(id);

    if (!shortcut) {
      return null;
    }

    return {
      id,
      ...shortcut
    };
  }

  /**
   * Reset all shortcuts to defaults
   * @returns {Object} Result object
   */
  resetToDefaults() {
    try {
      // Unregister all current shortcuts
      this.unregisterAll();

      // Clear shortcuts map
      this.shortcuts.clear();

      // Re-initialize with defaults
      this.initialize(this.defaults);

      console.log('Shortcuts reset to defaults');

      return {
        success: true,
        shortcuts: this.getAll()
      };
    } catch (error) {
      console.error('Error resetting shortcuts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export shortcuts configuration
   * @returns {Object} Shortcuts configuration
   */
  export() {
    const config = {};

    for (const [id, shortcut] of this.shortcuts.entries()) {
      config[id] = {
        accelerator: shortcut.accelerator,
        action: shortcut.action,
        description: shortcut.description,
        enabled: shortcut.enabled
      };
    }

    return config;
  }

  /**
   * Import shortcuts configuration
   * @param {Object} config - Shortcuts configuration
   * @returns {Object} Result object
   */
  import(config) {
    try {
      // Unregister all current
      this.unregisterAll();

      // Clear shortcuts
      this.shortcuts.clear();

      // Import and register new shortcuts
      this.initialize(config);

      console.log('Shortcuts imported successfully');

      return {
        success: true,
        count: this.shortcuts.size
      };
    } catch (error) {
      console.error('Error importing shortcuts:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get shortcut statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      totalShortcuts: this.shortcuts.size,
      enabledShortcuts: Array.from(this.shortcuts.values()).filter(s => s.enabled).length,
      disabledShortcuts: Array.from(this.shortcuts.values()).filter(s => !s.enabled).length,
      registeredAccelerators: this.registeredAccelerators.size
    };
  }

  /**
   * Check if an accelerator is valid
   * @param {string} accelerator - Accelerator string
   * @returns {boolean} True if valid
   */
  isAcceleratorValid(accelerator) {
    // Basic validation - check format
    if (!accelerator || typeof accelerator !== 'string') {
      return false;
    }

    // Must contain at least one modifier
    const hasModifier = /Command|Ctrl|Control|Alt|Option|Shift|Super|Meta/.test(accelerator);

    // Must contain a key
    const hasKey = /[A-Z0-9]|F[1-9]|F1[0-2]|Plus|Space|Tab|Backspace|Delete|Insert|Return|Enter|Up|Down|Left|Right|Home|End|PageUp|PageDown|Escape|VolumeUp|VolumeDown|VolumeMute|MediaNextTrack|MediaPreviousTrack|MediaStop|MediaPlayPause/.test(accelerator);

    return hasModifier && hasKey;
  }

  /**
   * Find shortcut by accelerator
   * @param {string} accelerator - Accelerator to search for
   * @returns {string|null} Shortcut ID or null
   */
  findShortcutByAccelerator(accelerator) {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (shortcut.accelerator === accelerator) {
        return id;
      }
    }
    return null;
  }

  /**
   * Check if accelerator is available
   * @param {string} accelerator - Accelerator to check
   * @returns {Object} Result with available status and conflict info
   */
  checkAvailability(accelerator) {
    const existingId = this.findShortcutByAccelerator(accelerator);

    if (existingId) {
      return {
        available: false,
        conflict: true,
        conflictWith: existingId,
        message: `Already used by: ${this.shortcuts.get(existingId).description}`
      };
    }

    // Try to register temporarily to check system conflicts
    try {
      const registered = globalShortcut.register(accelerator, () => {});

      if (registered) {
        // Immediately unregister
        globalShortcut.unregister(accelerator);
        return {
          available: true,
          conflict: false,
          message: 'Available'
        };
      } else {
        return {
          available: false,
          conflict: true,
          conflictWith: 'system',
          message: 'Conflicts with system shortcut'
        };
      }
    } catch (error) {
      return {
        available: false,
        conflict: false,
        message: 'Invalid accelerator format'
      };
    }
  }

  /**
   * Handle shortcut triggered event
   * @param {string} id - Shortcut ID
   * @param {string} action - Action to perform
   * @param {string} accelerator - Accelerator that was pressed
   * @private
   */
  handleShortcutTriggered(id, action, accelerator) {
    this.stats.totalTriggered++;
    this.stats.lastTriggered = {
      id,
      action,
      accelerator,
      timestamp: new Date().toISOString()
    };

    console.log(`Shortcut triggered: ${accelerator} (${action})`);

    // Emit event for listeners
    this.emit('shortcut-triggered', {
      id,
      action,
      accelerator,
      timestamp: this.stats.lastTriggered.timestamp
    });
  }

  /**
   * Cleanup - unregister all shortcuts
   */
  cleanup() {
    console.log('ShortcutManager cleaning up...');
    this.unregisterAll();
  }
}

// Export singleton instance
const shortcutManager = new ShortcutManager();

module.exports = shortcutManager;
