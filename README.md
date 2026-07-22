# BioBot Dashboard

Sanofi BioBot wastewater surveillance dashboard — React frontend, AWS Lambda API, and PostgreSQL data layer.

## Current scope

This repository contains:

1. **PostgreSQL database schema** — disease-agnostic tables for BioBot ingestion and dashboard queries ([database/README.md](database/README.md))
2. **React frontend** — Vite + TypeScript dashboard embeddable in an `<iframe>` ([frontend/README.md](frontend/README.md))
3. **AWS Lambda API** — data import and read endpoints backed by PostgreSQL

| Endpoint                              | Geography | Dataset variant |
| ------------------------------------- | --------- | --------------- |
| `/beta/data/{target}/national`        | National  | `standard`      |
| `/beta/data/{target}/regional`        | Regional  | `standard`      |
| `/beta/data/{target}/state`           | State     | `standard`      |
| `/beta/data/{target}/county/ai`       | County    | `ai`            |
| `/beta/data/{target}/county/hotspots` | County    | `hotspots`      |
| `/beta/data/{target}/zip`             | ZIP       | `standard`      |

API integration (Lambda fetch, S3 staging) is implemented in `lambdas/import-data`.

### BioBot API client

Reusable client in `lambdas/shared/biobot-api.js`. Lambdas import it and call dataset helpers without handling auth or HTTP details.

```javascript
const {
  createBioBotClient,
  fetchNationalData,
  fetchStateData,
  fetchCountyData,
} = require('./shared/biobot-api');

// Option 1: convenience functions (read config from env)
const nationalRows = await fetchNationalData('RSV');
const stateRows = await fetchStateData('RSV');
const countyRows = await fetchCountyData('RSV', { variant: 'ai' });

// Option 2: explicit client instance (useful in tests)
const client = createBioBotClient({ apiKey: process.env.BIOBOT_API_KEY });
const page = await client.fetchPage('RSV', 'national');
```

Authentication matches the [BioBot Analytics Postman collection](https://api.explore.biobot.io): Bearer token only, no custom headers. Target codes are lowercased in URLs (`RSV` → `rsv`).

| Header | Source |
|--------|--------|
| `Authorization` | `Bearer ${BIOBOT_API_KEY}` |
| `Accept` | `application/json` |
| `User-Agent` | `sanofi-biobot-dashboard/0.1.0` (override via `BIOBOT_USER_AGENT`) |

Endpoints follow `/beta/data/{target}/{path}` with automatic pagination via `next_page_token`.

The schema supports all geography levels exposed by the [BioBot Analytics API](https://api.explore.biobot.io).

## Folder structure

```
biobot-dashboard/
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_seed_initial_data.sql
│   └── README.md
├── frontend/              # React + Vite dashboard
├── lambdas/
│   ├── import-data/
│   ├── get-map/
│   ├── get-trends/
│   ├── get-history/
│   └── shared/
├── template.yaml          # AWS SAM
├── samconfig.toml
└── package.json           # npm workspaces root
```

## Quick start

### Database

See [database/README.md](database/README.md) for schema documentation, ER diagram, field mappings, and migration instructions.

```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/migrations/002_seed_initial_data.sql
```

### Application

```bash
npm install
cp frontend/.env.example frontend/.env
npm run dev          # frontend at http://localhost:5173
npm run build        # outputs to frontend/dist/
npm run typecheck    # TypeScript only, no build
npm run sam:build    # build Lambdas
```

The frontend is a plain React + Vite + TypeScript app (no Next.js), designed to
be embedded in an `<iframe>` on another site. See [frontend/README.md](frontend/README.md)
for production build details, iframe `Content-Security-Policy` headers, the
dark/light theme system, and source layout.

### Environment variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Lambdas | PostgreSQL connection string |
| `BIOBOT_API_KEY` | import-data | BioBot API bearer token (`Authorization: Bearer`) |
| `BIOBOT_API_BASE_URL` | import-data | Default: `https://api.explore.biobot.io` |
| `VITE_API_BASE_URL` | frontend | API Gateway base URL |

## API endpoints (SAM)

| Method | Path | Lambda | Description |
|--------|------|--------|-------------|
| `POST` | `/import` | import-data | Trigger manual data import |
| `GET` | `/map?target=RSV&level=state` | get-map | Map choropleth features |
| `GET` | `/trends?target=RSV&level=national` | get-trends | Latest trend summary |
| `GET` | `/history?target=RSV&level=national&weeks=52` | get-history | Time-series history |

## Key design decision

A single `surveillance_observations` fact table with nullable geography-specific metric columns avoids per-disease or per-level table proliferation. When Sanofi adds influenza or COVID, only `targets` and `dataset_config` rows change — the schema stays the same.

## Deploy to AWS

```bash
npm run sam:deploy
```

SAM prompts for `DatabaseUrl` and `BioBotApiKey`. The stack creates API Gateway with CORS, 4 Lambda functions, and an EventBridge schedule (weekly import, Monday 06:00 UTC).
