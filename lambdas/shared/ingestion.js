const { query } = require('../shared/db');

const GEOGRAPHY_LEVELS = ['national', 'regional', 'state', 'county', 'zip'];

async function resolveLocationId(client, row, geographyLevel) {
  const params = [geographyLevel];
  let where = 'geography_level = $1';

  if (geographyLevel === 'national') {
    params.push(row.country_code || 'US');
    where += ' AND country_code = $2';
  } else if (geographyLevel === 'regional') {
    params.push(row.region_code);
    where += ' AND region_code = $2';
  } else if (geographyLevel === 'state') {
    params.push(row.state_abbr);
    where += ' AND state_abbr = $2';
  } else if (geographyLevel === 'county') {
    params.push(row.county_fips, row.state_abbr);
    where += ' AND county_fips = $2 AND state_abbr = $3';
  } else if (geographyLevel === 'zip') {
    params.push(row.zip_code);
    where += ' AND zip_code = $2';
  }

  const existing = await client.query(
    `SELECT location_id FROM locations WHERE ${where}`,
    params
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].location_id;
  }

  const insert = await client.query(
    `INSERT INTO locations (
       geography_level, country_code, region_code, state_abbr,
       county_fips, county_name, zip_code, display_name
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING location_id`,
    [
      geographyLevel,
      row.country_code || (geographyLevel === 'national' ? 'US' : null),
      row.region_code || null,
      row.state_abbr || null,
      row.county_fips || null,
      row.county_name || null,
      row.zip_code || null,
      row.county_name || row.region_code || row.state_abbr || row.zip_code || null,
    ]
  );

  return insert.rows[0].location_id;
}

function mapObservationFields(row) {
  return {
    observation_date: row.date,
    mmwr_year: row.mmwr_year,
    mmwr_week: row.mmwr_week,
    mmwr_week_end: row.mmwr_week_end,
    is_forecast: row.is_forecast ?? false,
    effective_conc_copies_per_l_avg: row.effective_conc_copies_per_l_avg ?? null,
    effective_concentration_rolling_avg: row.effective_concentration_rolling_avg ?? null,
    effective_conc_copies_per_l_predicted: row.effective_conc_copies_per_l_predicted ?? null,
    effective_conc_lower_ci_50: row.effective_conc_lower_ci_50 ?? null,
    effective_conc_lower_ci_80: row.effective_conc_lower_ci_80 ?? null,
    effective_conc_lower_ci_95: row.effective_conc_lower_ci_95 ?? null,
    effective_conc_upper_ci_50: row.effective_conc_upper_ci_50 ?? null,
    effective_conc_upper_ci_80: row.effective_conc_upper_ci_80 ?? null,
    effective_conc_upper_ci_95: row.effective_conc_upper_ci_95 ?? null,
    biobot_risk_tier: row.biobot_risk_tier ?? null,
    ordinal_risk_tier: row.ordinal_risk_tier ?? null,
    biobot_trend: row.biobot_trend ?? null,
    perc_change: row.perc_change ?? null,
    biobot_risk_tier_version: row.biobot_risk_tier_version ?? null,
    nationwide_model_version: row.nationwide_model_version ?? null,
  };
}

async function upsertObservations(client, targetId, locationId, datasetVariant, rows, runId) {
  let upserted = 0;

  for (const row of rows) {
    const fields = mapObservationFields(row);
    await client.query(
      `INSERT INTO surveillance_observations (
         target_id, location_id, dataset_variant, observation_date,
         mmwr_year, mmwr_week, mmwr_week_end, is_forecast,
         effective_conc_copies_per_l_avg, effective_concentration_rolling_avg,
         effective_conc_copies_per_l_predicted,
         effective_conc_lower_ci_50, effective_conc_lower_ci_80, effective_conc_lower_ci_95,
         effective_conc_upper_ci_50, effective_conc_upper_ci_80, effective_conc_upper_ci_95,
         biobot_risk_tier, ordinal_risk_tier, biobot_trend, perc_change,
         biobot_risk_tier_version, nationwide_model_version, ingestion_run_id
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
       )
       ON CONFLICT (target_id, location_id, dataset_variant, observation_date, is_forecast)
       DO UPDATE SET
         mmwr_year = EXCLUDED.mmwr_year,
         mmwr_week = EXCLUDED.mmwr_week,
         mmwr_week_end = EXCLUDED.mmwr_week_end,
         effective_conc_copies_per_l_avg = EXCLUDED.effective_conc_copies_per_l_avg,
         effective_concentration_rolling_avg = EXCLUDED.effective_concentration_rolling_avg,
         effective_conc_copies_per_l_predicted = EXCLUDED.effective_conc_copies_per_l_predicted,
         effective_conc_lower_ci_50 = EXCLUDED.effective_conc_lower_ci_50,
         effective_conc_lower_ci_80 = EXCLUDED.effective_conc_lower_ci_80,
         effective_conc_lower_ci_95 = EXCLUDED.effective_conc_lower_ci_95,
         effective_conc_upper_ci_50 = EXCLUDED.effective_conc_upper_ci_50,
         effective_conc_upper_ci_80 = EXCLUDED.effective_conc_upper_ci_80,
         effective_conc_upper_ci_95 = EXCLUDED.effective_conc_upper_ci_95,
         biobot_risk_tier = EXCLUDED.biobot_risk_tier,
         ordinal_risk_tier = EXCLUDED.ordinal_risk_tier,
         biobot_trend = EXCLUDED.biobot_trend,
         perc_change = EXCLUDED.perc_change,
         biobot_risk_tier_version = EXCLUDED.biobot_risk_tier_version,
         nationwide_model_version = EXCLUDED.nationwide_model_version,
         ingestion_run_id = EXCLUDED.ingestion_run_id,
         ingested_at = NOW()`,
      [
        targetId,
        locationId,
        datasetVariant,
        fields.observation_date,
        fields.mmwr_year,
        fields.mmwr_week,
        fields.mmwr_week_end,
        fields.is_forecast,
        fields.effective_conc_copies_per_l_avg,
        fields.effective_concentration_rolling_avg,
        fields.effective_conc_copies_per_l_predicted,
        fields.effective_conc_lower_ci_50,
        fields.effective_conc_lower_ci_80,
        fields.effective_conc_lower_ci_95,
        fields.effective_conc_upper_ci_50,
        fields.effective_conc_upper_ci_80,
        fields.effective_conc_upper_ci_95,
        fields.biobot_risk_tier,
        fields.ordinal_risk_tier,
        fields.biobot_trend,
        fields.perc_change,
        fields.biobot_risk_tier_version,
        fields.nationwide_model_version,
        runId,
      ]
    );
    upserted += 1;
  }

  return upserted;
}

module.exports = {
  GEOGRAPHY_LEVELS,
  resolveLocationId,
  mapObservationFields,
  upsertObservations,
};
