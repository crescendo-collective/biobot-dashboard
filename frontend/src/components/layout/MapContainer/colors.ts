import type { CountyData, StateData } from '@/types/map'

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

export type RiskTier = (typeof RISK_TIER_ORDER)[number]

const TIER_FILL_VAR: Record<RiskTier, string> = {
  Minimal: 'var(--tier-minimal)',
  Low: 'var(--tier-low)',
  Moderate: 'var(--tier-moderate)',
  High: 'var(--tier-high)',
  'Very High': 'var(--tier-very-high)',
  Severe: 'var(--tier-severe)',
}

const NO_DATA_FILL = 'var(--tier-no-data)'

/** Fill color for whichever county/state polygon is currently hovered —
 * overrides the tier color entirely while the cursor is over it, same
 * blue for both the county and state view. */
export const HOVER_HIGHLIGHT_FILL = 'var(--accent-cyan)'

/** Swatch color for a single tier — same scale the map fill uses, so
 * the legend and the map can never visually drift apart. */
export function getTierColor(tier: RiskTier): string {
  return TIER_FILL_VAR[tier]
}

/** County fill color for the map choropleth. Falls back to a neutral
 * gray when a county has no matching data yet. */
export function getCountyColor(county?: CountyData): string {
  if (!county) return NO_DATA_FILL
  return getTierColor(county.biobot_risk_tier) ?? NO_DATA_FILL
}

/** Same as getCountyColor, for the state-level view. */
export function getStateColor(state?: StateData): string {
  if (!state) return NO_DATA_FILL
  return getTierColor(state.biobot_risk_tier) ?? NO_DATA_FILL
}
