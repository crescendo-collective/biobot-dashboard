import type { StateData } from '@/types/map'
import { stateFeatures } from '@/components/layout/MapContainer/geography'
import { stateAbbrFromStateFips } from '@/data/usStateFips'

// Same generation approach as countyRiskLookup.ts — random but plausible
// tier/trend/% change per state, cycling through all 6 tiers so every
// color in the legend actually shows up somewhere.
const riskTiers = [
  { tier: 'Minimal', ordinal: 1 },
  { tier: 'Low', ordinal: 2 },
  { tier: 'Moderate', ordinal: 3 },
  { tier: 'High', ordinal: 4 },
  { tier: 'Very High', ordinal: 5 },
  { tier: 'Severe', ordinal: 6 },
] as const

export const stateRiskLookup = new Map<string, StateData>(
  stateFeatures.features.map((state, index) => {
    const risk = riskTiers[index % riskTiers.length]
    const stateFips = state.id as string

    return [
      stateFips,
      {
        state_fips: stateFips,
        state_abbr: stateAbbrFromStateFips(stateFips),
        state_name: (state.properties as { name: string }).name,
        date: '2024-06-12',
        biobot_risk_tier: risk.tier,
        ordinal_risk_tier: risk.ordinal,
        biobot_trend: index % 3 === 0 ? 'Increasing' : index % 3 === 1 ? 'Stable' : 'Decreasing',
        perc_change: index % 5 === 0 ? null : Math.round((Math.random() * 120 - 40) * 10) / 10,
        effective_conc_copies_per_l_predicted: 300 + Math.floor(Math.random() * 2200),
        is_forecast: false,
      },
    ]
  }),
)
