import { ref, onMounted, type Ref } from 'vue'
import type { TrailCollection, TrailFeature, TrailsState } from '@/types'

const SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/trail_network/FeatureServer/0/query'

const QUERY = '?where=1%3D1&outFields=*&outSR=4326&f=geojson'

const UNGROUPED_KEY = 'Other'

export function groupByTrailSystem(features: TrailFeature[]): Record<string, TrailFeature[]> {
  const grouped: Record<string, TrailFeature[]> = {}
  for (const feature of features) {
    const key = feature.properties.trail_system?.trim() || UNGROUPED_KEY
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(feature)
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      const nameCmp = (a.properties.name ?? '').localeCompare(b.properties.name ?? '')
      if (nameCmp !== 0) return nameCmp
      return (a.properties.segment ?? '').localeCompare(b.properties.segment ?? '')
    })
  }
  return grouped
}

export function useTrails(): { state: Ref<TrailsState> } {
  const state = ref<TrailsState>({ status: 'loading' })

  onMounted(async () => {
    try {
      const response = await fetch(`${SERVICE_URL}${QUERY}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const collection = (await response.json()) as TrailCollection
      const features = collection.features
      state.value = {
        status: 'loaded',
        collection,
        features,
        grouped: groupByTrailSystem(features),
      }
    } catch (err) {
      state.value = {
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to load trails',
      }
    }
  })

  return { state }
}
