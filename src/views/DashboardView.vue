<script setup lang="ts">
import { onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'
import AppGrid from '../components/AppGrid.vue'
import { useAppsStore } from '../stores/apps'

const appsStore = useAppsStore()

onMounted(() => {
  appsStore.init()
})
</script>

<template>
  <div class="page">
    <NavBar />
    <main class="content">
      <p v-if="appsStore.loading" class="status">Loading apps...</p>
      <p v-else-if="appsStore.error" class="status error">{{ appsStore.error }}</p>
      <AppGrid v-else :apps="appsStore.dashboardApps" />
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
}

.content {
  display: flex;
  flex-wrap: wrap;
  padding: 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
  justify-content: space-between;
}

.status {
  text-align: center;
  padding: 2rem;
  color: rgba(245, 246, 250, 0.7);
}

.status.error {
  color: #f87171;
}

.grid{
  display: flex;
  flex-direction: row;

}
</style>
