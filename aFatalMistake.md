# A Fatal Mistake

## A bad start, A bloated app, and me trying to fix the unfixable

I went into this Electron.js project without doing proper research. Started building without understanding the ecosystem. Files started bloating and when i tried to restructure it every last thing imaginable broke. Electron hated the new architecture, spitting errors left and right. In the end it took me more time to fix all newly occuring errors than it took me to build the app in the first place. It occured to me that the fundamental structure is broken beyond repair. There is a place and time for anything, even giving up and abandonning a failed project. And that time is now. (´• ︵ •`)

## What I Should Have Done

Used **electron-vite-react** from the start. The inofficial boilerplate that actually works.

### The Proper Stack
- **Electron IPC** – (a.k.a. "Electron.js")
- **electron-vite React** – Lightning Vite + Electron.
- **Tailwind** – for styling.
- **React Router** – (don't use next.js, the overhead isn't worth it)
- **Prisma + libSQL SQLite** – Pure JS/WASM. (If you need a database)
- **PostgREST** - (if you need a quick crud db for some reason)


**Quick Start**
```bash
mkdir myapp && cd myapp
pnpm create electron-vite . --template react
pnpm i tailwindcss postcss autoprefixer @prisma/adapter-libsql libsql-experimental prisma react-router-dom
npx tailwindcss init -p
npx prisma init --datasource-provider sqlite
```
**tailwind.config.js**: 
`content: ['./src/**/*.{jsx,tsx}']`

**prisma/schema.prisma**:
```
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite" url = "file:./app.db" }
```

**main > preload** *(adapter!)*:
```js
import { PrismaClient } from '@prisma/client';
import { createLibSQLAdapter } from '@prisma/adapter-libsql';
import { createClient } from 'libsql-experimental';
const adapter = createLibSQLAdapter(createClient({ url: 'file:app.db' }));
export const prisma = new PrismaClient({ adapter });
```
**pnpm dev**

*Also see [ElectronReview.md](ElectronReview.md)* to see my thoughts on Electron and Tauri

---

### Architecture is still broken
Despite dispersing the index.html file into multiple files, the architecture is still broken. The main.js was completely misconstructed and should have been split in the following ways:

>This is a 600-line pile-up that should **never** live in `main.js`.  
It’s doing window lifecycle, tab routing, menu assembly, tray icon, IPC *encyclopedia*, protocol handling, clipboard nanny, store CRUD, system-info report generator… all in one file.  

**Burn it down and shard it:**

1. `main.js` – 30 lines max  
   - `app.whenReady() → createWindow()`  
   - `app.on('window-all-closed')`  
   - `app.on('activate')`  
   - delegate everything else.

2. `main/windows/mainWindow.js`  
   - Export `createMainWindow()` – the BrowserWindow factory only.

3. `main/windows/tabManager.js`  
   - `switchTab()`, `updateBrowserViewBounds()` – keep the BrowserView logic here.

4. `main/menu/applicationMenu.js`  
   - `createApplicationMenu()` – return the Menu object, nothing more.

5. `main/tray/trayManager.js`  
   - `createTray()`, `toggleWindow()` – tray icon and its context menu.

6. `main/ipc/handlers.js`  
   - One file that *registers* every `ipcMain.handle` by importing tiny handler functions from `main/ipc/handlers/*.js` (notifications, files, store, clipboard, etc.).  
   - Never put the handler *code* here—only the `ipcMain.handle('name', importedFunc)`.

7. `main/services/protocolService.js`  
   - `registerProtocolHandler()`, `handleProtocolUrl()` – deep-link logic.

8. `main/services/shortcutService.js`  
   - `setupShortcutHandlers()` – global-shortcut wire-up.

9. `main/services/cleanupService.js`  
   - `app.on('before-quit')` – unregister shortcuts, save state, exit.

10. `main/utils/recentFiles.js`  
    - Tiny module: `addToRecentFiles()`, `getRecentFiles()`, `clearRecentFiles()` – used by menu and IPC.