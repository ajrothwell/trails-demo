# trails-demo — Design

**Date:** 2026-05-15
**Status:** Approved — proceeding to implementation plan

## Purpose

A small Vue 3 + TypeScript demo app that renders Philadelphia's trail network on a map and lets the user hover trail names in a side list to highlight the matching line on the map. Serves as a reference for combining `@phila/phila-ui-app-header`, `@phila/phila-ui-app-footer`, and `@phila/phila-ui-map-core` in a standalone (non-monorepo) app.

## Stack

- **Vue 3** with `<script setup>` + TypeScript
- **Vite** (latest) for dev/build
- **No router, no Pinia** — single-page demo
- **@phila/phila-ui-app-header** — site header
- **@phila/phila-ui-app-footer** — site footer
- **@phila/phila-ui-map-core** — map + `LineLayer` + `MapNavigationControl` + `BasemapToggle`. Pulls `maplibre-gl` in as a transitive dep, so no separate maplibre install.

### CSS requirement

`@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css` must be imported in `main.ts`. Without it the map exhibits a continuous downward pan (MapLibre GL CSS missing).

## Data source

ArcGIS FeatureServer:
`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/trail_network/FeatureServer/0`

Fetched as GeoJSON via the service's native `f=geojson` parameter:
```
.../FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson
```

Geometry type is `esriGeometryPolyline` → GeoJSON `MultiLineString` / `LineString`. Key fields:
- `objectid` (number) — stable feature id used for hover linking
- `name` (string) — display label in the list
- `trail_system` (string) — grouping key for the list
- `segment`, `trail_status`, `length_miles` — available but unused in v1

## Layout

```
┌──────────────────────────────────────────────┐
│  AppHeader                                   │
├────────────────┬─────────────────────────────┤
│  TrailList     │  TrailMap                   │
│  (33%)         │  (67%)                      │
├────────────────┴─────────────────────────────┤
│  AppFooter                                   │
└──────────────────────────────────────────────┘
```

Implemented with CSS flexbox (column outer, row inner). Header/footer take their natural height; the middle row fills remaining vertical space.

## Components

### `App.vue`
Top-level shell. Owns shared state:
- `hoveredId: Ref<number | null>` — the `objectid` of the currently hovered trail
- Calls `useTrails()` once and passes the result down

Renders `<AppHeader>`, the 33/67 row containing `<TrailList>` and `<TrailMap>`, and `<AppFooter>`.

### `TrailList.vue`
Props:
- `state: TrailsState` (loading / loaded / error discriminated union)
- `hoveredId: number | null` (one-way, mostly used for visual styling of the hovered row)

Emits:
- `update:hoveredId` (number | null) — `v-model:hoveredId` from parent

Behavior:
- Loading state: renders "Loading trails…"
- Error state: renders the error message
- Loaded state: groups features by `trail_system`, sorts groups alphabetically, sorts names alphabetically within each group, renders a `<section>` per system with `<ul>` of names
- Each row binds `@mouseenter="emit('update:hoveredId', objectid)"` and `@mouseleave="emit('update:hoveredId', null)"`
- Hovered row gets a visual cue (e.g., background color shift)

### `TrailMap.vue`
Props:
- `features: GeoJSON.FeatureCollection` (empty FC when not loaded — keeps the source stable)
- `hoveredId: number | null`

Composition:
- `<Map as PhilaMap>` from map-core (alias to avoid shadowing JS global `Map`)
- `<MapNavigationControl position="bottom-right" />`
- `<BasemapToggle position="top-right" />`
- `<LineLayer id="trails-base">` — paints all features (`line-color: #2176d2`, `line-width: 2`)
- `<LineLayer id="trails-highlight">` — same source, filtered to the hovered feature (`line-color: #ffb02e`, `line-width: 5`)

Source is shared by reference between the two layers via a single GeoJSON source object passed to both.

### `useTrails.ts`
```ts
type TrailsState =
  | { status: 'loading' }
  | { status: 'loaded'; features: TrailFeature[]; grouped: Record<string, TrailFeature[]> }
  | { status: 'error'; message: string }
```

- Fetches the FeatureServer query once on mount
- Normalizes properties (no transform needed beyond type narrowing)
- Builds `grouped` by reducing features into a `Record<trail_system, TrailFeature[]>`

## Highlight mechanism

**Two stacked LineLayers sharing one GeoJSON source.** The highlight layer uses MapLibre's filter expression:

```js
filter: ['==', ['get', 'objectid'], hoveredId ?? -1]
```

When `hoveredId` is null, the sentinel `-1` matches nothing and the layer is effectively invisible. When set, only the matching feature renders in the brighter/thicker style on top of the base layer.

This was chosen over `feature-state` (B) and source-rebuild (C) because it requires no imperative map access and fits cleanly into map-core's declarative Vue API.

## Initial map state

Uses map-core's `<Map>` defaults: center `[-75.163613, 39.952372]` (Philly), zoom 16. No `fitBounds` in v1 — Philly center adequately frames the trail network, and `fitBounds` would require imperative access via `inject('map')`. Deferred per YAGNI.

## Loading / error / empty

- Map always renders. When data isn't loaded, both layers point at an empty FeatureCollection (no features → no lines, no errors).
- Left panel displays loading/error messages inline. No retry UI.

## File tree

```
trails-demo/
├── .gitignore                # includes .claude/, node_modules, dist
├── index.html
├── package.json
├── pnpm-lock.yaml            # (after install)
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── docs/superpowers/specs/2026-05-15-trails-demo-design.md
└── src/
    ├── main.ts               # mounts app, imports map-core CSS
    ├── App.vue
    ├── components/
    │   ├── TrailList.vue
    │   └── TrailMap.vue
    ├── composables/
    │   └── useTrails.ts
    └── types.ts              # TrailProperties, TrailFeature, TrailsState
```

## Out of scope (v1)

- Click-to-select / route to trail detail
- Search or filter inputs in the list panel
- Mobile responsive layout (33/67 split is desktop-first)
- `fitBounds` to data extent on load
- Persisting hover state across navigation
- Unit tests (this is a scaffolding demo)
