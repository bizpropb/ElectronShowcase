/**
 * System Information Dashboard - Renderer Process
 * Handles UI interactions and data display for system information
 */

// Wrap in IIFE to prevent variable redeclaration on multiple loads
(function() {
  // System Information Modal Elements
  const systemInfoModal = document.getElementById('system-info-modal');
  const showSystemInfoBtn = document.getElementById('show-system-info-btn');
  const closeSystemInfoModal = document.getElementById('close-system-info-modal');
  const refreshSystemInfoBtn = document.getElementById('refresh-system-info-btn');
  const copySystemInfoBtn = document.getElementById('copy-system-info-btn');
  const exportSystemReportBtn = document.getElementById('export-system-report-btn');
  const systemInfoStatus = document.getElementById('system-info-status');

  // Tab elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Global variable to store current system info
  let currentSystemInfo = null;

  /**
   * Format uptime in a human-readable format
   */
  function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Load and display system information
   */
  async function loadSystemInfo() {
    try {
      if (!systemInfoStatus) return;

      systemInfoStatus.textContent = 'Loading...';

      const result = await window.electronAPI.systemGetAll();

      if (result.success) {
        currentSystemInfo = result.info;
        displaySystemInfo(currentSystemInfo);
        systemInfoStatus.textContent = 'Data loaded successfully';

        setTimeout(() => {
          systemInfoStatus.textContent = '';
        }, 2000);
      } else {
        systemInfoStatus.textContent = 'Error loading system info';
        console.error('Failed to load system info:', result.error);
      }
    } catch (error) {
      if (systemInfoStatus) {
        systemInfoStatus.textContent = 'Error loading system info';
      }
      console.error('Error loading system info:', error);
    }
  }

  /**
   * Display system information in the UI
   */
  function displaySystemInfo(info) {
    // Safely set element content with null checks
    const setContent = (id, content) => {
      const el = document.getElementById(id);
      if (el) el.textContent = content;
    };

    const setStyle = (id, property, value) => {
      const el = document.getElementById(id);
      if (el) el.style[property] = value;
    };

    // OS Information
    setContent('os-name', info.os.name);
    setContent('os-version', info.os.version);
    setContent('os-arch', info.os.architecture);
    setContent('os-uptime', formatUptime(info.os.uptime));

    // CPU Information
    setContent('cpu-model', info.cpu.model);
    setContent('cpu-cores', info.cpu.cores);
    setContent('cpu-speed', `${info.cpu.speed} MHz`);
    setContent('cpu-usage', `${info.cpu.usage}%`);
    setStyle('cpu-progress', 'width', `${info.cpu.usage}%`);

    // Memory Information
    setContent('memory-total', `${info.memory.totalGB} GB`);
    setContent('memory-used', `${info.memory.usedGB} GB`);
    setContent('memory-free', `${info.memory.freeGB} GB`);
    setContent('memory-usage', `${info.memory.usagePercentage}%`);
    setStyle('memory-progress', 'width', `${info.memory.usagePercentage}%`);

    // Application Information
    setContent('app-name', info.app.name);
    setContent('app-version', info.app.version);
    setContent('app-memory', `${info.app.memory.rssMB} MB`);
    setContent('app-uptime', formatUptime(info.app.uptime));
  }

  /**
   * Handle tab switching
   */
  function switchTab(tabName) {
    // Hide all tab contents
    tabContents.forEach(content => {
      content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    tabBtns.forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('active');
    }
  }

  /**
   * Copy system information to clipboard
   */
  async function copySystemInfo() {
    try {
      if (!currentSystemInfo) {
        if (systemInfoStatus) {
          systemInfoStatus.textContent = 'No data to copy';
        }
        return;
      }

      const result = await window.electronAPI.systemGenerateReport();

      if (result.success) {
        await window.electronAPI.clipboardWriteText(result.report);
        if (systemInfoStatus) {
          systemInfoStatus.textContent = 'Copied to clipboard!';
          setTimeout(() => {
            systemInfoStatus.textContent = '';
          }, 2000);
        }
      } else {
        if (systemInfoStatus) {
          systemInfoStatus.textContent = 'Error generating report';
        }
      }
    } catch (error) {
      if (systemInfoStatus) {
        systemInfoStatus.textContent = 'Error copying to clipboard';
      }
      console.error('Error copying system info:', error);
    }
  }

  /**
   * Export system report to file
   */
  async function exportSystemReport() {
    try {
      // Show save file dialog
      const result = await window.electronAPI.saveFileDialog({
        title: 'Export System Report',
        defaultPath: `system-report-${Date.now()}.txt`,
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return;
      }

      // Export report to the selected file
      const exportResult = await window.electronAPI.systemExportReport(result.filePath);

      if (exportResult.success) {
        await window.electronAPI.showNotificationTyped(
          'success',
          'Export Successful',
          `System report exported to ${exportResult.path}`
        );
      } else {
        await window.electronAPI.showNotificationTyped(
          'error',
          'Export Failed',
          `Error: ${exportResult.error}`
        );
      }
    } catch (error) {
      console.error('Error exporting system report:', error);
      await window.electronAPI.showNotificationTyped(
        'error',
        'Export Failed',
        'An error occurred while exporting the report'
      );
    }
  }

  // Event Listeners

  // Show system info modal
  if (showSystemInfoBtn) {
    showSystemInfoBtn.addEventListener('click', async () => {
      if (systemInfoModal) {
        systemInfoModal.style.display = 'flex';
      }
      await loadSystemInfo();
    });
  }

  // Close modal
  if (closeSystemInfoModal) {
    closeSystemInfoModal.addEventListener('click', () => {
      if (systemInfoModal) {
        systemInfoModal.style.display = 'none';
      }
    });
  }

  // Close modal when clicking outside
  if (systemInfoModal) {
    systemInfoModal.addEventListener('click', (e) => {
      if (e.target === systemInfoModal) {
        systemInfoModal.style.display = 'none';
      }
    });
  }

  // Refresh system info
  if (refreshSystemInfoBtn) {
    refreshSystemInfoBtn.addEventListener('click', loadSystemInfo);
  }

  // Copy system info
  if (copySystemInfoBtn) {
    copySystemInfoBtn.addEventListener('click', copySystemInfo);
  }

  // Export system report
  if (exportSystemReportBtn) {
    exportSystemReportBtn.addEventListener('click', exportSystemReport);
  }

  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  console.log('System Information Dashboard initialized');
})(); // End of IIFE
