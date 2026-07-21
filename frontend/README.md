# BioBot Dashboard — Frontend

A plain React + Vite + TypeScript dashboard (no Next.js), built to be embedded
in an `<iframe>` on another site.

## Run it locally

From the repository root:

```bash
npm install
cp frontend/.env.example frontend/.env   # optional: set VITE_API_BASE_URL
npm run dev
```

Opens at `http://localhost:5173`.

## Build for production

```bash
npm run build
```

Runs a type check (`tsc -b`) before the Vite build. Run `npm run typecheck`
on its own any time to just check types without building.

Outputs static files to `frontend/dist/`. Deploy that folder to any static host
(Vercel, Netlify, S3 + CloudFront, GitHub Pages, your own nginx box, etc.).
`vite.config.ts` uses `base: './'`, so the build works whether it's served
from the domain root or a sub-path.

## Routing

The app uses `react-router-dom`'s `BrowserRouter`, with the selected
pathogen driving the URL: `/rsv`, `/sars-cov-2`, etc. — visiting `/`
redirects to whatever's first in `src/data/trackers.ts`'s `pathogens`
list. Reading `useParams().disease` anywhere under the route is the
current pathogen; that's also the hook point for wiring up a real API
call per-pathogen later.

**This needs one thing from your host:** `BrowserRouter` uses real
paths, so a direct link or hard refresh on `/rsv` has to still serve
`index.html` (React Router then reads the URL client-side) — most
static hosts 404 on that by default unless told otherwise:
- **Vercel**: add a rewrite in `vercel.json` — `{ "source": "/(.*)", "destination": "/index.html" }`
- **Netlify**: a `_redirects` file with `/*  /index.html  200`
- **nginx**: `try_files $uri /index.html;` in the server block
- **S3 + CloudFront**: set the CloudFront error page (403/404) to return `/index.html` with a 200

If you'd rather not deal with server rewrites at all (e.g. deploying to
a host you don't control the config for), swapping `BrowserRouter` for
`HashRouter` in `main.tsx` gets you `/#/rsv`-style URLs that work on any
static host with zero config — trade-off is the URL is slightly less
clean. Worth deciding based on your actual host before shipping this.

## Making it embeddable

Embedding is controlled by HTTP response headers from wherever you **host**
the built app — nothing in the React code itself blocks framing, but most
static hosts send a restrictive default you'll need to override:

- **Don't send `X-Frame-Options: DENY` or `SAMEORIGIN`** (or send
  `X-Frame-Options: ALLOWALL` / omit it entirely).
- **Set a `Content-Security-Policy` `frame-ancestors` directive** naming the
  site(s) allowed to embed it, e.g.:
  ```
  Content-Security-Policy: frame-ancestors https://your-external-site.com
  ```
  `frame-ancestors` takes precedence over `X-Frame-Options` in modern
  browsers, so this is the one that actually matters in production —
  set it as narrowly as you can (avoid `*` if this dashboard shows any
  non-public data).

Where to set this depends on your host:
- **Vercel/Netlify**: a `_headers` file or `vercel.json` `headers` config.
- **nginx**: `add_header` in the server block.
- **S3/CloudFront**: a CloudFront response headers policy.

On the **embedding site**, the iframe tag looks like:

```html
<iframe
  src="https://your-dashboard-domain.com"
  width="100%"
  height="700"
  style="border: 0;"
  loading="lazy"
></iframe>
```

## Swapping in real data

Sample data lives under `src/data/mock/`. Replace those exports with a
`fetch()` call (or `useEffect` + `useState`, or a small SWR/React Query setup
if the dashboard will poll) — every component already consumes that same shape,
so nothing else needs to change.

Planned additions: `services/api.ts`, `context/DashboardContext.tsx` for Lambda
API wiring via `VITE_API_BASE_URL`.

## Theme (dark / light)

There's a toggle in the header (sun/moon switch, next to the hamburger menu).

- `src/context/ThemeContext.tsx` holds the state, writes `data-theme="dark"|"light"`
  onto `<html>`, and persists the choice to `localStorage`.
- `src/styles/index.scss` defines two variable sets, `[data-theme='dark']` and
  `[data-theme='light']`, both under the same variable names (`--bg`,
  `--surface`, `--text`, `--accent-cyan`, etc.) — every component reads
  those variables, so nothing else needs to change when the theme flips.
- An inline script in `index.html` sets `data-theme` before React mounts,
  so there's no flash of the wrong theme on reload.
- First-time visitors get the OS-level `prefers-color-scheme` as the
  default; after that, their explicit choice wins.

To restyle a theme, edit the values inside its `[data-theme='...']` block
in `src/styles/index.scss` — the light palette is a separate hand-tuned set, not
an inversion of the dark one, so contrast stays right in both.

## Structure

```
src/
  components/
    layout/
      Header.tsx        — logo, timeline scrubber, theme toggle, menu
      Sidebar.tsx       — Pathogens tracker lists
      MapContainer/     — county choropleth map
      InsightPanel.tsx  — risk / forecast stat cards
    ui/
      ThemeToggle.tsx   — the sun/moon switch
  context/
    ThemeContext.tsx    — dark/light state, persisted + OS-aware
  data/mock/            — sample county risk lookup
  styles/
    index.scss          — design tokens (colors, type) per theme
  App.tsx               — composes the layout, sample data
  main.tsx
```
