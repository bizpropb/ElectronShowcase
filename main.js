const { app, BrowserWindow } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

/**
 * Create the main application window with secure configuration
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0d1117',
    show: false, // Don't show until ready to prevent flickering
    webPreferences: {
      // Security best practices
      contextIsolation: true,        // Protect against prototype pollution
      nodeIntegration: false,         // Disable Node.js in renderer
      sandbox: true,                  // Enable Chromium sandbox
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the main HTML file
  mainWindow.loadFile('index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Clean up reference when window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App lifecycle: Ready
 * This event fires when Electron has finished initialization
 */
app.whenReady().then(() => {
  createMainWindow();

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * App lifecycle: All windows closed
 * Quit when all windows are closed, except on macOS
 */
app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * App lifecycle: Before quit
 * Perform cleanup before application quits
 */
app.on('before-quit', () => {
  // Cleanup tasks can be added here
  console.log('Application shutting down...');
});
