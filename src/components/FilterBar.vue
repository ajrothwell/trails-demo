<script setup lang="ts">
import { computed } from 'vue'
import type { TrailFeature, TrailProperties } from '@/types'

type FilterFieldKey = Extract<
  keyof TrailProperties,
  'trail_status' | 'trail_surface' | 'facility_type' | 'major_trail'
>

interface FilterField {
  key: FilterFieldKey
  label: string
}

export type Filters = Record<FilterFieldKey, Set<string>>

const props = defineProps<{
  features: TrailFeature[]
  filters: Filters
}>()

const emit = defineEmits<{
  'update:filters': [value: Filters]
}>()

const FIELDS: FilterField[] = [
  { key: 'trail_status', label: 'Status' },
  { key: 'trail_surface', label: 'Surface' },
  { key: 'facility_type', label: 'Facility type' },
  { key: 'major_trail', label: 'Major trail' },
]

interface FieldOptions {
  field: FilterField
  values: string[]
}

const groups = computed<FieldOptions[]>(() =>
  FIELDS.map((field) => {
    const counts = new Map<string, number>()
    for (const feature of props.features) {
      const raw = feature.properties[field.key]
      const v = typeof raw === 'string' ? raw.trim() : ''
      if (!v) continue
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    const values = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([v]) => v)
    return { field, values }
  }),
)

function isChecked(key: FilterFieldKey, value: string): boolean {
  return props.filters[key]?.has(value) ?? false
}

function toggle(key: FilterFieldKey, value: string): void {
  const next: Filters = {
    trail_status: new Set(props.filters.trail_status),
    trail_surface: new Set(props.filters.trail_surface),
    facility_type: new Set(props.filters.facility_type),
    major_trail: new Set(props.filters.major_trail),
  }
  if (next[key].has(value)) next[key].delete(value)
  else next[key].add(value)
  emit('update:filters', next)
}

function clearField(key: FilterFieldKey): void {
  const next: Filters = {
    trail_status: new Set(props.filters.trail_status),
    trail_surface: new Set(props.filters.trail_surface),
    facility_type: new Set(props.filters.facility_type),
    major_trail: new Set(props.filters.major_trail),
  }
  next[key] = new Set()
  emit('update:filters', next)
}
</script>

<template>
  <div class="filter-bar">
    <section v-for="group in groups" :key="group.field.key" class="filter-bar__group">
      <header class="filter-bar__group-header">
        <span class="filter-bar__group-label">{{ group.field.label }}</span>
        <button
          v-if="filters[group.field.key].size > 0"
          type="button"
          class="filter-bar__clear"
          @click="clearField(group.field.key)"
        >
          clear
        </button>
      </header>
      <ul class="filter-bar__options">
        <li v-for="value in group.values" :key="value" class="filter-bar__option">
          <label>
            <input
              type="checkbox"
              :checked="isChecked(group.field.key, value)"
              @change="toggle(group.field.key, value)"
            />
            {{ value }}
          </label>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  font-size: 0.9rem;
}
.filter-bar__group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.filter-bar__group-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.filter-bar__group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #555;
  font-weight: 600;
}
.filter-bar__clear {
  font-size: 0.7rem;
  background: transparent;
  border: none;
  color: #2176d2;
  cursor: pointer;
  padding: 0;
}
.filter-bar__clear:hover {
  text-decoration: underline;
}
.filter-bar__options {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}
.filter-bar__option label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  color: #222;
}
.filter-bar__option input[type='checkbox'] {
  cursor: pointer;
}
</style>
