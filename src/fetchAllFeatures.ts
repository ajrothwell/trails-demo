import type { Feature } from 'geojson'
import type { FeaturePage } from '@/types'

const QUERY = '?where=1%3D1&outFields=*&outSR=4326&f=geojson'

// A FeatureServer caps a single response at maxRecordCount (2000); layers can have more rows than that.
const PAGE_SIZE = 2000

/** Returns every feature of a FeatureServer layer, paging past the per-request record cap. */
export async function fetchAllFeatures<F extends Feature>(queryUrl: string): Promise<F[]> {
  const features: F[] = []
  let offset = 0
  for (;;) {
    const response = await fetch(
      `${queryUrl}${QUERY}&resultOffset=${offset}&resultRecordCount=${PAGE_SIZE}`,
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const page = (await response.json()) as FeaturePage<F>
    features.push(...page.features)
    if (!page.properties?.exceededTransferLimit || page.features.length === 0) return features
    offset += page.features.length
  }
}
