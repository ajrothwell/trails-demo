<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { TrailFeature, TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredIds: number[]
  selectedId: number | null
}>()

const emit = defineEmits<{
  'update:hoveredIds': [value: number[]]
  zoomTo: [features: TrailFeature[]]
}>()

/** One list row: every segment sharing a name + segment label. */
interface TrailRow {
  id: number
  label: string
  features: TrailFeature[]
  objectids: Set<number>
}

/** A row is hovered when the hovered ids all belong to it — a map hover on one of its
 *  segments, or a hover on the row itself — but not when a whole system is hovered. */
function isRowHovered(row: TrailRow): boolean {
  const ids = props.hoveredIds
  return ids.length > 0 && ids.every((id) => row.objectids.has(id))
}

function rowLabel(feature: TrailFeature): string {
  const name = feature.properties.name?.trim() || '(unnamed)'
  const segment = feature.properties.segment?.trim()
  return segment ? `${name} — ${segment}` : name
}

const groups = computed<Array<readonly [string, TrailRow[]]>>(() => {
  if (props.state.status !== 'loaded') return []
  const entries = Object.entries(props.state.grouped).sort(([a], [b]) => a.localeCompare(b))

  return entries.map(([system, features]) => {
    const rows = new Map<string, TrailRow>()
    for (const feature of features) {
      const label = rowLabel(feature)
      const objectid = feature.properties.objectid
      const row = rows.get(label)
      if (row) {
        row.features.push(feature)
        row.objectids.add(objectid)
      } else {
        rows.set(label, { id: objectid, label, features: [feature], objectids: new Set([objectid]) })
      }
    }
    return [system, [...rows.values()]] as const
  })
})

const rowByObjectid = computed<Map<number, TrailRow>>(() => {
  const index = new Map<number, TrailRow>()
  for (const [, rows] of groups.value) {
    for (const row of rows) {
      for (const objectid of row.objectids) index.set(objectid, row)
    }
  }
  return index
})

const listRoot = ref<HTMLDivElement | null>(null)

function scrollRowToTop(rowId: number): void {
  const el = listRoot.value?.querySelector<HTMLLIElement>(`[data-row-id="${rowId}"]`)
  el?.scrollIntoView({ block: 'start', behavior: 'instant' })
}

// Scroll the selected segment's row to the top so it's on screen when the detail panel closes.
watch(
  () => props.selectedId,
  async (objectid) => {
    if (objectid == null) return
    const row = rowByObjectid.value.get(objectid)
    if (!row) return
    await nextTick()
    scrollRowToTop(row.id)
  },
)

function systemObjectids(rows: TrailRow[]): number[] {
  return rows.flatMap((row) => [...row.objectids])
}

function systemFeatures(rows: TrailRow[]): TrailFeature[] {
  return rows.flatMap((row) => row.features)
}
</script>

<template>
  <div ref="listRoot" class="trail-list">
    <p v-if="state.status === 'loading'" class="trail-list__status">Loading trails…</p>
    <p v-else-if="state.status === 'error'" class="trail-list__status trail-list__status--error">
      {{ state.message }}
    </p>
    <template v-else>
      <section v-for="[system, rows] in groups" :key="system" class="trail-list__section">
        <h2
          class="trail-list__heading"
          @mouseenter="emit('update:hoveredIds', systemObjectids(rows))"
          @mouseleave="emit('update:hoveredIds', [])"
          @click="emit('zoomTo', systemFeatures(rows))"
        >
          {{ system }}
        </h2>
        <ul class="trail-list__items">
          <li
            v-for="row in rows"
            :key="row.id"
            class="trail-list__item"
            :class="{ 'trail-list__item--hovered': isRowHovered(row) }"
            :data-row-id="row.id"
            @mouseenter="emit('update:hoveredIds', [...row.objectids])"
            @mouseleave="emit('update:hoveredIds', [])"
            @click="emit('zoomTo', row.features)"
          >
            {{ row.label }}
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
  font-weight: 700;
}
</style>
