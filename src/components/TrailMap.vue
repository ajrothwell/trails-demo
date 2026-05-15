<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  MapNavigationControl,
  BasemapToggle,
} from '@phila/phila-ui-map-core'
import type {
  FilterSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import type { TrailFeature, TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredId: number | null
  selectedId: number | null
}>()

const emit = defineEmits<{
  select: [objectid: number]
}>()

const EMPTY_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
}

const source = computed(() => ({
  type: 'geojson' as const,
  data: props.state.status === 'loaded' ? props.state.collection : EMPTY_COLLECTION,
}))

const hoverFilter = computed<FilterSpecification>(() => [
  '==',
  ['get', 'objectid'],
  props.hoveredId ?? -1,
])

const selectedFilter = computed<FilterSpecification>(() => [
  '==',
  ['get', 'objectid'],
  props.selectedId ?? -1,
])

const mapInstance = ref<MapLibreMap | null>(null)

function featureBounds(
  feature: TrailFeature,
): [[number, number], [number, number]] | null {
  const lines =
    feature.geometry.type === 'LineString'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const line of lines) {
    for (const [x, y] of line) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (!Number.isFinite(minX)) return null
  return [
    [minX, minY],
    [maxX, maxY],
  ]
}

function zoomToFeature(feature: TrailFeature): void {
  const map = mapInstance.value
  if (!map) return
  const bounds = featureBounds(feature)
  if (!bounds) return
  map.fitBounds(bounds, { padding: 60, maxZoom: 17, duration: 600 })
}

function handleLineClick(event: MapLayerMouseEvent): void {
  const feature = event.features?.[0]
  const objectid = feature?.properties?.objectid
  if (typeof objectid === 'number') emit('select', objectid)
}

defineExpose({ zoomToFeature })
</script>

<template>
  <PhilaMap
    class="trail-map"
    :center="[-75.12, 39.98]"
    :zoom="10"
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
      id="trails-selected"
      :source="source"
      :filter="selectedFilter"
      :paint="{ 'line-color': '#d22d2d', 'line-width': 5 }"
    />
    <LineLayer
      id="trails-highlight"
      :source="source"
      :filter="hoverFilter"
      :paint="{ 'line-color': '#ffb02e', 'line-width': 5 }"
    />
    <LineLayer
      id="trails-click-target"
      :source="source"
      :paint="{ 'line-color': '#000000', 'line-opacity': 0.001, 'line-width': 14 }"
      @click="handleLineClick"
    />
  </PhilaMap>
</template>

<style scoped>
.trail-map {
  width: 100%;
  height: 100%;
}
</style>
