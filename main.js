const { app, BrowserWindow, Menu, dialog, shell, Tray, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const notificationManager = require('./utils/notificationManager');
const storeManager = require('./utils/storeManager');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let tray = null;
let recentFiles = [];
const MAX_RECENT_FILES = 10;

/**
 * Create the application menu
 * Platform-specific menu with keyboard shortcuts
 */
function createApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App Menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          click: () => showAboutDialog()
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            console.log('Preferences clicked');
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),

    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createMainWindow()
        },
        { type: 'separator' },
        {
          label: 'Close Window',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        { type: 'separator' },
        ...(!isMac ? [
          {
            label: 'Exit',
            accelerator: 'Alt+F4',
            click: () => app.quit()
          }
        ] : [])
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { role: 'redo', accelerator: 'CmdOrCtrl+Shift+Z' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            console.log('Find clicked');
          }
        }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: (item, focusedWindow) => {
            if (focusedWindow) focusedWindow.webContents.setZoomLevel(0);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom + 0.5);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom - 0.5);
            }
          }
        },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },

    // Help Menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://www.electronjs.org/docs');
          }
        },
        {
          label: 'Search Issues',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron/issues');
          }
        },
        {
          label: 'Community Discussions',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron/discussions');
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates...',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Updates',
              message: 'You are running the latest version!',
              detail: `Version ${app.getVersion()}\nNo updates available at this time.`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        ...(!isMac ? [{
          label: `About ${app.name}`,
          click: () => showAboutDialog()
        }] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Show About Dialog
 */
function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: `About Electron Feature Explorer`,
    message: 'Electron Feature Explorer',
    detail: `Version: ${app.getVersion()}
Platform: ${process.platform}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node.js: ${process.versions.node}

A comprehensive showcase of Electron's native desktop capabilities.

Built with ❤️ using Electron`,
    buttons: ['OK'],
    icon: null
  });
}

/**
 * Create system tray icon with context menu
 */
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let icon = nativeImage.createFromPath(iconPath);

  // Fallback to empty icon if file doesn't exist or fails to load
  if (icon.isEmpty()) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Electron Feature Explorer');

  // Create context menu for tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Hide App',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'New Window',
      click: () => createMainWindow()
    },
    { type: 'separator' },
    {
      label: 'About',
      click: () => showAboutDialog()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Click on tray icon shows/hides window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

/**
 * Toggle window visibility
 */
function toggleWindow() {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }
}

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
      sandbox: false,                 // Disabled to allow preload access to process.versions
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

  // Minimize to tray instead of closing (unless quitting)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

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
  createApplicationMenu();
  createTray();
  setupNotificationHandlers();
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

/**
 * Setup notification event handlers
 */
function setupNotificationHandlers() {
  // When notification is clicked, focus the window
  notificationManager.on('notification-clicked', (data) => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    console.log('Notification clicked:', data.id);
  });

  // When notification reply is received
  notificationManager.on('notification-replied', (data) => {
    console.log('Notification reply:', data.reply);
    if (mainWindow) {
      mainWindow.webContents.send('notification:reply-received', data);
    }
  });

  // When notification action is clicked
  notificationManager.on('notification-action', (data) => {
    console.log('Notification action:', data.action);
    if (mainWindow) {
      mainWindow.webContents.send('notification:action-clicked', data);
    }
  });
}

/**
 * IPC Handlers for Notifications
 */

// Show notification
ipcMain.handle('notification:show', (event, options) => {
  return notificationManager.show(options);
});

// Show typed notification (info, success, warning, error)
ipcMain.handle('notification:show-typed', (event, type, title, body, options) => {
  return notificationManager.showTyped(type, title, body, options);
});

// Close notification by ID
ipcMain.handle('notification:close', (event, id) => {
  return notificationManager.close(id);
});

// Close all notifications
ipcMain.handle('notification:close-all', () => {
  return notificationManager.closeAll();
});

// Get notification history
ipcMain.handle('notification:get-history', (event, limit) => {
  return notificationManager.getHistory(limit);
});

// Clear notification history
ipcMain.handle('notification:clear-history', () => {
  return notificationManager.clearHistory();
});

// Get notification queue
ipcMain.handle('notification:get-queue', () => {
  return notificationManager.getQueue();
});

// Clear notification queue
ipcMain.handle('notification:clear-queue', () => {
  return notificationManager.clearQueue();
});

// Enable Do Not Disturb
ipcMain.handle('notification:dnd-enable', () => {
  notificationManager.enableDoNotDisturb();
  return { success: true, enabled: true };
});

// Disable Do Not Disturb
ipcMain.handle('notification:dnd-disable', () => {
  notificationManager.disableDoNotDisturb();
  return { success: true, enabled: false };
});

// Toggle Do Not Disturb
ipcMain.handle('notification:dnd-toggle', () => {
  const enabled = notificationManager.toggleDoNotDisturb();
  return { success: true, enabled };
});

// Get Do Not Disturb status
ipcMain.handle('notification:dnd-status', () => {
  return { enabled: notificationManager.getDoNotDisturbStatus() };
});

// Get notification statistics
ipcMain.handle('notification:get-stats', () => {
  return notificationManager.getStats();
});

/**
 * Recent Files Management
 */
function addToRecentFiles(filePath) {
  // Remove if already exists
  recentFiles = recentFiles.filter(f => f !== filePath);
  // Add to beginning
  recentFiles.unshift(filePath);
  // Keep only MAX_RECENT_FILES
  recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  // Update menu
  createApplicationMenu();
}

function getRecentFiles() {
  return recentFiles;
}

function clearRecentFiles() {
  recentFiles = [];
  createApplicationMenu();
}

/**
 * IPC Handlers for File Dialogs
 */

// Open File Dialog
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options?.title || 'Open File',
    defaultPath: options?.defaultPath,
    buttonLabel: options?.buttonLabel || 'Open',
    filters: options?.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'showHiddenFiles']
  });

  // Add to recent files if not canceled
  if (!result.canceled && result.filePaths.length > 0) {
    addToRecentFiles(result.filePaths[0]);
  }

  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

// Open Multiple Files Dialog
ipcMain.handle('dialog:openFiles', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options?.title || 'Open Files',
    defaultPath: options?.defaultPath,
    buttonLabel: options?.buttonLabel || 'Open',
    filters: options?.filters || [
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections', 'showHiddenFiles']
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

// Save File Dialog
ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options?.title || 'Save File',
    defaultPath: options?.defaultPath,
    buttonLabel: options?.buttonLabel || 'Save',
    filters: options?.filters || [
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return {
    canceled: result.canceled,
    filePath: result.filePath
  };
});

// Select Directory Dialog
ipcMain.handle('dialog:selectDirectory', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options?.title || 'Select Directory',
    defaultPath: options?.defaultPath,
    buttonLabel: options?.buttonLabel || 'Select',
    properties: ['openDirectory', 'showHiddenFiles']
  });

  return {
    canceled: result.canceled,
    filePaths: result.filePaths
  };
});

/**
 * IPC Handlers for Message Boxes
 */

// Show message box - info, warning, error, question
ipcMain.handle('dialog:showMessageBox', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: options?.type || 'info', // 'none', 'info', 'error', 'question', 'warning'
    title: options?.title || 'Message',
    message: options?.message || '',
    detail: options?.detail || '',
    buttons: options?.buttons || ['OK'],
    defaultId: options?.defaultId || 0,
    cancelId: options?.cancelId,
    noLink: options?.noLink !== false
  });

  return {
    response: result.response, // Index of clicked button
    checkboxChecked: result.checkboxChecked
  };
});

/**
 * IPC Handlers for File Operations
 */

// Read file content
ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      success: true,
      content,
      metadata: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Write file content
ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = await fs.stat(filePath);

    return {
      success: true,
      path: filePath,
      size: stats.size
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Get file metadata
ipcMain.handle('file:getMetadata', async (event, filePath) => {
  try {
    const stats = await fs.stat(filePath);

    return {
      success: true,
      metadata: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        path: filePath,
        name: path.basename(filePath),
        directory: path.dirname(filePath),
        extension: path.extname(filePath)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Check if file exists
ipcMain.handle('file:exists', async (event, filePath) => {
  try {
    await fs.access(filePath);
    return { exists: true };
  } catch (error) {
    return { exists: false };
  }
});

// Get recent files
ipcMain.handle('file:getRecent', () => {
  return { recentFiles: getRecentFiles() };
});

// Clear recent files
ipcMain.handle('file:clearRecent', () => {
  clearRecentFiles();
  return { success: true };
});

/**
 * IPC Handlers for Persistent Storage (electron-store)
 */

// Get a value from store
ipcMain.handle('store:get', (event, key, defaultValue) => {
  try {
    const value = storeManager.get(key, defaultValue);
    return { success: true, value };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set a value in store
ipcMain.handle('store:set', (event, key, value) => {
  try {
    // Validate before setting
    if (!storeManager.validate(key, value)) {
      return { success: false, error: 'Validation failed' };
    }
    storeManager.set(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check if key exists
ipcMain.handle('store:has', (event, key) => {
  try {
    const exists = storeManager.has(key);
    return { success: true, exists };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete a key
ipcMain.handle('store:delete', (event, key) => {
  try {
    storeManager.delete(key);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Clear all store data
ipcMain.handle('store:clear', () => {
  try {
    storeManager.clear();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Reset to defaults
ipcMain.handle('store:reset', () => {
  try {
    storeManager.reset();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get all data
ipcMain.handle('store:getAll', () => {
  try {
    const data = storeManager.getAll();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get store statistics
ipcMain.handle('store:getStats', () => {
  try {
    const stats = storeManager.getStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export store data
ipcMain.handle('store:export', (event, includeSecrets) => {
  try {
    const jsonData = storeManager.export(includeSecrets);
    return { success: true, data: jsonData };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Import store data
ipcMain.handle('store:import', (event, jsonString, merge) => {
  try {
    const success = storeManager.import(jsonString, merge);
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Set encrypted secret
ipcMain.handle('store:setSecret', (event, key, value) => {
  try {
    storeManager.setSecret(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get encrypted secret
ipcMain.handle('store:getSecret', (event, key) => {
  try {
    const value = storeManager.getSecret(key);
    return { success: true, value };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete encrypted secret
ipcMain.handle('store:deleteSecret', (event, key) => {
  try {
    storeManager.deleteSecret(key);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
