# BioBot Database

PostgreSQL schema for BioBot wastewater surveillance data ingestion and dashboard queries.

## Design goals

- **Disease-agnostic** — `targets` and `dataset_config` drive which diseases and geographies are active; adding RSV → influenza is configuration, not a migration.
- **Geography-flexible** — one `locations` dimension and one `surveillance_observations` fact table cover national, regional, state, county, and zip API endpoints.
- **API-shape tolerant** — nullable metric columns absorb field differences between endpoints (e.g. national averages vs county predicted values with confidence intervals).
- **Ingestion-ready** — `ingestion_runs` provides audit trail, pagination token tracking, and error capture for weekly scheduled fetches.

## Entity relationship

```mermaid
erDiagram
    targets ||--o{ dataset_config : configures
    targets ||--o{ surveillance_observations : measures
    locations ||--o{ surveillance_observations : at
    dataset_config ||--o{ ingestion_runs : triggers
    ingestion_runs ||--o{ surveillance_observations : sources

    targets {
        smallint target_id PK
        varchar target_code UK
        varchar display_name
        boolean is_active
    }

    locations {
        int location_id PK
        geography_level geography_level
        char country_code
        varchar region_code
        char state_abbr
        char county_fips
        varchar county_name
        varchar zip_code
    }

    dataset_config {
        int config_id PK
        smallint target_id FK
        geography_level geography_level
        dataset_variant dataset_variant
        varchar api_path_suffix
        boolean is_enabled
    }

    ingestion_runs {
        uuid run_id PK
        int config_id FK
        ingestion_status status
        timestamptz started_at
        int records_upserted
        text last_page_token
    }

    surveillance_observations {
        bigint observation_id PK
        smallint target_id FK
        int location_id FK
        dataset_variant dataset_variant
        date observation_date
        smallint mmwr_year
        smallint mmwr_week
        numeric effective_conc_copies_per_l_avg
        numeric effective_conc_copies_per_l_predicted
        varchar biobot_risk_tier
        varchar biobot_trend
    }
```

## Tables

| Table | Purpose |
|-------|---------|
| `targets` | Disease/pathogen catalog (`target_name` from API) |
| `locations` | Geographic dimension with level-specific identifiers |
| `dataset_config` | Which API endpoints to fetch per target; enables config-only expansion |
| `ingestion_runs` | Per-fetch audit log with status and pagination state |
| `surveillance_observations` | Core weekly metrics (upserted from API `data[]` rows) |
| `v_latest_surveillance` | View returning the latest non-forecast row per target × location |

## API field mapping

### National (`/beta/data/{target}/national`)

| API field | Column |
|-----------|--------|
| `country_code` | `locations.country_code` |
| `target_name` | `targets.target_code` |
| `date` | `surveillance_observations.observation_date` |
| `effective_conc_copies_per_l_avg` | `effective_conc_copies_per_l_avg` |
| `effective_concentration_rolling_avg` | `effective_concentration_rolling_avg` |
| `biobot_risk_tier` | `biobot_risk_tier` |
| `ordinal_risk_tier` | `ordinal_risk_tier` |
| `biobot_trend` | `biobot_trend` |
| `perc_change` | `perc_change` |
| `mmwr_*` | `mmwr_year`, `mmwr_week`, `mmwr_week_end` |
| `is_forecast` | `is_forecast` |
| `*_version` | `biobot_risk_tier_version`, `nationwide_model_version` |

### County AI (`/beta/data/{target}/county/ai`)

| API field | Column |
|-----------|--------|
| `county_fips`, `county_name`, `state_abbr` | `locations.*` |
| `effective_conc_copies_per_l_predicted` | `effective_conc_copies_per_l_predicted` |
| `effective_conc_lower_ci_*` | `effective_conc_lower_ci_50/80/95` |
| `effective_conc_upper_ci_*` | `effective_conc_upper_ci_50/80/95` |
| *(shared fields)* | same as national |

`dataset_variant` = `ai` for county AI data; `hotspots` for `/county/hotspots`.

## Running migrations

### Local (Docker)

```bash
docker run -d --name biobot-db \
  -e POSTGRES_DB=biobot \
  -e POSTGRES_USER=biobot \
  -e POSTGRES_PASSWORD=biobot \
  -p 5432:5432 \
  postgres:16

psql "postgresql://biobot:biobot@localhost:5432/biobot" \
  -f database/migrations/001_initial_schema.sql

psql "postgresql://biobot:biobot@localhost:5432/biobot" \
  -f database/migrations/002_seed_initial_data.sql
```

### AWS RDS

Apply the same migration files in order against your RDS PostgreSQL instance. Recommended extensions: none required (`gen_random_uuid()` is built-in on PG 13+).

## Example dashboard queries

**National time series for a disease**

```sql
SELECT so.observation_date, so.effective_conc_copies_per_l_avg,
       so.effective_concentration_rolling_avg, so.biobot_risk_tier, so.biobot_trend
FROM surveillance_observations so
JOIN targets t ON t.target_id = so.target_id
JOIN locations l ON l.location_id = so.location_id
WHERE t.target_code = 'RSV'
  AND l.geography_level = 'national'
  AND so.is_forecast = FALSE
ORDER BY so.observation_date;
```

**State-level choropleth (latest week)**

```sql
SELECT v.state_abbr, v.biobot_risk_tier, v.ordinal_risk_tier, v.biobot_trend,
       v.effective_conc_copies_per_l_predicted, v.observation_date
FROM v_latest_surveillance v
WHERE v.target_code = 'RSV'
  AND v.geography_level = 'state';
```

**County map with confidence bands**

```sql
SELECT l.county_fips, l.county_name, l.state_abbr,
       so.observation_date, so.effective_conc_copies_per_l_predicted,
       so.effective_conc_lower_ci_95, so.effective_conc_upper_ci_95,
       so.biobot_risk_tier
FROM surveillance_observations so
JOIN targets t ON t.target_id = so.target_id
JOIN locations l ON l.location_id = so.location_id
WHERE t.target_code = 'RSV'
  AND l.geography_level = 'county'
  AND so.dataset_variant = 'ai'
  AND so.observation_date = $1;
```

## Adding a second disease

```sql
INSERT INTO targets (target_code, display_name) VALUES ('INFLUENZA_A', 'Influenza A');

INSERT INTO dataset_config (target_id, geography_level, dataset_variant, api_path_suffix)
SELECT t.target_id, dc.geography_level, dc.dataset_variant, dc.api_path_suffix
FROM targets t
CROSS JOIN dataset_config dc
JOIN targets rsv ON rsv.target_id = dc.target_id AND rsv.target_code = 'RSV'
WHERE t.target_code = 'INFLUENZA_A';
```

No schema migration required.

## Future considerations (out of scope for this story)

- Raw JSON staging table or S3 archive before normalization
- `county/hotspots` response shape — add columns when sample payload is available
- Regional and zip field mapping — follow same nullable-column pattern once samples are confirmed
- Row-level retention policy (1–2 years) via scheduled partition pruning or `DELETE`
