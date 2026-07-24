import type { CountySnapshot } from '@/types/map'
import { feature } from 'topojson-client'
import us from 'us-atlas/counties-10m.json'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { stateAbbrFromCountyFips } from '@/data/usStateFips'

const topology = us as unknown as Topology

const counties = feature(topology, topology.objects.counties as GeometryCollection).features

// BUG FIX: was missing 'Very High' and 'Severe' — with only 4 tiers here,
// those two could never appear anywhere in the generated dataset even
// though colors.ts, index.scss, and MapTooltip all support all 6.
const riskTiers = [
  { tier: 'Minimal', ordinal: 1 },
  { tier: 'Low', ordinal: 2 },
  { tier: 'Moderate', ordinal: 3 },
  { tier: 'High', ordinal: 4 },
  { tier: 'Very High', ordinal: 5 },
  { tier: 'Severe', ordinal: 6 },
] as const

export const countyRiskLookup = new Map<string, CountySnapshot>(
  counties.map((county, index) => {
    const risk = riskTiers[index % riskTiers.length]
    const countyFips = county.id as string

    return [
      countyFips,
      {
        county_fips: countyFips,
        county_name: (county.properties as { name: string }).name,
        // BUG FIX: was reading the state feature's `.properties.name`,
        // which us-atlas only provides as a full name (e.g.
        // "Massachusetts") — there's no abbreviation anywhere in that
        // topology. Resolved via the static FIPS table instead.
        state_abbr: stateAbbrFromCountyFips(countyFips),
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
