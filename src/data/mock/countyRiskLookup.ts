import type { CountyData } from '../../types/map'

// Temporary stand-in for the real /beta/data/rsv/county endpoint (see
// the Biobot Analytics Postman collection) — three counties, enough to
// exercise the map's hover/tooltip/color-fill logic before the real
// fetch is wired up. Counties not in this map render with the "no data"
// fallback fill (see colors.ts). Swap this file for a real fetch() call
// once the endpoint is connected; MapContainer only depends on getting
// back a `Map<string, CountyData>` keyed by FIPS, so nothing downstream
// needs to change.
export const countyRiskLookup = new Map<string, CountyData>([
  [
    '06037',
    {
      county_fips: '06037',
      county_name: 'Los Angeles County',
      state_abbr: 'CA',
      date: '2024-06-12',
      biobot_risk_tier: 'High',
      ordinal_risk_tier: 4,
      biobot_trend: 'Increasing',
      perc_change: 27.4,
      effective_conc_copies_per_l_predicted: 1234,
      is_forecast: false,
    },
  ],
  [
    '01001',
    {
      county_fips: '01001',
      county_name: 'Autauga County',
      state_abbr: 'AL',
      date: '2024-06-12',
      biobot_risk_tier: 'Low',
      ordinal_risk_tier: 2,
      biobot_trend: 'Stable',
      perc_change: -3.2,
      effective_conc_copies_per_l_predicted: 820,
      is_forecast: false,
    },
  ],
  [
    '17031',
    {
      county_fips: '17031',
      county_name: 'Cook County',
      state_abbr: 'IL',
      date: '2024-06-12',
      biobot_risk_tier: 'Moderate',
      ordinal_risk_tier: 3,
      biobot_trend: 'Increasing',
      perc_change: 12.6,
      effective_conc_copies_per_l_predicted: 954,
      is_forecast: false,
    },
  ],
])
