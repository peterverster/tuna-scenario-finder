# TUNA Scenario Finder

React UI for the TUNA scenario-building tool, packaged as a Vite app and configured for Vercel deployment.

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The static build is emitted to `dist/`.

## Deploy to Vercel

The repo includes `vercel.json` with the Vite framework preset, so Vercel auto-detects everything.

### Option A — Vercel dashboard (recommended)

1. Push this repo to GitHub (already at https://github.com/peterverster/tuna-scenario-finder.git).
2. Go to https://vercel.com/new and import the repo.
3. Accept the defaults — Framework: **Vite**, Build Command: `npm run build`, Output Directory: `dist`.
4. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel        # first run: link the project
vercel --prod # ship to production
```

## Project layout

- `tuna-scenario-tool.jsx` — the original component (default export `TUNAScenarioTool`)
- `src/main.jsx` — Vite entry that mounts the component
- `src/index.css` — Tailwind directives + base styles
- `index.html` — Vite HTML shell, loads JetBrains Mono
- `tailwind.config.js`, `postcss.config.js`, `vite.config.js` — build config
- `vercel.json` — Vercel framework + SPA rewrite config
