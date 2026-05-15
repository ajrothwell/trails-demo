import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson'

export interface TrailProperties {
  objectid: number
  name: string | null
  trail_status: string | null
  trail_status_planning: string | null
  segment: string | null
  trail_system: string | null
  major_trail: string | null
  multi_purpose: string | null
  maintenance_organization: string | null
  project_sponsor: string | null
  existing: string | null
  trail_surface: string | null
  bridge: string | null
  streets_row: string | null
  facility_type: string | null
  maintenance_label: string | null
  globalid: string | null
  created_user: string | null
  last_edited_user: string | null
  length_miles: number | null
  created_date: number | null
  last_edited_date: number | null
  Shape__Length: number | null
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
