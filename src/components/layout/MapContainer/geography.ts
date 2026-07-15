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

/** State boundaries as a single mesh (internal borders only), used to
 * draw a lighter overlay on top of the county fills. */
export const stateBordersMesh = mesh(
  topology,
  topology.objects.states as GeometryCollection,
  (a, b) => a !== b,
)

/** Used for the projection's fitExtent — the counties feature collection
 * covers the same area as the states one, so either works; counties is
 * what's visually filling the map, so that's what the projection fits to. */
export const geographyExtentSource = countyFeatures
