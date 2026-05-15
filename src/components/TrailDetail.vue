<script setup lang="ts">
import { computed } from 'vue'
import type { TrailFeature, TrailProperties } from '@/types'

const props = defineProps<{
  feature: TrailFeature
}>()

const emit = defineEmits<{
  close: []
}>()

type FieldKey = Exclude<keyof TrailProperties, 'name'>

type Formatter = (value: NonNullable<TrailProperties[FieldKey]>) => string

interface FieldConfig {
  key: FieldKey
  label: string
  format?: Formatter
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const formatDate: Formatter = (v) => dateFormatter.format(new Date(v as number))
const formatMiles: Formatter = (v) => `${(v as number).toFixed(2)} mi`
const formatMeters: Formatter = (v) => `${(v as number).toFixed(0)} m`

const FIELDS: FieldConfig[] = [
  { key: 'segment', label: 'Segment' },
  { key: 'trail_system', label: 'Trail system' },
  { key: 'facility_type', label: 'Facility type' },
  { key: 'trail_status', label: 'Status' },
  { key: 'trail_status_planning', label: 'Planning status' },
  { key: 'existing', label: 'Existing' },
  { key: 'major_trail', label: 'Major trail' },
  { key: 'multi_purpose', label: 'Multi-purpose' },
  { key: 'trail_surface', label: 'Surface' },
  { key: 'bridge', label: 'Bridge' },
  { key: 'streets_row', label: 'Streets ROW' },
  { key: 'maintenance_organization', label: 'Maintenance org' },
  { key: 'maintenance_label', label: 'Maintenance label' },
  { key: 'project_sponsor', label: 'Project sponsor' },
  { key: 'length_miles', label: 'Length', format: formatMiles },
  { key: 'Shape__Length', label: 'Shape length', format: formatMeters },
  { key: 'created_date', label: 'Created', format: formatDate },
  { key: 'last_edited_date', label: 'Last edited', format: formatDate },
  { key: 'created_user', label: 'Created by' },
  { key: 'last_edited_user', label: 'Last edited by' },
  { key: 'objectid', label: 'Object ID' },
  { key: 'globalid', label: 'Global ID' },
]

const rows = computed(() =>
  FIELDS.flatMap((field) => {
    const value = props.feature.properties[field.key]
    if (value == null || value === '') return []
    const display = field.format ? field.format(value) : String(value)
    return [{ label: field.label, value: display }]
  }),
)
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

    <dl class="trail-detail__fields">
      <template v-for="row in rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
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
  margin-bottom: 1rem;
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
  overflow-wrap: anywhere;
}
</style>
