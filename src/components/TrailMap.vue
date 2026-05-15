<script setup lang="ts">
import { computed } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  MapNavigationControl,
  BasemapToggle,
} from '@phila/phila-ui-map-core'
import type { FilterSpecification } from 'maplibre-gl'
import type { TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredId: number | null
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
  '==',
  ['get', 'objectid'],
  props.hoveredId ?? -1,
])
</script>

<template>
  <PhilaMap class="trail-map">
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
  </PhilaMap>
</template>

<style scoped>
.trail-map {
  width: 100%;
  height: 100%;
}
</style>
