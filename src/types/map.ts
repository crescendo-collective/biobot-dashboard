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

export interface CountyResponse {
  data: CountyData[]
  next_page_token?: string
}
