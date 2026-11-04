import { geoContains } from "d3-geo"
import { feature } from "topojson-client"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import { byFips } from "../data/states.ts"

export async function stateFromLonLat(lon: number, lat: number) {
  const mod = (await import("../data/geo/states-10m.json")) as unknown as {
    default: { objects: { states: Parameters<typeof feature>[1] } }
  }
  const collection = feature(mod.default as never, mod.default.objects.states) as unknown as FeatureCollection
  const hit = collection.features.find((item) => geoContains(item as Feature<Geometry>, [lon, lat]))
  if (!hit?.id) return null
  return byFips(String(hit.id))
}
