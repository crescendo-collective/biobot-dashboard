import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import us from 'us-atlas/counties-10m.json'

const topology = us as unknown as Topology

/** All US counties as GeoJSON features, keyed by FIPS via `.id`. Parsed
 * once at module load rather than on every MapContainer mount/resize. */
export const countyFeatures = feature(
  topology,
  topology.objects.counties as GeometryCollection,
)

/** Inferred from topojson-client's own return type rather than importing
 * a geo type package directly (e.g. d3-geo) — that's a transitive
 * dependency here, not a direct one, which pnpm's strict linking won't
 * reliably resolve for a type-only import. Reusing what TS already
 * inferred above sidesteps that entirely. */
export type GeoFeatureCollection = typeof countyFeatures

/** All US states as individual GeoJSON features, keyed by the 2-digit
 * state FIPS via `.id` — used for the state-level view (fillable and
 * hoverable per-state, unlike stateBordersMesh below which is just a
 * single combined line overlay). */
export const stateFeatures = feature(
  topology,
  topology.objects.states as GeometryCollection,
)

/** State boundaries as a single mesh (internal borders only), used to
 * draw a lighter overlay on top of the county fills. */
export const stateBordersMesh = mesh(
  topology,
  topology.objects.states as GeometryCollection,
  (a, b) => a !== b,
)
