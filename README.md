# Dashboard

A plain React + Vite + TypeScript dashboard (no Next.js), built to be embedded
in an `<iframe>` on another site.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build for production

```bash
npm run build
```

Runs a type check (`tsc -b`) before the Vite build. Run `npm run typecheck`
on its own any time to just check types without building.

Outputs static files to `dist/`. Deploy that folder to any static host
(Vercel, Netlify, S3 + CloudFront, GitHub Pages, your own nginx box, etc.).
`vite.config.js` uses `base: './'`, so the build works whether it's served
from the domain root or a sub-path.

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

Everything currently reads from `src/data/mockData.js`. Replace its exports
with a `fetch()` call (or `useEffect` + `useState`, or a small SWR/React
Query setup if the dashboard will poll) — every component already consumes
that same shape, so nothing else needs to change.

## Theme (dark / light)

There's a toggle in the header (sun/moon switch, next to the hamburger menu).

- `src/context/ThemeContext.tsx` holds the state, writes `data-theme="dark"|"light"`
  onto `<html>`, and persists the choice to `localStorage`.
- `src/index.css` defines two variable sets, `[data-theme='dark']` and
  `[data-theme='light']`, both under the same variable names (`--bg`,
  `--surface`, `--text`, `--accent-cyan`, etc.) — every component reads
  those variables, so nothing else needs to change when the theme flips.
- An inline script in `index.html` sets `data-theme` before React mounts,
  so there's no flash of the wrong theme on reload.
- First-time visitors get the OS-level `prefers-color-scheme` as the
  default; after that, their explicit choice wins.

To restyle a theme, edit the values inside its `[data-theme='...']` block
in `src/index.css` — the light palette is a separate hand-tuned set, not
an inversion of the dark one, so contrast stays right in both.

## Structure

```
src/
  components/
    layout/
      Header.jsx       — logo, timeline scrubber, theme toggle, menu
      Sidebar.jsx       — Pathogens / Drugs tracker lists
      MapContainer.jsx  — placeholder for the county choropleth
      InsightPanel.jsx  — risk / forecast stat cards
    ui/
      ThemeToggle.jsx   — the sun/moon switch
  context/
    ThemeContext.jsx    — dark/light state, persisted + OS-aware
  App.jsx                — composes the layout, sample data
  index.css               — design tokens (colors, type) per theme
```
