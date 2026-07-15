import type { CountyData } from '@/types/map'
import { feature } from "topojson-client";
import us from "us-atlas/counties-10m.json";
import type {GeometryCollection, Topology} from "topojson-specification";

const topology = us as unknown as Topology

const counties = feature(
  topology,
  topology.objects.counties as GeometryCollection
).features;

const states = feature(
  topology,
  topology.objects.states as GeometryCollection
).features;

const riskTiers = [
  { tier: "Minimal", ordinal: 1 },
  { tier: "Low", ordinal: 2 },
  { tier: "Moderate", ordinal: 3 },
  { tier: "High", ordinal: 4 },
] as const;

export const countyRiskLookup = new Map<string, CountyData>(

    counties.map((county, index) => {
      const risk = riskTiers[index % riskTiers.length];

      const countyFips = county.id as string;
      const stateFips = countyFips.slice(0, 2);
      const state = states.find(s => s.id === stateFips);

      console.log('state', state);
      return [
        county.id as string,
        {
          county_fips: county.id as string,
          county_name: (county.properties as {name: string }).name,
          state_abbr: (state?.properties as {name: string }).name,
          date: "2024-06-12",
          biobot_risk_tier: risk.tier,
          ordinal_risk_tier: risk.ordinal,
          biobot_trend:
              index % 3 === 0
                  ? "Increasing"
                  : index % 3 === 1
                      ? "Stable"
                      : "Decreasing",
          perc_change:
              index % 5 === 0
                  ? null
                  : Math.round((Math.random() * 120 - 40) * 10) / 10,
          effective_conc_copies_per_l_predicted:
              300 + Math.floor(Math.random() * 2200),
          is_forecast: false,
        },
      ];
    })
);
