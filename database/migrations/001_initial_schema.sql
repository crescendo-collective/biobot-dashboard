-- BioBot Dashboard — Initial Database Schema
-- Disease-agnostic design supporting all BioBot Analytics API geography levels.
-- PostgreSQL 14+

BEGIN;

-- ---------------------------------------------------------------------------
-- Enumerations
-- ---------------------------------------------------------------------------

CREATE TYPE geography_level AS ENUM (
    'national',
    'regional',
    'state',
    'county',
    'zip'
);

CREATE TYPE dataset_variant AS ENUM (
    'standard',   -- e.g. /national, /state, /regional, /zip
    'ai',         -- /county/ai — model-predicted county concentrations with CIs
    'hotspots'    -- /county/hotspots — county hotspot overlay data
);

CREATE TYPE ingestion_status AS ENUM (
    'running',
    'completed',
    'failed',
    'partial'
);

-- ---------------------------------------------------------------------------
-- Reference: disease / pathogen targets (BioBot "target_name")
-- ---------------------------------------------------------------------------

CREATE TABLE targets (
    target_id         SMALLSERIAL PRIMARY KEY,
    target_code       VARCHAR(50)  NOT NULL,
    display_name      VARCHAR(100),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_targets_target_code UNIQUE (target_code)
);

COMMENT ON TABLE targets IS
    'Catalog of BioBot surveillance targets (diseases/pathogens). '
    'Adding a new disease is a row insert, not a schema change.';

-- ---------------------------------------------------------------------------
-- Geography dimension
-- One row per unique location at a given granularity.
-- Nullable columns depend on geography_level; enforced via CHECK constraints.
-- ---------------------------------------------------------------------------

CREATE TABLE locations (
    location_id       SERIAL       PRIMARY KEY,
    geography_level   geography_level NOT NULL,

    country_code      CHAR(2),     -- national
    region_code       VARCHAR(20), -- regional (BioBot-defined region identifier)
    state_abbr        CHAR(2),     -- state, county, zip
    county_fips       CHAR(5),     -- county
    county_name       VARCHAR(100),-- county display label (denormalized for queries)
    zip_code          VARCHAR(10), -- zip

    display_name      VARCHAR(200),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_locations_national
        CHECK (
            geography_level <> 'national'
            OR (country_code IS NOT NULL
                AND region_code IS NULL
                AND state_abbr IS NULL
                AND county_fips IS NULL
                AND zip_code IS NULL)
        ),
    CONSTRAINT chk_locations_regional
        CHECK (
            geography_level <> 'regional'
            OR (region_code IS NOT NULL
                AND state_abbr IS NULL
                AND county_fips IS NULL
                AND zip_code IS NULL)
        ),
    CONSTRAINT chk_locations_state
        CHECK (
            geography_level <> 'state'
            OR (state_abbr IS NOT NULL
                AND county_fips IS NULL
                AND zip_code IS NULL)
        ),
    CONSTRAINT chk_locations_county
        CHECK (
            geography_level <> 'county'
            OR (county_fips IS NOT NULL AND state_abbr IS NOT NULL)
        ),
    CONSTRAINT chk_locations_zip
        CHECK (
            geography_level <> 'zip'
            OR (zip_code IS NOT NULL)
        )
);

-- Natural keys per geography level (NULLs treated as distinct via COALESCE)
CREATE UNIQUE INDEX uq_locations_natural_key ON locations (
    geography_level,
    COALESCE(country_code, ''),
    COALESCE(region_code, ''),
    COALESCE(state_abbr, ''),
    COALESCE(county_fips, ''),
    COALESCE(zip_code, '')
);

CREATE INDEX idx_locations_geography_level ON locations (geography_level);
CREATE INDEX idx_locations_state_abbr ON locations (state_abbr) WHERE state_abbr IS NOT NULL;
CREATE INDEX idx_locations_county_fips ON locations (county_fips) WHERE county_fips IS NOT NULL;

COMMENT ON TABLE locations IS
    'Geographic dimension spanning national → regional → state → county → zip.';

-- ---------------------------------------------------------------------------
-- Dataset configuration (disease-agnostic ingestion + dashboard toggles)
-- ---------------------------------------------------------------------------

CREATE TABLE dataset_config (
    config_id         SERIAL       PRIMARY KEY,
    target_id         SMALLINT     NOT NULL REFERENCES targets (target_id),
    geography_level   geography_level NOT NULL,
    dataset_variant   dataset_variant NOT NULL DEFAULT 'standard',
    api_path_suffix   VARCHAR(100) NOT NULL,  -- e.g. 'national', 'county/ai'
    is_enabled        BOOLEAN      NOT NULL DEFAULT TRUE,
    refresh_cron      VARCHAR(50)  NOT NULL DEFAULT '0 6 * * 1', -- weekly, Monday 06:00 UTC
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_dataset_config UNIQUE (target_id, geography_level, dataset_variant)
);

COMMENT ON TABLE dataset_config IS
    'Per-target, per-geography ingestion configuration. '
    'Enabling a new disease or geography level is a config row, not a migration.';

-- ---------------------------------------------------------------------------
-- Ingestion audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE ingestion_runs (
    run_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id         INTEGER      NOT NULL REFERENCES dataset_config (config_id),
    status            ingestion_status NOT NULL DEFAULT 'running',
    started_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ,
    records_fetched   INTEGER      NOT NULL DEFAULT 0,
    records_upserted  INTEGER      NOT NULL DEFAULT 0,
    last_page_token   TEXT,
    error_message     TEXT,
    source_api_url    TEXT
);

CREATE INDEX idx_ingestion_runs_config_started
    ON ingestion_runs (config_id, started_at DESC);

COMMENT ON TABLE ingestion_runs IS
    'Tracks each scheduled or manual BioBot API fetch for observability and replay.';

-- ---------------------------------------------------------------------------
-- Core fact table: weekly surveillance observations
-- Nullable metric columns accommodate geography-specific API response shapes.
-- ---------------------------------------------------------------------------

CREATE TABLE surveillance_observations (
    observation_id    BIGSERIAL    PRIMARY KEY,
    target_id         SMALLINT     NOT NULL REFERENCES targets (target_id),
    location_id       INTEGER      NOT NULL REFERENCES locations (location_id),
    dataset_variant   dataset_variant NOT NULL DEFAULT 'standard',

    observation_date  DATE         NOT NULL,

    -- MMWR epidemiological week metadata (present in all sampled responses)
    mmwr_year         SMALLINT     NOT NULL,
    mmwr_week         SMALLINT     NOT NULL,
    mmwr_week_end     DATE         NOT NULL,
    is_forecast       BOOLEAN      NOT NULL DEFAULT FALSE,

    -- National-level metrics (effective_conc_copies_per_l_avg, rolling avg)
    effective_conc_copies_per_l_avg       NUMERIC(20, 9),
    effective_concentration_rolling_avg   NUMERIC(20, 9),

    -- County / model-predicted metrics
    effective_conc_copies_per_l_predicted NUMERIC(20, 9),

    -- Confidence intervals (county/ai responses)
    effective_conc_lower_ci_50  NUMERIC(20, 9),
    effective_conc_lower_ci_80  NUMERIC(20, 9),
    effective_conc_lower_ci_95  NUMERIC(20, 9),
    effective_conc_upper_ci_50  NUMERIC(20, 9),
    effective_conc_upper_ci_80  NUMERIC(20, 9),
    effective_conc_upper_ci_95  NUMERIC(20, 9),

    -- Risk and trend (common across geographies)
    biobot_risk_tier          VARCHAR(50),
    ordinal_risk_tier         SMALLINT,
    biobot_trend              VARCHAR(50),
    perc_change               NUMERIC(20, 9),

    -- Model versioning (supports historical comparison when models change)
    biobot_risk_tier_version    VARCHAR(20),
    nationwide_model_version    VARCHAR(20),

    -- Lineage
    ingestion_run_id  UUID         REFERENCES ingestion_runs (run_id),
    ingested_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_surveillance_observations_natural_key
        UNIQUE (target_id, location_id, dataset_variant, observation_date, is_forecast),

    CONSTRAINT chk_surveillance_mmwr_week
        CHECK (mmwr_week BETWEEN 1 AND 53)
);

-- Dashboard query patterns
CREATE INDEX idx_surveillance_target_date
    ON surveillance_observations (target_id, observation_date DESC);

CREATE INDEX idx_surveillance_location_date
    ON surveillance_observations (location_id, observation_date DESC);

CREATE INDEX idx_surveillance_target_location_date
    ON surveillance_observations (target_id, location_id, observation_date DESC);

CREATE INDEX idx_surveillance_mmwr
    ON surveillance_observations (target_id, mmwr_year, mmwr_week);

CREATE INDEX idx_surveillance_risk_tier
    ON surveillance_observations (target_id, biobot_risk_tier, observation_date DESC)
    WHERE biobot_risk_tier IS NOT NULL;

CREATE INDEX idx_surveillance_ingested_at
    ON surveillance_observations (ingested_at DESC);

COMMENT ON TABLE surveillance_observations IS
    'Weekly BioBot surveillance metrics keyed by target, location, and observation date. '
    'Metric columns are nullable to absorb geography-specific API field differences '
    'without separate per-level tables.';

-- ---------------------------------------------------------------------------
-- Convenience view: latest observation per target × location
-- ---------------------------------------------------------------------------

CREATE VIEW v_latest_surveillance AS
SELECT DISTINCT ON (so.target_id, so.location_id, so.dataset_variant)
    so.observation_id,
    t.target_code,
    t.display_name AS target_display_name,
    l.geography_level,
    l.country_code,
    l.region_code,
    l.state_abbr,
    l.county_fips,
    l.county_name,
    l.zip_code,
    l.display_name AS location_display_name,
    so.dataset_variant,
    so.observation_date,
    so.mmwr_year,
    so.mmwr_week,
    so.mmwr_week_end,
    so.is_forecast,
    so.effective_conc_copies_per_l_avg,
    so.effective_concentration_rolling_avg,
    so.effective_conc_copies_per_l_predicted,
    so.effective_conc_lower_ci_50,
    so.effective_conc_lower_ci_80,
    so.effective_conc_lower_ci_95,
    so.effective_conc_upper_ci_50,
    so.effective_conc_upper_ci_80,
    so.effective_conc_upper_ci_95,
    so.biobot_risk_tier,
    so.ordinal_risk_tier,
    so.biobot_trend,
    so.perc_change,
    so.biobot_risk_tier_version,
    so.nationwide_model_version,
    so.ingested_at
FROM surveillance_observations so
JOIN targets t ON t.target_id = so.target_id
JOIN locations l ON l.location_id = so.location_id
WHERE so.is_forecast = FALSE
ORDER BY so.target_id, so.location_id, so.dataset_variant, so.observation_date DESC;

COMMENT ON VIEW v_latest_surveillance IS
    'Most recent non-forecast observation per target, location, and dataset variant. '
    'Primary feed for dashboard map snapshots and summary cards.';

COMMIT;
