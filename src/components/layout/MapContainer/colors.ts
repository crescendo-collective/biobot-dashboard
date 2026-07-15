import type { CountyData } from '../../../types/map'

// Ordered Minimal → Severe. Exported so a future legend component can
// render swatches in the same order without redefining the list.
export const RISK_TIER_ORDER = [
  'Minimal',
  'Low',
  'Moderate',
  'High',
  'Very High',
  'Severe',
] as const

const TIER_FILL_VAR: Record<(typeof RISK_TIER_ORDER)[number], string> = {
  Minimal: 'var(--tier-minimal)',
  Low: 'var(--tier-low)',
  Moderate: 'var(--tier-moderate)',
  High: 'var(--tier-high)',
  'Very High': 'var(--tier-very-high)',
  Severe: 'var(--tier-severe)',
}

const NO_DATA_FILL = 'var(--tier-no-data)'

/** County fill color for the map choropleth. Falls back to a neutral
 * gray when a county has no matching data yet. */
export function getCountyColor(county?: CountyData): string {
  if (!county) return NO_DATA_FILL
  return TIER_FILL_VAR[county.biobot_risk_tier] ?? NO_DATA_FILL
}
