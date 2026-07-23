export type BiobotRiskTier =
  | 'Minimal'
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Very High'
  | 'Severe'

export type BiobotTrend = 'Increasing' | 'Stable' | 'Decreasing'

/** A county's time-series as returned by the interpolated map endpoint.
 * Values at a given index describe the date at that same index. */
export interface CountyData {
  county_fips: string
  county_name: string
  state_abbr: string
  target_name: string
  date: string[]
  biobot_risk_tier: Array<number | null>
  ordinal_risk_tier: Array<number | null>
  biobot_trend: Array<number | null>
  perc_change: Array<number | null>
}

/** A county record resolved to one date for rendering and tooltips. */
export interface CountySnapshot {
  county_fips: string
  county_name: string
  state_abbr: string
  date: string
  biobot_risk_tier: BiobotRiskTier
  biobot_trend: BiobotTrend
  perc_change: number | null
}

/** State-level map record. */
export interface StateData {
  state_fips: string
  state_abbr: string
  state_name: string
  date: string
  biobot_risk_tier: BiobotRiskTier
  ordinal_risk_tier: number
  biobot_trend: BiobotTrend
  perc_change: number | null
  effective_conc_copies_per_l_predicted: number
  is_forecast: boolean
}
