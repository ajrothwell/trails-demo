<script setup lang="ts">
import type { TrailFeature } from '@/types'

defineProps<{
  feature: TrailFeature
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="trail-detail">
    <header class="trail-detail__header">
      <h2 class="trail-detail__name">{{ feature.properties.name ?? '(unnamed)' }}</h2>
      <button
        type="button"
        class="trail-detail__close"
        aria-label="Back to trail list"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <p v-if="feature.properties.segment" class="trail-detail__segment">
      {{ feature.properties.segment }}
    </p>

    <dl class="trail-detail__fields">
      <template v-if="feature.properties.trail_system">
        <dt>Trail system</dt>
        <dd>{{ feature.properties.trail_system }}</dd>
      </template>

      <template v-if="feature.properties.facility_type">
        <dt>Facility type</dt>
        <dd>{{ feature.properties.facility_type }}</dd>
      </template>

      <template v-if="feature.properties.trail_status">
        <dt>Status</dt>
        <dd>{{ feature.properties.trail_status }}</dd>
      </template>

      <template v-if="feature.properties.length_miles != null">
        <dt>Length</dt>
        <dd>{{ feature.properties.length_miles.toFixed(2) }} mi</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.trail-detail {
  padding: 1rem;
}
.trail-detail__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.trail-detail__name {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.25;
  color: #222;
}
.trail-detail__close {
  flex: 0 0 auto;
  font-size: 1.5rem;
  line-height: 1;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: transparent;
  border: 1px solid transparent;
  color: #555;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.trail-detail__close:hover {
  background: #f1f1f1;
  border-color: #ddd;
  color: #000;
}
.trail-detail__segment {
  margin: 0 0 1rem 0;
  color: #555;
  font-size: 0.95rem;
}
.trail-detail__fields {
  display: grid;
  grid-template-columns: max-content 1fr;
  column-gap: 0.75rem;
  row-gap: 0.4rem;
  margin: 0;
  font-size: 0.95rem;
}
.trail-detail__fields dt {
  color: #777;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  align-self: center;
}
.trail-detail__fields dd {
  margin: 0;
  color: #222;
}
</style>
