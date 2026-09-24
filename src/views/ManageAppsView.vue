<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import AddEditAppModal from '../components/AddEditAppModal.vue'
import { useAppsStore } from '../stores/apps'
import type { WorkflowApp, WorkflowAppInput } from '../types/app'

const appsStore = useAppsStore()
const showModal = ref(false)
const editingApp = ref<WorkflowApp | null>(null)

onMounted(() => {
  appsStore.init()
})

function openAdd() {
  editingApp.value = null
  showModal.value = true
}

function openEdit(app: WorkflowApp) {
  editingApp.value = app
  showModal.value = true
}

async function save(input: WorkflowAppInput) {
  if (editingApp.value) {
    await appsStore.update(editingApp.value.id, input)
  } else {
    await appsStore.create({ ...input, order: appsStore.apps.length })
  }
  showModal.value = false
}

async function toggleEnabled(app: WorkflowApp) {
  await appsStore.update(app.id, { enabled: !app.enabled })
}

async function remove(app: WorkflowApp) {
  if (confirm(`Remove "${app.name}" from the dashboard?`)) {
    await appsStore.remove(app.id)
  }
}
</script>

<template>
  <div class="page">
    <NavBar />
    <main class="content">
      <div class="header">
        <h1>Manage Apps</h1>
        <button class="primary" @click="openAdd">+ Add App</button>
      </div>

      <p class="hint">
        Apps added or removed here update instantly for everyone using the dashboard — no
        redeploy needed.
      </p>

      <ul class="list">
        <li v-for="app in appsStore.sortedApps" :key="app.id" class="row">
          <span class="swatch" :style="{ background: app.color || '#4a5568' }" />
          <div class="info">
            <strong>{{ app.name }}</strong>
            <span class="muted">{{ app.url }}</span>
          </div>
          <span class="tag">{{ app.category || 'Other' }}</span>
          <label class="switch">
            <input type="checkbox" :checked="app.enabled" @change="toggleEnabled(app)" />
            Enabled
          </label>
          <button class="secondary" @click="openEdit(app)">Edit</button>
          <button class="danger" @click="remove(app)">Remove</button>
        </li>
      </ul>
    </main>

    <AddEditAppModal
      v-if="showModal"
      :app="editingApp"
      @save="save"
      @close="showModal = false"
    />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
}

.content {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.hint {
  color: rgba(245, 246, 250, 0.6);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #1c212b;
  border-radius: 12px;
  flex-wrap: wrap;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 4px;
  flex-shrink: 0;
}

.info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 160px;
}

.muted {
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.5);
  word-break: break-all;
}

.tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.7);
}

button {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

button.primary {
  background: #4f46e5;
  color: #fff;
}

button.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

button.danger {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}
</style>
