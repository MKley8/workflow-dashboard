<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AddEditAppModal from '../components/AddEditAppModal.vue'
import { useAppsStore } from '../stores/apps'
import { useAuthStore } from '../stores/auth'
import type { WorkflowApp, WorkflowAppInput } from '../types/app'

const appsStore = useAppsStore()
const authStore = useAuthStore()
const showModal = ref(false)
const editingApp = ref<WorkflowApp | null>(null)
const search = ref('')

onMounted(() => {
  appsStore.init()
})

/** Full control (remove, toggle site-wide enabled, edit every field) - admins only. */
function canFullyManage() {
  return authStore.isAdmin
}

const filteredApps = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return appsStore.sortedApps
  return appsStore.sortedApps.filter((app) => {
    const haystack = [app.name, app.category, app.url, app.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(term)
  })
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
  if (!canFullyManage()) return
  await appsStore.update(app.id, { enabled: !app.enabled })
}

async function toggleHiddenForMe(app: WorkflowApp) {
  await appsStore.setMyVisibility(app.id, appsStore.isHiddenForMe(app.id))
}

async function remove(app: WorkflowApp) {
  if (!canFullyManage()) return
  if (confirm(`Remove "${app.name}" from the dashboard?`)) {
    await appsStore.remove(app.id)
  }
}
</script>

<template>
  <main class="content">
    <div class="header">
      <h1>Manage Apps</h1>
      <button class="primary" @click="openAdd">+ Add App</button>
    </div>

    <p class="hint">
      Apps added here update instantly for everyone using the dashboard — no redeploy
      needed. Only admins can change an app's URL, description, Google OAuth URL, or
      remove it - members can rename an app and change its sign-in method, and can always
      hide any app from just their own dashboard without affecting anyone else.
    </p>

    <input v-model="search" class="search" type="search" placeholder="Search apps by name, category, or URL..." />

    <p v-if="filteredApps.length === 0" class="status">No apps match your search.</p>

    <ul class="list">
      <li v-for="app in filteredApps" :key="app.id" class="row">
        <span class="swatch" :style="{ background: app.color || '#4a5568' }" />
        <div class="info">
          <strong>{{ app.name }}</strong>
          <span class="muted">{{ app.url }}</span>
        </div>
        <span class="tag">{{ app.category || 'Other' }}</span>
        <span v-if="app.ownerIsAdmin" class="tag admin-given">Admin-given</span>
        <label class="switch">
          <input
            type="checkbox"
            :checked="app.enabled"
            :disabled="!canFullyManage()"
            @change="toggleEnabled(app)"
          />
          Enabled for everyone
        </label>
        <label class="switch">
          <input
            type="checkbox"
            :checked="!appsStore.isHiddenForMe(app.id)"
            @change="toggleHiddenForMe(app)"
          />
          Show on my dashboard
        </label>
        <button class="secondary" @click="openEdit(app)">Edit</button>
        <button v-if="canFullyManage()" class="danger" @click="remove(app)">Remove</button>
      </li>
    </ul>

    <AddEditAppModal
      v-if="showModal"
      :app="editingApp"
      :restricted="!!editingApp && !canFullyManage()"
      @save="save"
      @close="showModal = false"
    />
  </main>
</template>

<style scoped>
.content {
  padding: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 1.1rem;
}

.search {
  width: 100%;
  max-width: 320px;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  margin-bottom: 1rem;
}

.status {
  padding: 1rem 0;
  color: var(--text-muted);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  flex-wrap: wrap;
  transition: border-color 0.15s ease;
}

.row:hover {
  border-color: var(--accent);
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
  overflow: hidden;
}

.muted {
  font-size: 0.75rem;
  color: var(--text-muted-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
}

.tag.admin-given {
  background: rgba(99, 102, 241, 0.18);
  color: var(--accent-2);
}

.switch {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

button {
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: filter 0.15s ease, background-color 0.15s ease;
}

button.primary {
  background: var(--accent);
  color: var(--accent-contrast);
}

button.primary:hover {
  filter: brightness(1.08);
}

button.secondary {
  background: var(--surface-2);
  color: var(--text);
}

button.secondary:hover {
  background: var(--surface-hover);
}

button.danger {
  background: rgba(248, 113, 113, 0.15);
  color: var(--danger);
}
</style>
