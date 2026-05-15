import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson'

export interface TrailProperties {
  objectid: number
  name: string | null
  trail_system: string | null
  segment: string | null
  trail_status: string | null
  facility_type: string | null
  length_miles: number | null
}

export type TrailGeometry = LineString | MultiLineString

export type TrailFeature = Feature<TrailGeometry, TrailProperties>

export type TrailCollection = FeatureCollection<TrailGeometry, TrailProperties>

export type TrailsState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      collection: TrailCollection
      features: TrailFeature[]
      grouped: Record<string, TrailFeature[]>
    }
  | { status: 'error'; message: string }
