/**
 * System Information Manager
 * Collects and provides comprehensive system and hardware information
 */

const { app, screen, powerMonitor } = require('electron');
const os = require('os');
const process = require('process');

class SystemInfoManager {
  constructor() {
    this.appStartTime = Date.now();
  }

  /**
   * Get operating system information
   * @returns {Object} OS information
   */
  getOSInfo() {
    return {
      name: this.getOSName(),
      version: os.release(),
      platform: process.platform,
      architecture: process.arch,
      hostname: os.hostname(),
      uptime: os.uptime(), // System uptime in seconds
      type: os.type()
    };
  }

  /**
   * Get human-readable OS name
   * @returns {string} OS name
   */
  getOSName() {
    switch (process.platform) {
      case 'win32':
        return 'Windows';
      case 'darwin':
        return 'macOS';
      case 'linux':
        return 'Linux';
      default:
        return process.platform;
    }
  }

  /**
   * Get CPU information
   * @returns {Object} CPU information
   */
  getCPUInfo() {
    const cpus = os.cpus();

    if (cpus.length === 0) {
      return {
        model: 'Unknown',
        cores: 0,
        speed: 0,
        usage: 0
      };
    }

    return {
      model: cpus[0].model,
      cores: cpus.length,
      speed: cpus[0].speed, // MHz
      usage: this.calculateCPUUsage(cpus)
    };
  }

  /**
   * Calculate average CPU usage
   * @param {Array} cpus - CPU information array
   * @returns {number} CPU usage percentage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor((idle / total) * 100);

    return Math.max(0, Math.min(100, usage)); // Clamp between 0-100
  }

  /**
   * Get memory information
   * @returns {Object} Memory information
   */
  getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usagePercentage: Math.round((usedMemory / totalMemory) * 100),
      totalGB: (totalMemory / (1024 ** 3)).toFixed(2),
      usedGB: (usedMemory / (1024 ** 3)).toFixed(2),
      freeGB: (freeMemory / (1024 ** 3)).toFixed(2)
    };
  }

  /**
   * Get display/screen information
   * @returns {Object} Display information
   */
  getDisplayInfo() {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();

    return {
      count: displays.length,
      primary: {
        id: primaryDisplay.id,
        resolution: `${primaryDisplay.size.width} x ${primaryDisplay.size.height}`,
        width: primaryDisplay.size.width,
        height: primaryDisplay.size.height,
        scaleFactor: primaryDisplay.scaleFactor,
        rotation: primaryDisplay.rotation,
        colorDepth: primaryDisplay.colorDepth,
        colorSpace: primaryDisplay.colorSpace,
        bounds: primaryDisplay.bounds,
        workArea: primaryDisplay.workArea
      },
      all: displays.map(display => ({
        id: display.id,
        label: display.label || `Display ${display.id}`,
        resolution: `${display.size.width} x ${display.size.height}`,
        width: display.size.width,
        height: display.size.height,
        scaleFactor: display.scaleFactor,
        rotation: display.rotation,
        colorDepth: display.colorDepth,
        bounds: display.bounds,
        internal: display.internal || false
      }))
    };
  }

  /**
   * Get power status information
   * @returns {Object} Power status
   */
  getPowerInfo() {
    // Note: Some properties may not be available on all platforms
    try {
      return {
        onBattery: powerMonitor.isOnBatteryPower ? powerMonitor.isOnBatteryPower() : false,
        charging: false, // Can be determined from platform-specific APIs
        batteryLevel: this.getBatteryLevel(),
        // These methods are only available on some platforms
        thermalState: typeof powerMonitor.getCurrentThermalState === 'function'
          ? powerMonitor.getCurrentThermalState()
          : 'unknown',
        available: true
      };
    } catch (error) {
      return {
        onBattery: false,
        charging: false,
        batteryLevel: null,
        thermalState: 'unknown',
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Get battery level (platform-specific)
   * @returns {number|null} Battery percentage or null if unavailable
   */
  getBatteryLevel() {
    // This is a placeholder - actual battery level requires platform-specific implementation
    // On real systems, you'd use platform-specific APIs or libraries like node-battery
    return null;
  }

  /**
   * Get application metrics
   * @returns {Object} App metrics
   */
  getAppMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      version: app.getVersion(),
      name: app.getName(),
      uptime: Math.floor((Date.now() - this.appStartTime) / 1000), // seconds
      memory: {
        rss: memoryUsage.rss, // Resident Set Size
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
        rssMB: (memoryUsage.rss / (1024 ** 2)).toFixed(2),
        heapTotalMB: (memoryUsage.heapTotal / (1024 ** 2)).toFixed(2),
        heapUsedMB: (memoryUsage.heapUsed / (1024 ** 2)).toFixed(2)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      pid: process.pid,
      metrics: app.getAppMetrics(), // Electron process metrics
      path: {
        userData: app.getPath('userData'),
        appData: app.getPath('appData'),
        temp: app.getPath('temp'),
        exe: app.getPath('exe'),
        home: app.getPath('home')
      }
    };
  }

  /**
   * Get network interfaces information
   * @returns {Object} Network information
   */
  getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const result = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      addresses.forEach(addr => {
        result.push({
          name,
          family: addr.family,
          address: addr.address,
          netmask: addr.netmask,
          mac: addr.mac,
          internal: addr.internal,
          cidr: addr.cidr
        });
      });
    }

    return {
      interfaces: result,
      count: result.length
    };
  }

  /**
   * Get all system information
   * @returns {Object} Comprehensive system information
   */
  getAllInfo() {
    return {
      os: this.getOSInfo(),
      cpu: this.getCPUInfo(),
      memory: this.getMemoryInfo(),
      display: this.getDisplayInfo(),
      power: this.getPowerInfo(),
      app: this.getAppMetrics(),
      network: this.getNetworkInfo(),
      timestamp: Date.now(),
      timestampFormatted: new Date().toISOString()
    };
  }

  /**
   * Get system information formatted for export
   * @returns {string} Formatted text report
   */
  generateReport() {
    const info = this.getAllInfo();

    let report = '='.repeat(60) + '\n';
    report += 'SYSTEM INFORMATION REPORT\n';
    report += '='.repeat(60) + '\n';
    report += `Generated: ${info.timestampFormatted}\n`;
    report += '\n';

    // Operating System
    report += '--- OPERATING SYSTEM ---\n';
    report += `Name: ${info.os.name}\n`;
    report += `Version: ${info.os.version}\n`;
    report += `Platform: ${info.os.platform}\n`;
    report += `Architecture: ${info.os.architecture}\n`;
    report += `Hostname: ${info.os.hostname}\n`;
    report += `Uptime: ${this.formatUptime(info.os.uptime)}\n`;
    report += '\n';

    // CPU
    report += '--- CPU ---\n';
    report += `Model: ${info.cpu.model}\n`;
    report += `Cores: ${info.cpu.cores}\n`;
    report += `Speed: ${info.cpu.speed} MHz\n`;
    report += `Usage: ${info.cpu.usage}%\n`;
    report += '\n';

    // Memory
    report += '--- MEMORY ---\n';
    report += `Total: ${info.memory.totalGB} GB\n`;
    report += `Used: ${info.memory.usedGB} GB (${info.memory.usagePercentage}%)\n`;
    report += `Free: ${info.memory.freeGB} GB\n`;
    report += '\n';

    // Display
    report += '--- DISPLAY ---\n';
    report += `Monitor Count: ${info.display.count}\n`;
    report += `Primary Resolution: ${info.display.primary.resolution}\n`;
    report += `Scale Factor: ${info.display.primary.scaleFactor}\n`;
    report += `Color Depth: ${info.display.primary.colorDepth} bit\n`;
    report += '\n';

    // Power
    report += '--- POWER ---\n';
    report += `On Battery: ${info.power.onBattery ? 'Yes' : 'No'}\n`;
    report += `Battery Level: ${info.power.batteryLevel !== null ? info.power.batteryLevel + '%' : 'N/A'}\n`;
    report += `Thermal State: ${info.power.thermalState}\n`;
    report += '\n';

    // Application
    report += '--- APPLICATION ---\n';
    report += `Name: ${info.app.name}\n`;
    report += `Version: ${info.app.version}\n`;
    report += `Uptime: ${this.formatUptime(info.app.uptime)}\n`;
    report += `Memory Usage: ${info.app.memory.rssMB} MB\n`;
    report += `Heap Used: ${info.app.memory.heapUsedMB} MB\n`;
    report += `PID: ${info.app.pid}\n`;
    report += `Processes: ${info.app.metrics.length}\n`;
    report += '\n';

    // Network
    report += '--- NETWORK ---\n';
    report += `Interfaces: ${info.network.count}\n`;
    info.network.interfaces.forEach(iface => {
      if (!iface.internal) {
        report += `  ${iface.name}: ${iface.address} (${iface.family})\n`;
      }
    });
    report += '\n';

    report += '='.repeat(60) + '\n';
    report += 'END OF REPORT\n';
    report += '='.repeat(60) + '\n';

    return report;
  }

  /**
   * Format uptime seconds to human-readable string
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
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
   * Format bytes to human-readable size
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted size
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

// Export singleton instance
module.exports = new SystemInfoManager();
