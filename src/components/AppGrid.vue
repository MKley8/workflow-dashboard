<script setup lang="ts">
import { computed } from 'vue'
import AppTile from './AppTile.vue'
import { useThemeStore } from '../stores/theme'
import { useDashboardLayoutStore } from '../stores/dashboardLayout'
import type { WorkflowApp } from '../types/app'

const props = defineProps<{ apps: WorkflowApp[] }>()
const themeStore = useThemeStore()
const layoutStore = useDashboardLayoutStore()

const grouped = computed(() => {
  const groups = new Map<string, WorkflowApp[]>()
  for (const app of props.apps) {
    const key = app.category || 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(app)
  }
  const entries = Array.from(groups.entries())
  if (layoutStore.sortCategoriesAlphabetically) {
    entries.sort(([a], [b]) => a.localeCompare(b))
  }
  return entries
})
</script>

<template>
  <div v-if="apps.length === 0" class="empty">
    No apps yet. Add one from the Manage Apps screen.
  </div>
  <div class="categories" :class="{ 'fill-width': themeStore.fillCategoryWidth }">
    <div
      v-for="[category, items] in grouped"
      :key="category"
      class="category"
      :style="{ '--items': items.length }"
    >
      <h2 class="category__title">{{ category }}</h2>
      <div class="grid">
        <AppTile v-for="app in items" :key="app.id" :app="app" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 1rem;
}

.categories.fill-width {
  display: block;
}

.category {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.9rem 1rem;
  flex: 0 1 auto;
  display: flex;
  flex-direction: column;
}

.categories.fill-width .category {
  background: none;
  border: none;
  padding: 0;
  width: 100%;
  margin-bottom: 1.25rem;
}

.category__title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(min(6, var(--items, 6)), minmax(0, 1fr));
  align-items: stretch;
  gap: var(--tile-gap, 0.75rem);
  flex: 1;
}

.grid :deep(.tile) {
  width: auto;
  height: 100%;
  min-width: 0;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
}
</style>
