<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import ToastHost from './components/ToastHost.vue'
import Sidebar from './components/Sidebar.vue'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  authStore.init()
})

/** The login page has no sidebar shell; every other route does. */
const showShell = computed(() => route.name !== 'login')
</script>

<template>
  <template v-if="authStore.initialized">
    <div v-if="showShell" class="shell">
      <Sidebar />
      <div class="shell__content">
        <RouterView />
      </div>
    </div>
    <RouterView v-else />
  </template>
  <div v-else class="boot">Loading...</div>
  <ToastHost />
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
}

.shell__content {
  flex: 1;
  min-width: 0;
}

@media (max-width: 768px) {
  .shell__content {
    padding-top: 3.5rem;
  }
}

.boot {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}
</style>
