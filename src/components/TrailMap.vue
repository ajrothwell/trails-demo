<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  MapNavigationControl,
  BasemapToggle,
  MapFloatingPanel,
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

const STATUS_COLORS: Array<{ status: string; color: string }> = [
  { status: 'Existing', color: '#1b6d2f' },
  { status: 'In Progress', color: '#2176d2' },
  { status: 'Conceptual', color: '#ffb02e' },
  { status: 'Feasibility/Pipeline', color: '#8e44ad' },
]

const statusColorExpression = [
  'match',
  ['get', 'trail_status'],
  ...STATUS_COLORS.flatMap(({ status, color }) => [status, color]),
  '#666666',
] as const

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
      :paint="{ 'line-color': statusColorExpression, 'line-width': 2 }"
    />
    <LineLayer
      id="trails-highlight"
      :source="source"
      :filter="highlightFilter"
      :paint="{ 'line-color': '#00FFFF', 'line-width': 5 }"
    />
    <LineLayer
      id="trails-click-target"
      :source="source"
      :paint="{ 'line-color': '#000000', 'line-opacity': 0.001, 'line-width': 14 }"
      @click="handleLineClick"
      @mousemove="handleLineMousemove"
      @mouseleave="handleLineMouseleave"
    />
    <MapFloatingPanel
      position="bottom-left"
      :leave-room-for-controls="false"
      aria-label="Trail status legend"
    >
      <h4 class="trail-legend__title">Status</h4>
      <ul class="trail-legend__rows">
        <li v-for="item in STATUS_COLORS" :key="item.status" class="trail-legend__row">
          <span class="trail-legend__swatch" :style="{ backgroundColor: item.color }" />
          <span class="trail-legend__label">{{ item.status }}</span>
        </li>
      </ul>
    </MapFloatingPanel>
  </PhilaMap>
</template>

<style scoped>
.trail-map {
  width: 100%;
  height: 100%;
}
.trail-legend__title {
  margin: 0 0 0.5rem 0;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #d0d4d9;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a1a;
}
.trail-legend__rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 9rem;
  font-size: 0.8rem;
  color: #1a1a1a;
}
.trail-legend__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.trail-legend__swatch {
  width: 18px;
  height: 4px;
  border-radius: 2px;
  flex-shrink: 0;
}
.trail-legend__label {
  flex: 1;
}
</style>
