const { query } = require('../shared/db');
const { ok, badRequest, serverError } = require('../shared/response');

const VALID_LEVELS = ['national', 'regional', 'state', 'county'];

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const target = (params.target || 'RSV').toUpperCase();
    const level = (params.level || 'national').toLowerCase();

    if (!VALID_LEVELS.includes(level)) {
      return badRequest(`level must be one of: ${VALID_LEVELS.join(', ')}`);
    }

    const nationalSql = `
      SELECT v.observation_date, v.biobot_risk_tier, v.ordinal_risk_tier,
             v.biobot_trend, v.perc_change,
             v.effective_conc_copies_per_l_avg,
             v.effective_concentration_rolling_avg,
             v.mmwr_year, v.mmwr_week
      FROM v_latest_surveillance v
      WHERE v.target_code = $1 AND v.geography_level = 'national'
      LIMIT 1`;

    const regionalSql = `
      SELECT v.region_code, v.observation_date, v.biobot_risk_tier,
             v.ordinal_risk_tier, v.biobot_trend, v.perc_change,
             v.effective_conc_copies_per_l_avg
      FROM v_latest_surveillance v
      WHERE v.target_code = $1 AND v.geography_level = 'regional'
      ORDER BY v.region_code`;

    const stateSql = `
      SELECT v.state_abbr, v.observation_date, v.biobot_risk_tier,
             v.ordinal_risk_tier, v.biobot_trend, v.perc_change,
             v.effective_conc_copies_per_l_predicted,
             v.effective_conc_copies_per_l_avg
      FROM v_latest_surveillance v
      WHERE v.target_code = $1 AND v.geography_level = 'state'
      ORDER BY v.state_abbr`;

    const countySql = `
      SELECT v.state_abbr, v.county_fips, v.county_name,
             v.observation_date, v.biobot_risk_tier, v.ordinal_risk_tier,
             v.biobot_trend, v.perc_change,
             v.effective_conc_copies_per_l_predicted
      FROM v_latest_surveillance v
      WHERE v.target_code = $1 AND v.geography_level = 'county'
        AND v.dataset_variant = 'ai'
      ORDER BY v.state_abbr, v.county_fips`;

    const sqlByLevel = {
      national: nationalSql,
      regional: regionalSql,
      state: stateSql,
      county: countySql,
    };

    const result = await query(sqlByLevel[level], [target]);

    return ok({
      target,
      level,
      observationDate: result.rows[0]?.observation_date || null,
      trends: level === 'national' ? result.rows[0] || null : result.rows,
    });
  } catch (err) {
    return serverError(err);
  }
};
