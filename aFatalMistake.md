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