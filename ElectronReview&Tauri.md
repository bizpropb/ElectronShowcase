# Electron Review

Web developers build desktop apps with HTML, CSS, JavaScript. Bundles Chromium + Node.js. Version 32.0.0 (2025). Powers VS Code, Discord, Slack, Spotify, WhatsApp.

## PROS

**vs Native (C++/Qt/Rust/etc):**
- Faster development - web skills transfer directly
- Write once, run on Windows, macOS, Linux - no platform rewrites
- Huge ecosystem - npm, React, Vue, frameworks, libraries
- Hot reload during dev
- Easier to hire web devs than native devs

**vs Web Apps:**
- File system access
- Native menus, system trays, notifications
- Hardware access (USB, serial ports)
- Works offline
- Auto-updates built-in

**vs Other Cross-Platform (Flutter/Qt):**
- Mature - 10+ years, battle-tested
- Larger community and resources
- Faster prototyping with existing web skills

## CONS

**vs Native:**
- bigger size*
- consumes more RAM*
- Slower performance - JS + Chromium overhead
- High battery drain
- Each app bundles own Chromium

**vs Web Apps:**
- Local Chromium overhead
- Must maintain/patch Chromium yourself
- Security risks - XSS/CSRF from full web engine

**vs Other Cross-Platform:**
- Flutter/Qt/Tauri are lighter and faster
- Worse for games, video editors, real-time apps
- CPU/GPU-intensive tasks lag significantly

## Tauri
Tauri (https://tauri.app/) is an alternative framework for building desktop apps with web technologies (HTML, CSS, JS) for the frontend, but it uses your operating system's own webview instead of bundling Chromium like Electron does. This makes the apps much smaller and far more efficient.

While the Frontend is able to use any web technology, the major **downside** is that The backend/core that manages windows and system operations forces Rust, which most web developers can neither read or write. (Note: Many common tasks can be done through Tauri's pre-built JavaScript APIs without writing Rust)

Tauri is able to run with up to 10 times less RAM than Electron with its Chromium Architecture, almost matching native.

*While it is possible to start a project in Electron and migrate to Tauri, Tauri doesn't use node.js and thus some npm packages won't work.

| Type of npm Package | Works in Tauri? | Notes |
| :--- | :--- | :--- |
| **UI Components** (React, Vue, etc.) | ✅ **Yes** | Your entire UI layer works fine |
| **Build Tools** (Vite, Webpack) | ✅ **Yes** | Used in development |
| **Utility Libraries** (Lodash, date-fns) | ✅ **Yes** | Pure JavaScript libraries work |
| **System Operations** (fs, path, child_process) | ❌ **No** | These Node.js APIs don't exist in Tauri |
| **Native Node Modules** (database drivers, sharp) | ❌ **No** | Can't use Node.js C++ bindings |


## Comparison Table (RAM Usage) Electron vs. Tauri:

| App Scale | Example | Electron RAM Usage | Tauri RAM Usage | Ratio | 
| :-------- | :------ | :---------------- | :-------------- | :---- | 
| **Small App** | basic text editor, system monitor, or simple utility. | **~150 MB**<br>(~120 MB Chromium + ~30 MB App) | **~40 MB**<br>(~10 MB WebView + ~30 MB App) | **~3.8 : 1** | 
| **Medium App** | Discord, Slack, or a medium-complexity tool like a database client. | **~400 MB**<br>(~120 MB Chromium + ~280 MB App) | **~200 MB**<br>(~10 MB WebView + ~190 MB App) | **~2 : 1** | 
| **Large App** | VS Code, Figma, or a complex music production app. | **~800 MB**<br>(~120 MB Chromium + ~680 MB App) | **~600 MB**<br>(~10 MB WebView + ~590 MB App) | **~1.3 : 1** | 

TL;DR: Electron is 'fine' for larger apps, but a waste on smaller apps, especially on RAM limited devices.
