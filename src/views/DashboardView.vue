<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppGrid from '../components/AppGrid.vue'
import DashboardLayoutPanel from '../components/DashboardLayoutPanel.vue'
import { useAppsStore } from '../stores/apps'
import { useAuthStore } from '../stores/auth'
import { useDashboardLayoutStore, type TileDensity } from '../stores/dashboardLayout'

const appsStore = useAppsStore()
const authStore = useAuthStore()
const layoutStore = useDashboardLayoutStore()
const layoutPanelOpen = ref(false)

onMounted(() => {
  appsStore.init()
})

const TILE_DENSITY_VARS: Record<TileDensity, Record<string, string>> = {
  compact: { '--tile-min-height': '92px', '--tile-padding': '0.7rem 0.6rem', '--tile-gap': '0.5rem' },
  comfortable: { '--tile-min-height': '128px', '--tile-padding': '1.1rem 0.9rem', '--tile-gap': '0.75rem' },
  spacious: { '--tile-min-height': '168px', '--tile-padding': '1.4rem 1.15rem', '--tile-gap': '1rem' },
}

const densityStyle = computed(() => TILE_DENSITY_VARS[layoutStore.tileDensity])

/** First name from the signed-in Google account, falling back to email, then a generic greeting. */
const greetingName = computed(() => {
  const displayName = authStore.user?.displayName
  if (displayName) return displayName.split(' ')[0]
  return authStore.user?.email || 'there'
})
</script>

<template>
  <main class="content" :style="densityStyle">
    <div class="header">
      <h1 class="greeting">Welcome back, {{ greetingName }}</h1>
      <button type="button" class="layout-btn" title="Layout options" @click="layoutPanelOpen = true">
        <span class="icon">tune</span>
        Layout
      </button>
    </div>
    <p v-if="appsStore.loading" class="status">Loading apps...</p>
    <p v-else-if="appsStore.error" class="status error">{{ appsStore.error }}</p>
    <AppGrid v-else :apps="appsStore.dashboardApps" />

    <DashboardLayoutPanel :open="layoutPanelOpen" @close="layoutPanelOpen = false" />
  </main>
</template>

<style scoped>
.content {
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.greeting {
  font-size: 1.5rem;
  margin: 0;
}

.layout-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

.layout-btn:hover {
  background: var(--surface-hover);
}

.layout-btn .icon {
  font-size: 18px;
}

.status {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.status.error {
  color: var(--danger);
}
</style>
