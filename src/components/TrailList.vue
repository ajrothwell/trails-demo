<script setup lang="ts">
import { computed } from 'vue'
import type { TrailFeature, TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredId: number | null
}>()

const emit = defineEmits<{
  'update:hoveredId': [value: number | null]
  select: [objectid: number]
  selectSystem: [features: TrailFeature[]]
}>()

function baseLabel(feature: TrailFeature): string {
  const name = feature.properties.name?.trim() || '(unnamed)'
  const segment = feature.properties.segment?.trim()
  return segment ? `${name} — ${segment}` : name
}

function disambiguator(feature: TrailFeature, siblings: TrailFeature[]): string {
  const ft = feature.properties.facility_type?.trim()
  const ftValues = siblings.map((f) => f.properties.facility_type?.trim() || '')
  if (ft && new Set(ftValues).size === siblings.length) return ft

  const len = feature.properties.length_miles
  const lenValues = siblings.map((f) => f.properties.length_miles ?? -1)
  if (len != null && new Set(lenValues).size === siblings.length) return `${len.toFixed(2)} mi`

  return `#${feature.properties.objectid}`
}

interface LabeledFeature {
  objectid: number
  feature: TrailFeature
  label: string
}

const groups = computed<Array<readonly [string, LabeledFeature[]]>>(() => {
  if (props.state.status !== 'loaded') return []
  const entries = Object.entries(props.state.grouped).sort(([a], [b]) => a.localeCompare(b))

  return entries.map(([system, features]) => {
    const bases = new Map<string, TrailFeature[]>()
    for (const feature of features) {
      const key = baseLabel(feature)
      const list = bases.get(key) ?? []
      list.push(feature)
      bases.set(key, list)
    }

    const labeled: LabeledFeature[] = features.map((feature) => {
      const base = baseLabel(feature)
      const siblings = bases.get(base) ?? [feature]
      const label =
        siblings.length === 1 ? base : `${base} (${disambiguator(feature, siblings)})`
      return { objectid: feature.properties.objectid, feature, label }
    })

    return [system, labeled] as const
  })
})
</script>

<template>
  <div class="trail-list">
    <p v-if="state.status === 'loading'" class="trail-list__status">Loading trails…</p>
    <p v-else-if="state.status === 'error'" class="trail-list__status trail-list__status--error">
      {{ state.message }}
    </p>
    <template v-else>
      <section v-for="[system, items] in groups" :key="system" class="trail-list__section">
        <h2
          class="trail-list__heading"
          @click="emit('selectSystem', items.map((i) => i.feature))"
        >
          {{ system }}
        </h2>
        <ul class="trail-list__items">
          <li
            v-for="item in items"
            :key="item.objectid"
            class="trail-list__item"
            :class="{ 'trail-list__item--hovered': hoveredId === item.objectid }"
            @mouseenter="emit('update:hoveredId', item.objectid)"
            @mouseleave="emit('update:hoveredId', null)"
            @click="emit('select', item.objectid)"
          >
            {{ item.label }}
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
  padding: 0.35rem 1rem;
  margin: 0;
  cursor: pointer;
}
.trail-list__heading:hover {
  background: #eef4fb;
  color: #2176d2;
}
.trail-list__items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.trail-list__item {
  padding: 0.35rem 1rem;
  cursor: pointer;
  font-size: 0.95rem;
}
.trail-list__item--hovered {
  background: #fff4d6;
}
</style>
