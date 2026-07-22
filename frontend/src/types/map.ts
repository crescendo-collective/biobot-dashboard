export type BiobotRiskTier =
  | 'Minimal'
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Very High'
  | 'Severe'

export type BiobotTrend = 'Increasing' | 'Stable' | 'Decreasing'

export interface CountyData {
  county_fips: string
  county_name: string
  state_abbr: string
  date: string
  biobot_risk_tier: BiobotRiskTier
  ordinal_risk_tier: number
  biobot_trend: BiobotTrend
  perc_change: number | null
  effective_conc_copies_per_l_predicted: number
  is_forecast: boolean
}

/** Same shape as CountyData, one level up — used for the state view of
 * the map. Kept as a separate type rather than reusing CountyData with
 * optional county fields, since "this record describes a whole state"
 * vs "this record describes a county" are different things, not one
 * thing with a gap in it. */
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
