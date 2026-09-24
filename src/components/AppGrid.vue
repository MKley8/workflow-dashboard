<script setup lang="ts">
import { computed } from 'vue'
import AppTile from './AppTile.vue'
import type { WorkflowApp } from '../types/app'

const props = defineProps<{ apps: WorkflowApp[] }>()

const grouped = computed(() => {
  const groups = new Map<string, WorkflowApp[]>()
  for (const app of props.apps) {
    const key = app.category || 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(app)
  }
  return Array.from(groups.entries())
})
</script>

<template>
  <div v-if="apps.length === 0" class="empty">
    No apps yet. Add one from the Manage Apps screen.
  </div>
  <section v-for="[category, items] in grouped" :key="category" class="category">
    <h2 class="category__title">{{ category }}</h2>
    <div class="grid">
      <AppTile v-for="app in items" :key="app.id" :app="app" />
    </div>
  </section>
</template>

<style scoped>
.category {
  margin-bottom: 2rem;
}

.category__title {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(245, 246, 250, 0.55);
  margin-bottom: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.empty {
  padding: 2rem;
  text-align: center;
  color: rgba(245, 246, 250, 0.6);
}
</style>
