<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
import TrailList from '@/components/TrailList.vue'
import TrailMap from '@/components/TrailMap.vue'
import TrailDetail from '@/components/TrailDetail.vue'
import { useTrails } from '@/composables/useTrails'
import type { TrailFeature } from '@/types'

const { state } = useTrails()
const hoveredIds = ref<number[]>([])
const selectedId = ref<number | null>(null)
const trailMap = ref<InstanceType<typeof TrailMap> | null>(null)

const selectedFeature = computed(() => {
  if (state.value.status !== 'loaded' || selectedId.value == null) return null
  return state.value.features.find((f) => f.properties.objectid === selectedId.value) ?? null
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
    <div class="app__body">
      <aside class="app__list">
        <div class="app__list-scroll">
          <TrailList
            v-model:hovered-ids="hoveredIds"
            :state="state"
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
          :state="state"
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
