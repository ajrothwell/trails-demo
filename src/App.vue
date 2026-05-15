<script setup lang="ts">
import { ref } from 'vue'
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
import TrailList from '@/components/TrailList.vue'
import TrailMap from '@/components/TrailMap.vue'
import { useTrails } from '@/composables/useTrails'

const { state } = useTrails()
const hoveredId = ref<number | null>(null)
const trailMap = ref<InstanceType<typeof TrailMap> | null>(null)

function handleSelect(objectid: number) {
  if (state.value.status !== 'loaded') return
  const feature = state.value.features.find((f) => f.properties.objectid === objectid)
  if (feature) trailMap.value?.zoomToFeature(feature)
}
</script>

<template>
  <div class="app">
    <AppHeader id="main-nav" />
    <div class="app__body">
      <aside class="app__list">
        <TrailList v-model:hovered-id="hoveredId" :state="state" @select="handleSelect" />
      </aside>
      <section class="app__map">
        <TrailMap ref="trailMap" :state="state" :hovered-id="hoveredId" />
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
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
}
.app__map {
  flex: 1 1 67%;
  position: relative;
  overflow: hidden;
}
</style>
