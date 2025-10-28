/**
 * System Information Dashboard - Renderer Process
 * Handles UI interactions and data display for system information
 */

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
    systemInfoStatus.textContent = 'Error loading system info';
    console.error('Error loading system info:', error);
  }
}

/**
 * Display system information in the UI
 */
function displaySystemInfo(info) {
  // OS Information
  document.getElementById('os-name').textContent = info.os.name;
  document.getElementById('os-version').textContent = info.os.version;
  document.getElementById('os-arch').textContent = info.os.architecture;
  document.getElementById('os-uptime').textContent = formatUptime(info.os.uptime);

  // CPU Information
  document.getElementById('cpu-model').textContent = info.cpu.model;
  document.getElementById('cpu-cores').textContent = info.cpu.cores;
  document.getElementById('cpu-speed').textContent = `${info.cpu.speed} MHz`;
  document.getElementById('cpu-usage').textContent = `${info.cpu.usage}%`;
  document.getElementById('cpu-progress').style.width = `${info.cpu.usage}%`;

  // Memory Information
  document.getElementById('memory-total').textContent = `${info.memory.totalGB} GB`;
  document.getElementById('memory-used').textContent = `${info.memory.usedGB} GB`;
  document.getElementById('memory-free').textContent = `${info.memory.freeGB} GB`;
  document.getElementById('memory-usage').textContent = `${info.memory.usagePercentage}%`;
  document.getElementById('memory-progress').style.width = `${info.memory.usagePercentage}%`;

  // Application Information
  document.getElementById('app-name').textContent = info.app.name;
  document.getElementById('app-version').textContent = info.app.version;
  document.getElementById('app-memory').textContent = `${info.app.memory.rssMB} MB`;
  document.getElementById('app-uptime').textContent = formatUptime(info.app.uptime);
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
      systemInfoStatus.textContent = 'No data to copy';
      return;
    }

    const result = await window.electronAPI.systemGenerateReport();

    if (result.success) {
      await window.electronAPI.clipboardWriteText(result.report);
      systemInfoStatus.textContent = 'Copied to clipboard!';

      setTimeout(() => {
        systemInfoStatus.textContent = '';
      }, 2000);
    } else {
      systemInfoStatus.textContent = 'Error generating report';
    }
  } catch (error) {
    systemInfoStatus.textContent = 'Error copying to clipboard';
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
    systemInfoModal.style.display = 'flex';
    await loadSystemInfo();
  });
}

// Close modal
if (closeSystemInfoModal) {
  closeSystemInfoModal.addEventListener('click', () => {
    systemInfoModal.style.display = 'none';
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
