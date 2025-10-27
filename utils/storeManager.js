const Store = require('electron-store').default || require('electron-store');
const crypto = require('crypto');

/**
 * Store Manager for Persistent Storage
 *
 * Features:
 * - Schema validation
 * - Default values
 * - Encryption for sensitive data
 * - Change watching
 * - Import/Export
 * - Migrations
 */

// Define the schema for validation
const schema = {
  theme: {
    type: 'string',
    enum: ['dark', 'light'],
    default: 'dark'
  },
  notifications: {
    type: 'boolean',
    default: true
  },
  launchAtStartup: {
    type: 'boolean',
    default: false
  },
  windowBounds: {
    type: 'object',
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
      width: { type: 'number' },
      height: { type: 'number' }
    },
    default: { x: 0, y: 0, width: 1200, height: 800 }
  },
  recentFiles: {
    type: 'array',
    items: { type: 'string' },
    default: []
  },
  userPreferences: {
    type: 'object',
    default: {}
  },
  // Encrypted sensitive data
  secrets: {
    type: 'object',
    default: {}
  },
  // Store metadata
  _metadata: {
    type: 'object',
    properties: {
      version: { type: 'number', default: 1 },
      createdAt: { type: 'string' },
      lastModified: { type: 'string' }
    },
    default: {
      version: 1,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  }
};

// Migrations for schema changes
const migrations = {
  '0.0.1': (store) => {
    // Initial setup
    console.log('Running initial store setup...');
  },
  '0.1.0': (store) => {
    // Example migration: rename a key
    // const oldValue = store.get('oldKey');
    // store.set('newKey', oldValue);
    // store.delete('oldKey');
  }
};

// Initialize the store with schema
const store = new Store({
  schema,
  migrations,
  clearInvalidConfig: true, // Clear invalid config on schema changes
  serialize: value => JSON.stringify(value, null, 2), // Pretty print
  deserialize: JSON.parse
});

// Encryption utilities
const ENCRYPTION_KEY = crypto.randomBytes(32); // In production, use a secure key management system
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt a value
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text with IV prepended
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a value
 * @param {string} text - Encrypted text with IV prepended
 * @returns {string} Decrypted text
 */
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Store Manager Class
 */
class StoreManager {
  constructor() {
    this.store = store;
    this.watchers = new Map();
    this.initializeMetadata();
  }

  /**
   * Initialize metadata
   */
  initializeMetadata() {
    const metadata = this.store.get('_metadata');
    if (!metadata.createdAt) {
      this.store.set('_metadata.createdAt', new Date().toISOString());
    }
    this.updateLastModified();
  }

  /**
   * Update last modified timestamp
   */
  updateLastModified() {
    this.store.set('_metadata.lastModified', new Date().toISOString());
  }

  /**
   * Get a value from the store
   * @param {string} key - Key to retrieve
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Value from store
   */
  get(key, defaultValue) {
    return this.store.get(key, defaultValue);
  }

  /**
   * Set a value in the store
   * @param {string} key - Key to set
   * @param {any} value - Value to store
   */
  set(key, value) {
    this.store.set(key, value);
    this.updateLastModified();
    this.notifyWatchers(key, value);
  }

  /**
   * Check if key exists
   * @param {string} key - Key to check
   * @returns {boolean} True if exists
   */
  has(key) {
    return this.store.has(key);
  }

  /**
   * Delete a key
   * @param {string} key - Key to delete
   */
  delete(key) {
    this.store.delete(key);
    this.updateLastModified();
    this.notifyWatchers(key, undefined);
  }

  /**
   * Clear all data (except metadata)
   */
  clear() {
    const metadata = this.store.get('_metadata');
    this.store.clear();
    this.store.set('_metadata', metadata);
    this.updateLastModified();
  }

  /**
   * Get all data
   * @returns {object} All store data
   */
  getAll() {
    return this.store.store;
  }

  /**
   * Get store size in bytes
   * @returns {number} Size in bytes
   */
  getSize() {
    return this.store.size;
  }

  /**
   * Get store file path
   * @returns {string} File path
   */
  getPath() {
    return this.store.path;
  }

  /**
   * Reset to defaults
   */
  reset() {
    // Keep metadata but reset all other values to defaults
    const metadata = this.store.get('_metadata');
    this.store.clear();

    // Restore defaults from schema
    Object.keys(schema).forEach(key => {
      if (schema[key].default !== undefined && key !== '_metadata') {
        this.store.set(key, schema[key].default);
      }
    });

    this.store.set('_metadata', metadata);
    this.updateLastModified();
  }

  /**
   * Watch for changes to a key
   * @param {string} key - Key to watch
   * @param {Function} callback - Callback when value changes
   * @returns {Function} Unwatch function
   */
  watch(key, callback) {
    const watchId = `${key}_${Date.now()}`;

    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Map());
    }

    this.watchers.get(key).set(watchId, callback);

    // Return unwatch function
    return () => {
      const keyWatchers = this.watchers.get(key);
      if (keyWatchers) {
        keyWatchers.delete(watchId);
        if (keyWatchers.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }

  /**
   * Notify watchers of changes
   * @param {string} key - Key that changed
   * @param {any} newValue - New value
   */
  notifyWatchers(key, newValue) {
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      keyWatchers.forEach(callback => {
        try {
          callback(newValue, key);
        } catch (error) {
          console.error('Error in store watcher:', error);
        }
      });
    }
  }

  /**
   * Set encrypted value
   * @param {string} key - Key to store under
   * @param {string} value - Value to encrypt and store
   */
  setSecret(key, value) {
    const encrypted = encrypt(value);
    const secrets = this.store.get('secrets', {});
    secrets[key] = encrypted;
    this.store.set('secrets', secrets);
    this.updateLastModified();
  }

  /**
   * Get encrypted value
   * @param {string} key - Key to retrieve
   * @returns {string|null} Decrypted value or null
   */
  getSecret(key) {
    const secrets = this.store.get('secrets', {});
    const encrypted = secrets[key];
    if (!encrypted) return null;

    try {
      return decrypt(encrypted);
    } catch (error) {
      console.error('Error decrypting secret:', error);
      return null;
    }
  }

  /**
   * Delete encrypted value
   * @param {string} key - Key to delete
   */
  deleteSecret(key) {
    const secrets = this.store.get('secrets', {});
    delete secrets[key];
    this.store.set('secrets', secrets);
    this.updateLastModified();
  }

  /**
   * Export all data as JSON
   * @param {boolean} includeSecrets - Whether to include encrypted secrets
   * @returns {string} JSON string
   */
  export(includeSecrets = false) {
    const data = { ...this.store.store };

    if (!includeSecrets) {
      delete data.secrets;
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   * @param {string} jsonString - JSON string to import
   * @param {boolean} merge - Whether to merge with existing data
   * @returns {boolean} Success status
   */
  import(jsonString, merge = false) {
    try {
      const data = JSON.parse(jsonString);

      if (!merge) {
        this.clear();
      }

      // Import each key
      Object.keys(data).forEach(key => {
        if (key !== '_metadata') { // Don't overwrite metadata
          this.store.set(key, data[key]);
        }
      });

      this.updateLastModified();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get statistics about the store
   * @returns {object} Statistics
   */
  getStats() {
    const data = this.store.store;
    const metadata = this.store.get('_metadata');

    return {
      size: this.getSize(),
      path: this.getPath(),
      keys: Object.keys(data).length,
      metadata,
      hasSecrets: Object.keys(this.store.get('secrets', {})).length > 0,
      secretsCount: Object.keys(this.store.get('secrets', {})).length
    };
  }

  /**
   * Validate a value against the schema
   * @param {string} key - Key to validate
   * @param {any} value - Value to validate
   * @returns {boolean} Whether value is valid
   */
  validate(key, value) {
    const keySchema = schema[key];
    if (!keySchema) return true; // No schema for key, allow anything

    // Type validation
    if (keySchema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== keySchema.type) {
        return false;
      }
    }

    // Enum validation
    if (keySchema.enum && !keySchema.enum.includes(value)) {
      return false;
    }

    return true;
  }
}

// Create singleton instance
const storeManager = new StoreManager();

// Log initialization
console.log('StoreManager initialized');
console.log('Store path:', storeManager.getPath());
console.log('Store size:', storeManager.getSize(), 'bytes');

module.exports = storeManager;
