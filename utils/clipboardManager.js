const { clipboard, nativeImage } = require('electron');
const EventEmitter = require('events');

/**
 * Clipboard Manager for comprehensive clipboard operations
 *
 * Features:
 * - Multi-format support (text, HTML, RTF, images)
 * - Clipboard history
 * - Format detection
 * - Clipboard monitoring
 */

class ClipboardManager extends EventEmitter {
  constructor() {
    super();
    this.history = [];
    this.maxHistorySize = 10;
    this.monitoring = false;
    this.monitorInterval = null;
    this.lastClipboardContent = null;
  }

  /**
   * Read text from clipboard
   * @returns {string} Text content
   */
  readText() {
    return clipboard.readText();
  }

  /**
   * Write text to clipboard
   * @param {string} text - Text to write
   */
  writeText(text) {
    clipboard.writeText(text);
    this.addToHistory({
      type: 'text',
      content: text,
      timestamp: Date.now()
    });
  }

  /**
   * Read HTML from clipboard
   * @returns {string} HTML content
   */
  readHTML() {
    return clipboard.readHTML();
  }

  /**
   * Write HTML to clipboard
   * @param {string} html - HTML to write
   */
  writeHTML(html) {
    clipboard.writeHTML(html);
    this.addToHistory({
      type: 'html',
      content: html,
      timestamp: Date.now()
    });
  }

  /**
   * Read RTF from clipboard
   * @returns {string} RTF content
   */
  readRTF() {
    return clipboard.readRTF();
  }

  /**
   * Write RTF to clipboard
   * @param {string} rtf - RTF to write
   */
  writeRTF(rtf) {
    clipboard.writeRTF(rtf);
    this.addToHistory({
      type: 'rtf',
      content: rtf,
      timestamp: Date.now()
    });
  }

  /**
   * Read image from clipboard
   * @returns {Object|null} Image data with format and dataURL
   */
  readImage() {
    const image = clipboard.readImage();
    if (image.isEmpty()) {
      return null;
    }

    return {
      size: image.getSize(),
      dataURL: image.toDataURL(),
      aspectRatio: image.getAspectRatio()
    };
  }

  /**
   * Write image to clipboard
   * @param {string} dataURL - Image data URL
   */
  writeImage(dataURL) {
    const image = nativeImage.createFromDataURL(dataURL);
    clipboard.writeImage(image);
    this.addToHistory({
      type: 'image',
      content: dataURL,
      size: image.getSize(),
      timestamp: Date.now()
    });
  }

  /**
   * Read available formats
   * @returns {Array<string>} Available formats
   */
  availableFormats() {
    return clipboard.availableFormats();
  }

  /**
   * Check if clipboard has specific format
   * @param {string} format - Format to check (text, html, rtf, image)
   * @returns {boolean} True if format available
   */
  has(format) {
    switch (format) {
      case 'text':
        return clipboard.readText().length > 0;
      case 'html':
        return clipboard.readHTML().length > 0;
      case 'rtf':
        return clipboard.readRTF().length > 0;
      case 'image':
        return !clipboard.readImage().isEmpty();
      default:
        return false;
    }
  }

  /**
   * Read all available clipboard content
   * @returns {Object} All available content
   */
  readAll() {
    const result = {
      formats: this.availableFormats(),
      content: {}
    };

    const text = clipboard.readText();
    if (text) result.content.text = text;

    const html = clipboard.readHTML();
    if (html) result.content.html = html;

    const rtf = clipboard.readRTF();
    if (rtf) result.content.rtf = rtf;

    const image = clipboard.readImage();
    if (!image.isEmpty()) {
      result.content.image = {
        dataURL: image.toDataURL(),
        size: image.getSize()
      };
    }

    return result;
  }

  /**
   * Write multiple formats at once
   * @param {Object} data - Data object with text, html, rtf, image
   */
  writeMultiple(data) {
    if (data.text) clipboard.writeText(data.text);
    if (data.html) clipboard.writeHTML(data.html);
    if (data.rtf) clipboard.writeRTF(data.rtf);
    if (data.image) {
      const image = nativeImage.createFromDataURL(data.image);
      clipboard.writeImage(image);
    }

    this.addToHistory({
      type: 'multiple',
      content: data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear clipboard
   */
  clear() {
    clipboard.clear();
    this.emit('clipboard-cleared');
  }

  /**
   * Add item to history
   * @param {Object} item - History item
   */
  addToHistory(item) {
    // Add timestamp and ID
    item.id = Date.now() + Math.random();

    // Limit content size for history
    if (item.type === 'text' && item.content.length > 1000) {
      item.content = item.content.substring(0, 1000) + '...';
      item.truncated = true;
    }

    this.history.unshift(item);

    // Maintain max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }

    this.emit('history-updated', this.history);
  }

  /**
   * Get clipboard history
   * @param {number} limit - Max items to return
   * @returns {Array} History items
   */
  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }

  /**
   * Clear clipboard history
   */
  clearHistory() {
    this.history = [];
    this.emit('history-cleared');
  }

  /**
   * Restore item from history to clipboard
   * @param {number} id - History item ID
   * @returns {boolean} Success status
   */
  restoreFromHistory(id) {
    const item = this.history.find(h => h.id === id);
    if (!item) return false;

    switch (item.type) {
      case 'text':
        clipboard.writeText(item.content);
        break;
      case 'html':
        clipboard.writeHTML(item.content);
        break;
      case 'rtf':
        clipboard.writeRTF(item.content);
        break;
      case 'image':
        const image = nativeImage.createFromDataURL(item.content);
        clipboard.writeImage(image);
        break;
      case 'multiple':
        this.writeMultiple(item.content);
        break;
    }

    this.emit('history-restored', item);
    return true;
  }

  /**
   * Start monitoring clipboard changes
   * @param {number} interval - Check interval in ms (default: 1000)
   */
  startMonitoring(interval = 1000) {
    if (this.monitoring) return;

    this.monitoring = true;
    this.lastClipboardContent = this.readText();

    this.monitorInterval = setInterval(() => {
      const currentContent = this.readText();
      if (currentContent !== this.lastClipboardContent) {
        this.lastClipboardContent = currentContent;
        this.emit('clipboard-changed', currentContent);

        // Auto-add to history
        if (currentContent && currentContent.length > 0) {
          this.addToHistory({
            type: 'text',
            content: currentContent,
            timestamp: Date.now(),
            fromMonitor: true
          });
        }
      }
    }, interval);

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring clipboard changes
   */
  stopMonitoring() {
    if (!this.monitoring) return;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.monitoring = false;
    this.emit('monitoring-stopped');
  }

  /**
   * Check if monitoring is active
   * @returns {boolean} Monitoring status
   */
  isMonitoring() {
    return this.monitoring;
  }

  /**
   * Get clipboard statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      historySize: this.history.length,
      monitoring: this.monitoring,
      currentFormats: this.availableFormats(),
      hasContent: this.readText().length > 0 || !clipboard.readImage().isEmpty()
    };
  }
}

// Create singleton instance
const clipboardManager = new ClipboardManager();

// Log initialization
console.log('ClipboardManager initialized');

module.exports = clipboardManager;
