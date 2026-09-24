<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAppsStore } from '../stores/apps'
import { getUserLayoutOnce, setUserLayoutEntry } from '../services/appLayoutService'

const props = defineProps<{ uid: string; email: string | null }>()
const emit = defineEmits<{ close: [] }>()

const appsStore = useAppsStore()
const loading = ref(true)
const saving = ref(false)
const loadError = ref<string | null>(null)

interface Row {
  appId: string
  name: string
  enabled: boolean
}

const rows = ref<Row[]>([])

onMounted(async () => {
  try {
    const existing = await getUserLayoutOnce(props.uid)
    const sorted = [...appsStore.sortedApps].sort((a, b) => {
      const orderA = existing[a.id]?.order ?? a.order ?? 0
      const orderB = existing[b.id]?.order ?? b.order ?? 0
      return orderA - orderB
    })
    rows.value = sorted.map((app) => ({
      appId: app.id,
      name: app.name,
      enabled: existing[app.id]?.enabled ?? app.enabled,
    }))
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load this account\'s layout.'
  } finally {
    loading.value = false
  }
})

function moveUp(index: number) {
  if (index === 0) return
  const next = [...rows.value]
  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
  rows.value = next
}

function moveDown(index: number) {
  if (index === rows.value.length - 1) return
  const next = [...rows.value]
  ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
  rows.value = next
}

async function save() {
  saving.value = true
  try {
    await Promise.all(
      rows.value.map((row, index) =>
        setUserLayoutEntry(props.uid, row.appId, { enabled: row.enabled, order: index }),
      ),
    )
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h2>Edit layout</h2>
      <p class="subtitle">{{ email || uid }}</p>

      <p v-if="loading" class="status">Loading current layout...</p>
      <p v-else-if="loadError" class="status error">{{ loadError }}</p>
      <template v-else>
        <p class="hint">
          Choose which apps this account sees on their dashboard, and reorder them with the
          arrows. Apps not shown here still exist in the shared catalog; they just won't
          appear for this account.
        </p>
        <ul class="rows">
          <li v-for="(row, index) in rows" :key="row.appId" class="row">
            <label class="row__check">
              <input v-model="row.enabled" type="checkbox" />
              {{ row.name }}
            </label>
            <div class="row__actions">
              <button type="button" :disabled="index === 0" @click="moveUp(index)">↑</button>
              <button type="button" :disabled="index === rows.length - 1" @click="moveDown(index)">
                ↓
              </button>
            </div>
          </li>
        </ul>
      </template>

      <div class="actions">
        <button type="button" class="secondary" @click="emit('close')">Cancel</button>
        <button type="button" :disabled="loading || saving" @click="save">
          {{ saving ? 'Saving...' : 'Save layout' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal {
  background: #1c212b;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

h2 {
  margin: 0;
}

.subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(245, 246, 250, 0.6);
}

.hint {
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.6);
  margin: 0;
}

.status {
  text-align: center;
  padding: 1rem;
  color: rgba(245, 246, 250, 0.7);
}

.status.error {
  color: #f87171;
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: #10141c;
  border-radius: 8px;
}

.row__check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.row__actions {
  display: flex;
  gap: 0.25rem;
}

.row__actions button {
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.row__actions button:disabled {
  opacity: 0.3;
  cursor: default;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.actions button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.actions button:disabled {
  opacity: 0.6;
  cursor: default;
}

.actions button.secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
}
</style>
