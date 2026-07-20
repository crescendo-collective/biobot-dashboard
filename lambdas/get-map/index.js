const { query } = require('../shared/db');
const { ok, badRequest, serverError } = require('../shared/response');

const VALID_LEVELS = ['state', 'county'];
const VALID_VARIANTS = ['standard', 'ai', 'hotspots'];

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const target = (params.target || 'RSV').toUpperCase();
    const level = (params.level || 'state').toLowerCase();
    const variant = (params.variant || (level === 'county' ? 'ai' : 'standard')).toLowerCase();
    const date = params.date;

    if (!VALID_LEVELS.includes(level)) {
      return badRequest(`level must be one of: ${VALID_LEVELS.join(', ')}`);
    }
    if (!VALID_VARIANTS.includes(variant)) {
      return badRequest(`variant must be one of: ${VALID_VARIANTS.join(', ')}`);
    }

    const values = [target, level, variant];
    let dateFilter = '';

    if (date) {
      values.push(date);
      dateFilter = 'AND so.observation_date = $4';
    }

    const sql = date
      ? `SELECT l.state_abbr, l.county_fips, l.county_name,
                so.observation_date, so.effective_conc_copies_per_l_predicted,
                so.effective_conc_copies_per_l_avg,
                so.effective_conc_lower_ci_95, so.effective_conc_upper_ci_95,
                so.biobot_risk_tier, so.ordinal_risk_tier, so.biobot_trend,
                so.perc_change, so.dataset_variant
         FROM surveillance_observations so
         JOIN targets t ON t.target_id = so.target_id
         JOIN locations l ON l.location_id = so.location_id
         WHERE t.target_code = $1
           AND l.geography_level = $2
           AND so.dataset_variant = $3
           AND so.is_forecast = FALSE
           ${dateFilter}
         ORDER BY l.state_abbr, l.county_fips`
      : `SELECT v.state_abbr, v.county_fips, v.county_name,
                v.observation_date, v.effective_conc_copies_per_l_predicted,
                v.effective_conc_copies_per_l_avg,
                v.effective_conc_lower_ci_95, v.effective_conc_upper_ci_95,
                v.biobot_risk_tier, v.ordinal_risk_tier, v.biobot_trend,
                v.perc_change, v.dataset_variant
         FROM v_latest_surveillance v
         WHERE v.target_code = $1
           AND v.geography_level = $2
           AND v.dataset_variant = $3
         ORDER BY v.state_abbr, v.county_fips`;

    const result = await query(sql, values);

    return ok({
      target,
      level,
      variant,
      date: date || result.rows[0]?.observation_date || null,
      features: result.rows,
    });
  } catch (err) {
    return serverError(err);
  }
};
