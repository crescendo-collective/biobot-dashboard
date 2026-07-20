const { getPool } = require('../shared/db');
const { fetchAllPages } = require('../shared/biobot-api');
const { resolveLocationId, upsertObservations } = require('../shared/ingestion');
const { ok, serverError } = require('../shared/response');

exports.handler = async (event) => {
  const pool = getPool();
  const client = await pool.connect();
  const results = [];

  try {
    const configs = await client.query(
      `SELECT dc.config_id, dc.geography_level, dc.dataset_variant,
              dc.api_path_suffix, t.target_code, t.target_id
       FROM dataset_config dc
       JOIN targets t ON t.target_id = dc.target_id
       WHERE dc.is_enabled = TRUE AND t.is_active = TRUE
       ORDER BY t.target_code, dc.geography_level`
    );

    for (const config of configs.rows) {
      const run = await client.query(
        `INSERT INTO ingestion_runs (config_id, status, source_api_url)
         VALUES ($1, 'running', $2)
         RETURNING run_id`,
        [
          config.config_id,
          `${process.env.BIOBOT_API_BASE_URL}/beta/data/${config.target_code}/${config.api_path_suffix}`,
        ]
      );
      const runId = run.rows[0].run_id;

      try {
        const rows = await fetchAllPages(config.target_code, config.api_path_suffix);
        const locationCache = new Map();
        let upserted = 0;

        await client.query('BEGIN');

        for (const row of rows) {
          const cacheKey = JSON.stringify({
            level: config.geography_level,
            country: row.country_code,
            region: row.region_code,
            state: row.state_abbr,
            county: row.county_fips,
            zip: row.zip_code,
          });

          let locationId = locationCache.get(cacheKey);
          if (!locationId) {
            locationId = await resolveLocationId(client, row, config.geography_level);
            locationCache.set(cacheKey, locationId);
          }

          const count = await upsertObservations(
            client,
            config.target_id,
            locationId,
            config.dataset_variant,
            [row],
            runId
          );
          upserted += count;
        }

        await client.query('COMMIT');

        await client.query(
          `UPDATE ingestion_runs
           SET status = 'completed', completed_at = NOW(),
               records_fetched = $2, records_upserted = $3
           WHERE run_id = $1`,
          [runId, rows.length, upserted]
        );

        results.push({
          target: config.target_code,
          geography: config.geography_level,
          variant: config.dataset_variant,
          fetched: rows.length,
          upserted,
          status: 'completed',
        });
      } catch (err) {
        await client.query('ROLLBACK');
        await client.query(
          `UPDATE ingestion_runs
           SET status = 'failed', completed_at = NOW(), error_message = $2
           WHERE run_id = $1`,
          [runId, err.message]
        );

        results.push({
          target: config.target_code,
          geography: config.geography_level,
          variant: config.dataset_variant,
          status: 'failed',
          error: err.message,
        });
      }
    }

    return ok({ imported: results });
  } catch (err) {
    return serverError(err);
  } finally {
    client.release();
  }
};
