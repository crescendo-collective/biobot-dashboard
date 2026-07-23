import interpolatedCountyData from '../../../testData/data.prcCountyInterpolated.json'
import type { BiobotRiskTier, BiobotTrend, CountyData, CountySnapshot } from '@/types/map'
import type { TimelineDateRange } from '@/types/timeline'

interface InterpolatedCountyResponse {
  data: CountyData[]
  pivot: {
    values: {
      biobot_risk_tier: Array<BiobotRiskTier | null>
      biobot_trend: Array<BiobotTrend | 'Unknown' | null>
    }
  }
}

const response = interpolatedCountyData as InterpolatedCountyResponse

export const countyInterpolatedData = response.data

function formatDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

/** Resolves all indexed fields using the position of `date` in the source
 * record that falls inside the selected timeline week. The API's pivot
 * dictionaries translate tier/trend indices to labels. */
export function getCountySnapshotLookup(range: TimelineDateRange): Map<string, CountySnapshot> {
  const start = formatDate(range.start)
  const end = formatDate(range.end)
  const riskTiers = response.pivot.values.biobot_risk_tier
  const trends = response.pivot.values.biobot_trend

  return new Map(
    countyInterpolatedData.flatMap((county) => {
      const index = county.date.findIndex((date) => date >= start && date <= end)
      if (index === -1) return []

      const riskTier = riskTiers[county.biobot_risk_tier[index] ?? 0]
      const trend = trends[county.biobot_trend[index] ?? 0]

      if (!riskTier || !trend || trend === 'Unknown') return []

      return [[county.county_fips, {
        county_fips: county.county_fips,
        county_name: county.county_name,
        state_abbr: county.state_abbr,
        date: county.date[index],
        biobot_risk_tier: riskTier,
        biobot_trend: trend,
        perc_change: county.perc_change[index] ?? null,
      }]]
    }),
  )
}
