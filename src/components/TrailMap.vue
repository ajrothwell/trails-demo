<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  MapNavigationControl,
  BasemapToggle,
} from '@phila/phila-ui-map-core'
import type { CyclomediaConfig } from '@phila/phila-ui-map-core'
import type {
  FilterSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import type { TrailFeature, TrailsState } from '@/types'

const cyclomediaConfig: CyclomediaConfig = {
  username: import.meta.env.VITE_CYCLOMEDIA_USERNAME || '',
  password: import.meta.env.VITE_CYCLOMEDIA_PASSWORD || '',
  apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY || '',
  srs: 'EPSG:4326',
  locale: 'en-US',
}

const props = defineProps<{
  state: TrailsState
  highlightIds: number[]
}>()

const emit = defineEmits<{
  select: [objectid: number]
  hover: [objectid: number | null]
}>()

const EMPTY_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
}

const source = computed(() => ({
  type: 'geojson' as const,
  data: props.state.status === 'loaded' ? props.state.collection : EMPTY_COLLECTION,
}))

const highlightFilter = computed<FilterSpecification>(() => [
  'in',
  ['get', 'objectid'],
  ['literal', props.highlightIds],
])

const mapInstance = ref<MapLibreMap | null>(null)

function combinedBounds(
  features: TrailFeature[],
): [[number, number], [number, number]] | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const feature of features) {
    const lines =
      feature.geometry.type === 'LineString'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
    for (const line of lines) {
      for (const [x, y] of line) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  if (!Number.isFinite(minX)) return null
  return [
    [minX, minY],
    [maxX, maxY],
  ]
}

function zoomToFeatures(features: TrailFeature[]): void {
  const map = mapInstance.value
  if (!map) return
  const bounds = combinedBounds(features)
  if (!bounds) return
  map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 600 })
}

function handleLineClick(event: MapLayerMouseEvent): void {
  const feature = event.features?.[0]
  const objectid = feature?.properties?.objectid
  if (typeof objectid === 'number') emit('select', objectid)
}

let lastHoverId: number | null = null

function handleLineMousemove(event: MapLayerMouseEvent): void {
  const feature = event.features?.[0]
  const objectid = feature?.properties?.objectid
  const next = typeof objectid === 'number' ? objectid : null
  if (next === lastHoverId) return
  lastHoverId = next
  emit('hover', next)
}

function handleLineMouseleave(): void {
  if (lastHoverId === null) return
  lastHoverId = null
  emit('hover', null)
}

defineExpose({ zoomToFeatures })
</script>

<template>
  <PhilaMap
    class="trail-map"
    :center="[-75.12, 39.98]"
    :zoom="10"
    :enable-cyclomedia="true"
    :cyclomedia-config="cyclomediaConfig"
    cyclomedia-button-position="top-right"
    @load="mapInstance = $event"
  >
    <MapNavigationControl position="bottom-right" />
    <BasemapToggle position="top-right" />
    <LineLayer
      id="trails-base"
      :source="source"
      :paint="{ 'line-color': '#2176d2', 'line-width': 2 }"
    />
    <LineLayer
      id="trails-highlight"
      :source="source"
      :filter="highlightFilter"
      :paint="{ 'line-color': '#ffb02e', 'line-width': 5 }"
    />
    <LineLayer
      id="trails-click-target"
      :source="source"
      :paint="{ 'line-color': '#000000', 'line-opacity': 0.001, 'line-width': 14 }"
      @click="handleLineClick"
      @mousemove="handleLineMousemove"
      @mouseleave="handleLineMouseleave"
    />
  </PhilaMap>
</template>

<style scoped>
.trail-map {
  width: 100%;
  height: 100%;
}
</style>
