# trails-demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page Vue 3 + TypeScript app that renders Philadelphia's trail network as line features on a map, lists the trails in a left panel grouped by `trail_system`, and highlights the corresponding line on the map when a trail name is hovered.

**Architecture:** Vue 3 SFC components, no router/store. `App.vue` owns shared `hoveredId` state and a `useTrails()` composable that fetches the ArcGIS FeatureServer as GeoJSON once on mount. The map uses two stacked `<LineLayer>` components (base + filtered highlight) over a single shared GeoJSON source.

**Tech Stack:** Vue 3.5 (`<script setup>` + TS), Vite 7, `@phila/phila-ui-app-header`, `@phila/phila-ui-app-footer`, `@phila/phila-ui-map-core` (which pulls in `maplibre-gl` transitively).

**Spec:** [`docs/superpowers/specs/2026-05-15-trails-demo-design.md`](../specs/2026-05-15-trails-demo-design.md)

**Conventions:**
- Andy runs the dev server himself — implementer never starts `pnpm dev`.
- Run `pnpm type-check` after every code change as automated verification.
- Each task ends with a commit; commit messages are imperative (no trailing period).
- Use `pnpm` for package management.

---

## Task 1: Project scaffolding (Vue 3 + TS + Vite)

**Files:**
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/package.json`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/tsconfig.json`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/tsconfig.node.json`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/vite.config.ts`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/index.html`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/main.ts`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/App.vue`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/shims-vue.d.ts`

The repo is already initialized with `.gitignore` and the design spec committed.

- [ ] **Step 1.1: Create `package.json`**

```json
{
  "name": "trails-demo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.5.18"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.1",
    "typescript": "^5.8.3",
    "vite": "^7.0.6",
    "vue-tsc": "^3.0.5"
  }
}
```

- [ ] **Step 1.2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "paths": { "@/*": ["./src/*"] },
    "baseUrl": ".",
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "src/**/*.d.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 1.3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 1.4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

- [ ] **Step 1.5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trails Demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 1.6: Create `src/shims-vue.d.ts`**

```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
```

- [ ] **Step 1.7: Create `src/main.ts`**

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 1.8: Create `src/App.vue` (placeholder)**

```vue
<script setup lang="ts"></script>

<template>
  <div class="app">
    <main>trails-demo scaffold</main>
  </div>
</template>

<style>
html,
body,
#app,
.app {
  height: 100%;
  margin: 0;
}
body {
  font-family: system-ui, -apple-system, sans-serif;
}
</style>
```

- [ ] **Step 1.9: Install dependencies**

Run: `pnpm install`
Expected: completes without errors, creates `node_modules/` and `pnpm-lock.yaml`.

- [ ] **Step 1.10: Verify type check passes**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 1.11: Confirm with Andy that the dev server boots**

Tell Andy: "Scaffold is in place — please run `pnpm dev` and confirm you see 'trails-demo scaffold' at `http://localhost:5173`."
Expected: Andy reports the page renders.

- [ ] **Step 1.12: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Scaffold Vue 3 + TS + Vite project"
```

---

## Task 2: Install phila-ui packages and render AppHeader / AppFooter shell

**Files:**
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/package.json` (adds deps via pnpm)
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/main.ts`
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/App.vue`

- [ ] **Step 2.1: Install phila-ui beta packages + maplibre-gl**

`maplibre-gl` is a transitive dep of `@phila/phila-ui-map-core`, but we install it directly too so we can `import type { FilterSpecification } from 'maplibre-gl'` cleanly under pnpm's strict node_modules.

Run:
```bash
pnpm -C C:/Users/andy.rothwell/Projects/trails-demo add @phila/phila-ui-app-header@beta @phila/phila-ui-app-footer@beta @phila/phila-ui-map-core@beta maplibre-gl
```
Expected: completes without errors. `package.json` now lists those packages under `dependencies`.

- [ ] **Step 2.2: Update `src/main.ts` to import map-core CSS**

```ts
import { createApp } from 'vue'
import App from './App.vue'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'

createApp(App).mount('#app')
```

(The CSS import is required even before the map is rendered — without it, when the map is added later it will pan continuously downward because MapLibre's CSS is missing.)

- [ ] **Step 2.3: Replace `src/App.vue` with the layout shell**

```vue
<script setup lang="ts">
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
</script>

<template>
  <div class="app">
    <AppHeader />
    <div class="app__body">
      <aside class="app__list">
        <p style="padding: 1rem">Trail list goes here</p>
      </aside>
      <section class="app__map">
        <p style="padding: 1rem">Map goes here</p>
      </section>
    </div>
    <AppFooter />
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
  min-height: 100%;
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
}
</style>
```

- [ ] **Step 2.4: Verify type check passes**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo type-check`
Expected: no errors.

- [ ] **Step 2.5: Confirm with Andy that header + footer render**

Tell Andy: "AppHeader and AppFooter are wired with placeholder panels between them. Please refresh and confirm the page shows: Philly header at top, two empty panels (33/67) in the middle, footer at bottom."
Expected: Andy confirms.

- [ ] **Step 2.6: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Add phila-ui header/footer and layout shell"
```

---

## Task 3: types.ts and useTrails composable

**Files:**
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/types.ts`
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/composables/useTrails.ts`

- [ ] **Step 3.1: Create `src/types.ts`**

```ts
import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson'

export interface TrailProperties {
  objectid: number
  name: string | null
  trail_system: string | null
  segment: string | null
  trail_status: string | null
  length_miles: number | null
}

export type TrailGeometry = LineString | MultiLineString

export type TrailFeature = Feature<TrailGeometry, TrailProperties>

export type TrailCollection = FeatureCollection<TrailGeometry, TrailProperties>

export type TrailsState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      collection: TrailCollection
      features: TrailFeature[]
      grouped: Record<string, TrailFeature[]>
    }
  | { status: 'error'; message: string }
```

- [ ] **Step 3.2: Install `@types/geojson`**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo add -D @types/geojson`
Expected: installs without errors.

- [ ] **Step 3.3: Create `src/composables/useTrails.ts`**

```ts
import { ref, onMounted, type Ref } from 'vue'
import type { TrailCollection, TrailFeature, TrailsState } from '@/types'

const SERVICE_URL =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/trail_network/FeatureServer/0/query'

const QUERY = '?where=1%3D1&outFields=*&outSR=4326&f=geojson'

const UNGROUPED_KEY = 'Other'

function groupByTrailSystem(features: TrailFeature[]): Record<string, TrailFeature[]> {
  const grouped: Record<string, TrailFeature[]> = {}
  for (const feature of features) {
    const key = feature.properties.trail_system?.trim() || UNGROUPED_KEY
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(feature)
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => (a.properties.name ?? '').localeCompare(b.properties.name ?? ''))
  }
  return grouped
}

export function useTrails(): { state: Ref<TrailsState> } {
  const state = ref<TrailsState>({ status: 'loading' })

  onMounted(async () => {
    try {
      const response = await fetch(`${SERVICE_URL}${QUERY}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const collection = (await response.json()) as TrailCollection
      const features = collection.features
      state.value = {
        status: 'loaded',
        collection,
        features,
        grouped: groupByTrailSystem(features),
      }
    } catch (err) {
      state.value = {
        status: 'error',
        message: err instanceof Error ? err.message : 'Failed to load trails',
      }
    }
  })

  return { state }
}
```

- [ ] **Step 3.4: Verify type check passes**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo type-check`
Expected: no errors.

- [ ] **Step 3.5: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Add trail types and useTrails composable"
```

---

## Task 4: TrailList component (no hover yet)

**Files:**
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/components/TrailList.vue`
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/App.vue`

- [ ] **Step 4.1: Create `src/components/TrailList.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
  hoveredId: number | null
}>()

const emit = defineEmits<{
  'update:hoveredId': [value: number | null]
}>()

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
            {{ feature.properties.name ?? '(unnamed)' }}
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
```

- [ ] **Step 4.2: Wire `TrailList` into `App.vue`**

Replace `src/App.vue` with:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
import TrailList from '@/components/TrailList.vue'
import { useTrails } from '@/composables/useTrails'

const { state } = useTrails()
const hoveredId = ref<number | null>(null)
</script>

<template>
  <div class="app">
    <AppHeader />
    <div class="app__body">
      <aside class="app__list">
        <TrailList v-model:hovered-id="hoveredId" :state="state" />
      </aside>
      <section class="app__map">
        <p style="padding: 1rem">Map goes here</p>
      </section>
    </div>
    <AppFooter />
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
  min-height: 100%;
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
}
</style>
```

- [ ] **Step 4.3: Verify type check passes**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo type-check`
Expected: no errors.

- [ ] **Step 4.4: Confirm with Andy**

Tell Andy: "TrailList is wired. Please refresh and confirm: the left panel shows 'Loading trails…' briefly, then a list of trail systems with trail names underneath each system heading. Hovering a name should turn its background pale yellow."
Expected: Andy confirms.

- [ ] **Step 4.5: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Add TrailList component and wire to useTrails"
```

---

## Task 5: TrailMap component (base layer, no highlight yet)

**Files:**
- Create: `C:/Users/andy.rothwell/Projects/trails-demo/src/components/TrailMap.vue`
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/App.vue`

- [ ] **Step 5.1: Create `src/components/TrailMap.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import {
  Map as PhilaMap,
  LineLayer,
  MapNavigationControl,
  BasemapToggle,
} from '@phila/phila-ui-map-core'
import type { TrailsState } from '@/types'

const props = defineProps<{
  state: TrailsState
}>()

const EMPTY_COLLECTION = {
  type: 'FeatureCollection' as const,
  features: [],
}

const source = computed(() => ({
  type: 'geojson' as const,
  data: props.state.status === 'loaded' ? props.state.collection : EMPTY_COLLECTION,
}))
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
  </PhilaMap>
</template>

<style scoped>
.trail-map {
  width: 100%;
  height: 100%;
}
</style>
```

- [ ] **Step 5.2: Wire `TrailMap` into `App.vue`**

Replace `src/App.vue` with:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AppHeader } from '@phila/phila-ui-app-header'
import { AppFooter } from '@phila/phila-ui-app-footer'
import TrailList from '@/components/TrailList.vue'
import TrailMap from '@/components/TrailMap.vue'
import { useTrails } from '@/composables/useTrails'

const { state } = useTrails()
const hoveredId = ref<number | null>(null)
</script>

<template>
  <div class="app">
    <AppHeader />
    <div class="app__body">
      <aside class="app__list">
        <TrailList v-model:hovered-id="hoveredId" :state="state" />
      </aside>
      <section class="app__map">
        <TrailMap :state="state" />
      </section>
    </div>
    <AppFooter />
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
  min-height: 100%;
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
}
</style>
```

- [ ] **Step 5.3: Verify type check passes**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo type-check`
Expected: no errors.

- [ ] **Step 5.4: Confirm with Andy**

Tell Andy: "Map is wired. Please refresh and confirm: the right panel shows a Philly basemap centered around the city, blue trail lines rendered on top, and basemap toggle (top-right) + zoom controls (bottom-right) are visible. Map should NOT pan downward — if it does, the CSS import in `main.ts` regressed."
Expected: Andy confirms.

- [ ] **Step 5.5: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Add TrailMap with base LineLayer"
```

---

## Task 6: Hover highlight wiring

**Files:**
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/components/TrailMap.vue`
- Modify: `C:/Users/andy.rothwell/Projects/trails-demo/src/App.vue`

- [ ] **Step 6.1: Add `hoveredId` prop + highlight LineLayer to `TrailMap.vue`**

Replace `src/components/TrailMap.vue` with:

```vue
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
```

- [ ] **Step 6.2: Pass `hoveredId` from `App.vue` to `TrailMap`**

In `src/App.vue`, change the `<TrailMap>` usage from:

```vue
<TrailMap :state="state" />
```

to:

```vue
<TrailMap :state="state" :hovered-id="hoveredId" />
```

- [ ] **Step 6.3: Verify type check passes**

Run: `pnpm -C C:/Users/andy.rothwell/Projects/trails-demo type-check`
Expected: no errors.

- [ ] **Step 6.4: Confirm with Andy**

Tell Andy: "Highlight is wired. Please refresh and confirm: hovering a trail name in the left panel paints the corresponding line on the map in thick orange (5px). Moving the mouse off the name returns the line to the normal blue style. Test a few names across different `trail_system` groups."
Expected: Andy confirms.

- [ ] **Step 6.5: Commit**

```bash
git -C C:/Users/andy.rothwell/Projects/trails-demo add -A
git -C C:/Users/andy.rothwell/Projects/trails-demo commit -m "Add hover highlight via filtered LineLayer"
```

---

## Done

After Task 6, the app fulfills the spec:
- ✅ Vue 3 + TypeScript via Vite
- ✅ Renders `@phila/phila-ui-app-header` and `@phila/phila-ui-app-footer`
- ✅ Uses `@phila/phila-ui-map-core` (with maplibre pulled in transitively)
- ✅ 33/67 left-panel-list / right-panel-map layout
- ✅ Trail FeatureServer rendered as line layers
- ✅ Left panel lists each feature grouped by `trail_system`, sorted alphabetically
- ✅ Hovering a name highlights the matching feature with a brighter, thicker stroke
