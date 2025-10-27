const { app, BrowserWindow, Menu, dialog, shell, Tray, nativeImage, Notification, ipcMain } = require('electron');
const path = require('path');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let tray = null;

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
 * IPC Handlers for Notifications
 */
ipcMain.handle('notification:show', (event, options) => {
  if (!Notification.isSupported()) {
    return { success: false, error: 'Notifications not supported' };
  }

  try {
    const notification = new Notification({
      title: options.title || 'Notification',
      body: options.body || '',
      icon: options.icon || path.join(__dirname, 'assets', 'tray-icon.png'),
      silent: options.silent || false,
      urgency: options.urgency || 'normal'
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notification.show();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

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
