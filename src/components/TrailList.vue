<script setup lang="ts">
import { computed } from 'vue'
import type { TrailFeature, TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredId: number | null
}>()

const emit = defineEmits<{
  'update:hoveredId': [value: number | null]
}>()

function displayLabel(feature: TrailFeature): string {
  const name = feature.properties.name?.trim() || '(unnamed)'
  const segment = feature.properties.segment?.trim()
  return segment ? `${name} — ${segment}` : name
}

const groups = computed(() => {
  if (props.state.status !== 'loaded') return []
  return Object.entries(props.state.grouped).sort(([a], [b]) => a.localeCompare(b))
})
</script>

<template>
  <div class="trail-list">
    <p v-if="state.status === 'loading'" class="trail-list__status">Loading trails…</p>
    <p v-else-if="state.status === 'error'" class="trail-list__status trail-list__status--error">
      {{ state.message }}
    </p>
    <template v-else>
      <section v-for="[system, features] in groups" :key="system" class="trail-list__section">
        <h2 class="trail-list__heading">{{ system }}</h2>
        <ul class="trail-list__items">
          <li
            v-for="feature in features"
            :key="feature.properties.objectid"
            class="trail-list__item"
            :class="{ 'trail-list__item--hovered': hoveredId === feature.properties.objectid }"
            @mouseenter="emit('update:hoveredId', feature.properties.objectid)"
            @mouseleave="emit('update:hoveredId', null)"
          >
            {{ displayLabel(feature) }}
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.trail-list {
  padding: 0.5rem 0;
}
.trail-list__status {
  padding: 1rem;
  color: #666;
}
.trail-list__status--error {
  color: #b00020;
}
.trail-list__section {
  padding: 0.5rem 0;
}
.trail-list__heading {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #555;
  padding: 0.25rem 1rem;
  margin: 0;
}
.trail-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.trail-list__item {
  padding: 0.35rem 1rem;
  cursor: default;
  font-size: 0.95rem;
}
.trail-list__item--hovered {
  background: #fff4d6;
}
</style>
