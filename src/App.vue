<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
import TrailList from '@/components/TrailList.vue'
import TrailMap from '@/components/TrailMap.vue'
import TrailDetail from '@/components/TrailDetail.vue'
import FilterBar from '@/components/FilterBar.vue'
import type { Filters } from '@/components/FilterBar.vue'
import { useTrails, groupByTrailSystem } from '@/composables/useTrails'
import type { TrailFeature, TrailCollection, TrailsState } from '@/types'

const { state } = useTrails()
const hoveredIds = ref<number[]>([])
const selectedId = ref<number | null>(null)
const trailMap = ref<InstanceType<typeof TrailMap> | null>(null)

const filters = ref<Filters>({
  trail_status: new Set(),
  trail_surface: new Set(),
  facility_type: new Set(),
  major_trail: new Set(),
})

function matchesFilters(feature: TrailFeature, f: Filters): boolean {
  for (const key of Object.keys(f) as Array<keyof Filters>) {
    const selected = f[key]
    if (selected.size === 0) continue
    const raw = feature.properties[key]
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!selected.has(value)) return false
  }
  return true
}

const allFeatures = computed<TrailFeature[]>(() =>
  state.value.status === 'loaded' ? state.value.features : [],
)

const filteredState = computed<TrailsState>(() => {
  const s = state.value
  if (s.status !== 'loaded') return s
  const features = s.features.filter((f) => matchesFilters(f, filters.value))
  const grouped = groupByTrailSystem(features)
  const collection: TrailCollection = { type: 'FeatureCollection', features }
  return { status: 'loaded', features, grouped, collection }
})

const selectedFeature = computed(() => {
  if (filteredState.value.status !== 'loaded' || selectedId.value == null) return null
  return (
    filteredState.value.features.find((f) => f.properties.objectid === selectedId.value) ?? null
  )
})

const highlightIds = computed<number[]>(() =>
  selectedId.value != null ? [selectedId.value] : hoveredIds.value,
)

function handleSelect(objectid: number) {
  selectedId.value = objectid
  const feature = selectedFeature.value
  if (feature) trailMap.value?.zoomToFeatures([feature])
}

function handleSelectSystem(features: TrailFeature[]) {
  trailMap.value?.zoomToFeatures(features)
}

function handleClose() {
  selectedId.value = null
}
</script>

<template>
  <div class="app">
    <AppHeader id="main-nav" />
    <FilterBar v-model:filters="filters" :features="allFeatures" />
    <div class="app__body">
      <aside class="app__list">
        <div class="app__list-scroll">
          <TrailList
            v-model:hovered-ids="hoveredIds"
            :state="filteredState"
            @select="handleSelect"
            @select-system="handleSelectSystem"
          />
        </div>
        <div v-if="selectedFeature" class="app__detail-overlay">
          <TrailDetail :feature="selectedFeature" @close="handleClose" />
        </div>
      </aside>
      <section class="app__map">
        <TrailMap
          ref="trailMap"
          :state="filteredState"
          :highlight-ids="highlightIds"
          @select="handleSelect"
        />
      </section>
    </div>
    <AppFooter :sub-footer-only="true" />
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
}
body {
  font-family: system-ui, -apple-system, sans-serif;
}
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}
.app__body {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
.app__list {
  flex: 0 0 33%;
  position: relative;
  overflow: hidden;
  border-right: 1px solid #e0e0e0;
}
.app__list-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
}
.app__detail-overlay {
  position: absolute;
  inset: 0;
  background: #fff;
  overflow-y: auto;
  z-index: 1;
}
.app__map {
  flex: 1 1 67%;
  position: relative;
  overflow: hidden;
}
</style>
