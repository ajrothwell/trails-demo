<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  CircleLayer,
  MapPopup,
  MapNavigationControl,
  BasemapToggle,
  MapFloatingPanel,
} from '@phila/phila-ui-map-core'
import type { CyclomediaConfig } from '@phila/phila-ui-map-core'
import type {
  DataDrivenPropertyValueSpecification,
  FilterSpecification,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'
import type { TrailFeature, TrailheadFeature, TrailheadProperties, TrailsState } from '@/types'
import { useTrailheads } from '@/composables/useTrailheads'

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

const STATUS_COLORS = {
  'Existing': '#1b6d2f',
  'In Progress': '#2176d2',
  'Conceptual': '#ffb02e',
  'Feasibility/Pipeline': '#8e44ad',
} as const

const statusColorExpression: DataDrivenPropertyValueSpecification<string> = [
  'match',
  ['get', 'trail_status'],
  'Existing', STATUS_COLORS['Existing'],
  'In Progress', STATUS_COLORS['In Progress'],
  'Conceptual', STATUS_COLORS['Conceptual'],
  'Feasibility/Pipeline', STATUS_COLORS['Feasibility/Pipeline'],
  '#666666',
]

const legendItems = Object.entries(STATUS_COLORS) as Array<[keyof typeof STATUS_COLORS, string]>

// Trailhead data carries no trail or status, so every point uses the built-trail color.
const TRAILHEAD_COLOR = STATUS_COLORS['Existing']

const TRAILHEAD_LAYER_ID = 'trailheads'

// Popup rows in display order; f_id and objectid are internal ids and stay hidden.
const TRAILHEAD_FIELDS: Array<[keyof TrailheadProperties, string]> = [
  ['map_search', 'Map search name'],
  ['parking', 'Parking'],
  ['bicycle', 'Bicycle'],
  ['accessibility', 'Accessibility'],
  ['horseaccess', 'Horse access'],
]

const { trailheads } = useTrailheads()

const trailheadSource = computed(() => ({
  type: 'geojson' as const,
  data: { type: 'FeatureCollection' as const, features: trailheads.value },
}))

const openTrailhead = ref<TrailheadFeature | null>(null)

// A list of zero or one, so each popup's close handler keeps the trailhead it was opened for.
const openTrailheads = computed(() => (openTrailhead.value ? [openTrailhead.value] : []))

/** Returns the popup rows for a trailhead, skipping blank values. */
function trailheadRows(trailhead: TrailheadFeature): Array<{ label: string; value: string }> {
  return TRAILHEAD_FIELDS.flatMap(([field, label]) => {
    const value = trailhead.properties[field]
    const text = typeof value === 'string' ? value.trim() : ''
    return text ? [{ label, value: text }] : []
  })
}

function handleTrailheadClick(event: MapLayerMouseEvent): void {
  const objectid = event.features?.[0]?.properties?.objectid
  openTrailhead.value =
    trailheads.value.find((trailhead) => trailhead.properties.objectid === objectid) ?? null
}

// Clicking a second trailhead also closes the first one's popup; only clear if the closing popup is the current one.
function handleTrailheadClose(objectid: number): void {
  if (openTrailhead.value?.properties.objectid === objectid) openTrailhead.value = null
}

function isTrailheadAt(event: MapLayerMouseEvent): boolean {
  return event.target.queryRenderedFeatures(event.point, { layers: [TRAILHEAD_LAYER_ID] }).length > 0
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
  if (isTrailheadAt(event)) return
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
    <CircleLayer
      :id="TRAILHEAD_LAYER_ID"
      :source="trailheadSource"
      :paint="{
        'circle-color': TRAILHEAD_COLOR,
        'circle-radius': 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      }"
      @click="handleTrailheadClick"
    />
    <MapPopup
      v-for="trailhead in openTrailheads"
      :key="trailhead.properties.objectid"
      :lng-lat="trailhead.geometry.coordinates as [number, number]"
      @close="handleTrailheadClose(trailhead.properties.objectid)"
    >
      <div class="trailhead-popup">
        <h4 class="trailhead-popup__title">{{ trailhead.properties.trailheadname }}</h4>
        <dl class="trailhead-popup__rows">
          <template v-for="row in trailheadRows(trailhead)" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>
      </div>
    </MapPopup>
    <MapFloatingPanel
      position="bottom-left"
      :leave-room-for-controls="false"
      aria-label="Trail status legend"
    >
      <h4 class="trail-legend__title">Status</h4>
      <ul class="trail-legend__rows">
        <li v-for="[status, color] in legendItems" :key="status" class="trail-legend__row">
          <span class="trail-legend__swatch" :style="{ backgroundColor: color }" />
          <span class="trail-legend__label">{{ status }}</span>
        </li>
        <li class="trail-legend__row">
          <span
            class="trail-legend__swatch trail-legend__swatch--point"
            :style="{ backgroundColor: TRAILHEAD_COLOR }"
          />
          <span class="trail-legend__label">Trailhead</span>
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
.trail-legend__swatch--point {
  width: 10px;
  height: 10px;
  margin: 0 4px;
  border-radius: 50%;
}
.trail-legend__label {
  flex: 1;
}
.trailhead-popup__title {
  margin: 0 0 0.5rem 0;
  padding-right: 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}
.trailhead-popup__rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0;
  font-size: 0.8rem;
  color: #1a1a1a;
}
.trailhead-popup__rows dt {
  font-weight: 600;
}
.trailhead-popup__rows dd {
  margin: 0;
}
</style>
