const { query } = require('../shared/db');
const { ok, badRequest, serverError } = require('../shared/response');

const VALID_LEVELS = ['national', 'regional', 'state', 'county', 'zip'];

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const target = (params.target || 'RSV').toUpperCase();
    const level = (params.level || 'national').toLowerCase();
    const weeks = Math.min(parseInt(params.weeks || '52', 10), 104);
    const state = params.state ? params.state.toUpperCase() : null;
    const countyFips = params.county_fips || null;

    if (!VALID_LEVELS.includes(level)) {
      return badRequest(`level must be one of: ${VALID_LEVELS.join(', ')}`);
    }

    const values = [target, level];
    let locationFilter = '';

    if (level === 'state' && state) {
      values.push(state);
      locationFilter = 'AND l.state_abbr = $3';
    } else if (level === 'county' && countyFips) {
      values.push(countyFips);
      locationFilter = 'AND l.county_fips = $3';
    } else if (level === 'county' && state) {
      values.push(state);
      locationFilter = 'AND l.state_abbr = $3';
    }

    values.push(weeks);
    const weeksParam = `$${values.length}`;

    const sql = `
      SELECT so.observation_date, so.mmwr_year, so.mmwr_week, so.mmwr_week_end,
             so.effective_conc_copies_per_l_avg,
             so.effective_concentration_rolling_avg,
             so.effective_conc_copies_per_l_predicted,
             so.biobot_risk_tier, so.ordinal_risk_tier,
             so.biobot_trend, so.perc_change,
             l.state_abbr, l.county_fips, l.county_name, l.region_code
      FROM surveillance_observations so
      JOIN targets t ON t.target_id = so.target_id
      JOIN locations l ON l.location_id = so.location_id
      WHERE t.target_code = $1
        AND l.geography_level = $2
        AND so.is_forecast = FALSE
        ${locationFilter}
      ORDER BY so.observation_date DESC
      LIMIT ${weeksParam}`;

    const result = await query(sql, values);

    return ok({
      target,
      level,
      weeks,
      state,
      countyFips,
      history: result.rows.reverse(),
    });
  } catch (err) {
    return serverError(err);
  }
};
