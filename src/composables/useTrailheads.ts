import { ref, onMounted, type Ref } from 'vue'
import { fetchAllFeatures } from '@/fetchAllFeatures'
import type { TrailheadFeature } from '@/types'

const SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/trailheads_access_points/FeatureServer/0/query'

/** Returns the trailhead points; stays empty if the service can't be reached, so the trails still show. */
export function useTrailheads(): { trailheads: Ref<TrailheadFeature[]> } {
  const trailheads = ref<TrailheadFeature[]>([])

  onMounted(async () => {
    try {
      trailheads.value = await fetchAllFeatures<TrailheadFeature>(SERVICE_URL)
    } catch (err) {
      console.error('Failed to load trailheads', err)
    }
  })

  return { trailheads }
}
