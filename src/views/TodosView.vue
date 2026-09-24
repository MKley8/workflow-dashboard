<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useAppsStore } from '../stores/apps'
import { useAdminStore } from '../stores/admin'
import { useTodosStore } from '../stores/todos'
import type { UserProfile } from '../types/user'

const authStore = useAuthStore()
const appsStore = useAppsStore()
const adminStore = useAdminStore()
const todosStore = useTodosStore()

onMounted(() => {
  appsStore.init()
  if (authStore.user) todosStore.subscribe(authStore.user.uid)
  if (authStore.isAdmin) adminStore.loadAccounts()
})

// --- New task form (opens as a side panel from the "Add Task" banner button) ---
const showForm = ref(false)
const title = ref('')
const description = ref('')
const linkedAppIds = ref<string[]>([])
const creating = ref(false)

// --- Assign to: search-and-pick multiple members (admins only) ---
const assigneeSearch = ref('')
const selectedAssignees = ref<UserProfile[]>([])

const filteredAssigneeCandidates = computed(() => {
  const term = assigneeSearch.value.trim().toLowerCase()
  const selectedUids = new Set(selectedAssignees.value.map((a) => a.uid))
  const pool = adminStore.accounts.filter((a) => !selectedUids.has(a.uid))
  if (!term) return pool
  return pool.filter((a) => {
    const email = (a.email || '').toLowerCase()
    const name = (a.displayName || '').toLowerCase()
    return email.includes(term) || name.includes(term)
  })
})

function addAssignee(account: UserProfile) {
  selectedAssignees.value.push(account)
  assigneeSearch.value = ''
}

function removeAssignee(uid: string) {
  selectedAssignees.value = selectedAssignees.value.filter((a) => a.uid !== uid)
}

function toggleLinkedApp(appId: string) {
  const index = linkedAppIds.value.indexOf(appId)
  if (index === -1) linkedAppIds.value.push(appId)
  else linkedAppIds.value.splice(index, 1)
}

function closeForm() {
  showForm.value = false
  title.value = ''
  description.value = ''
  linkedAppIds.value = []
  selectedAssignees.value = []
  assigneeSearch.value = ''
}

async function addTask() {
  if (!title.value.trim() || !authStore.user) return
  creating.value = true
  try {
    const chosenUids =
      authStore.isAdmin && selectedAssignees.value.length
        ? selectedAssignees.value.map((a) => a.uid)
        : [authStore.user.uid]
    const chosenEmails =
      authStore.isAdmin && selectedAssignees.value.length
        ? selectedAssignees.value.map((a) => a.email)
        : [authStore.user.email]
    await todosStore.create({
      title: title.value.trim(),
      description: description.value.trim() || undefined,
      assignedToUids: chosenUids,
      assignedToEmails: chosenEmails,
      createdByUid: authStore.user.uid,
      createdByEmail: authStore.user.email,
      linkedAppIds: [...linkedAppIds.value],
    })
    closeForm()
  } finally {
    creating.value = false
  }
}

function appName(appId: string): string {
  return appsStore.apps.find((a) => a.id === appId)?.name || appId
}

async function toggleDone(id: string, done: boolean) {
  await todosStore.setDone(id, done)
}

async function removeTodo(id: string) {
  await todosStore.remove(id)
}
</script>

<template>
  <main class="content">
    <div class="banner">
      <h1>To-Do</h1>
      <button type="button" class="primary" @click="showForm = !showForm">
        <span class="icon">add</span>
        Add Task
      </button>
    </div>

    <div class="body" :class="{ 'with-panel': showForm }">
      <div class="list-column">
        <section class="card">
          <h2>Active</h2>
          <p v-if="todosStore.active.length === 0" class="empty">No active tasks.</p>
          <ul v-else class="todo-list">
            <li v-for="todo in todosStore.active" :key="todo.id" class="todo">
              <label class="todo__check">
                <input type="checkbox" :checked="todo.done" @change="toggleDone(todo.id, true)" />
              </label>
              <div class="todo__body">
                <strong>{{ todo.title }}</strong>
                <span v-if="todo.description" class="muted">{{ todo.description }}</span>
                <span v-if="todo.assignedToUids.length > 1" class="muted">
                  Assigned to {{ todo.assignedToUids.length }} people
                </span>
                <span
                  v-else-if="todo.assignedToUids[0] !== todo.createdByUid"
                  class="muted"
                >
                  Assigned to {{ todo.assignedToEmails?.[0] || todo.assignedToUids[0] }}
                </span>
                <div v-if="todo.linkedAppIds.length" class="todo__apps">
                  <span v-for="appId in todo.linkedAppIds" :key="appId" class="chip small">
                    {{ appName(appId) }}
                  </span>
                </div>
              </div>
              <button type="button" class="secondary" @click="removeTodo(todo.id)">
                <span class="icon">delete</span>
              </button>
            </li>
          </ul>
        </section>

        <section v-if="todosStore.doneItems.length" class="card">
          <h2>Done</h2>
          <ul class="todo-list">
            <li v-for="todo in todosStore.doneItems" :key="todo.id" class="todo done">
              <label class="todo__check">
                <input type="checkbox" :checked="todo.done" @change="toggleDone(todo.id, false)" />
              </label>
              <div class="todo__body">
                <strong>{{ todo.title }}</strong>
              </div>
              <button type="button" class="secondary" @click="removeTodo(todo.id)">
                <span class="icon">delete</span>
              </button>
            </li>
          </ul>
        </section>
      </div>

      <aside v-if="showForm" class="form-panel">
        <div class="form-panel__header">
          <h2>Add a task</h2>
          <button type="button" class="icon-btn" @click="closeForm">
            <span class="icon">close</span>
          </button>
        </div>

        <label>
          Title
          <input v-model="title" placeholder="e.g. Renew Shiftly contract" />
        </label>
        <label>
          Description (optional)
          <textarea v-model="description" rows="2" placeholder="Any extra detail..." />
        </label>

        <div v-if="authStore.isAdmin" class="assignees">
          <span class="assignees__label">Assign to (optional, admins only - defaults to you)</span>
          <input
            v-model="assigneeSearch"
            type="text"
            placeholder="Search members by name or email..."
          />
          <ul v-if="assigneeSearch" class="assignee-results">
            <li v-if="filteredAssigneeCandidates.length === 0" class="assignee-results__empty">
              No members found.
            </li>
            <li v-for="account in filteredAssigneeCandidates" :key="account.uid">
              <button type="button" @click="addAssignee(account)">
                {{ account.displayName || account.email || account.uid }}
                <span v-if="account.displayName" class="muted">{{ account.email }}</span>
              </button>
            </li>
          </ul>

          <div v-if="selectedAssignees.length" class="assignee-chips">
            <span v-for="account in selectedAssignees" :key="account.uid" class="assignee-chip">
              {{ account.displayName || account.email || account.uid }}
              <button type="button" @click="removeAssignee(account.uid)">
                <span class="icon">close</span>
              </button>
            </span>
          </div>
        </div>

        <div v-if="appsStore.sortedApps.length" class="linked-apps">
          <span class="linked-apps__label">Link to apps (optional)</span>
          <div class="linked-apps__list">
            <button
              v-for="app in appsStore.sortedApps"
              :key="app.id"
              type="button"
              class="chip"
              :class="{ active: linkedAppIds.includes(app.id) }"
              @click="toggleLinkedApp(app.id)"
            >
              {{ app.name }}
            </button>
          </div>
        </div>

        <button type="button" class="primary" :disabled="!title.trim() || creating" @click="addTask">
          {{ creating ? 'Adding...' : 'Add task' }}
        </button>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.content {
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.banner button.primary {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.body {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.list-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 700px;
}

.form-panel {
  width: 340px;
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: sticky;
  top: 1.5rem;
}

.form-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-panel__header h2 {
  font-size: 1.05rem;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
}

.card h2 {
  font-size: 1.05rem;
  margin-bottom: 0.6rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
}

input,
select,
textarea {
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 0.85rem;
  resize: vertical;
}

.assignees {
  margin-bottom: 0.75rem;
}

.assignees__label {
  display: block;
  font-size: 0.78rem;
  margin-bottom: 0.35rem;
  color: var(--text-muted);
}

.assignee-results {
  list-style: none;
  margin: 0.3rem 0 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  max-height: 160px;
  overflow-y: auto;
}

.assignee-results__empty {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.assignee-results button {
  width: 100%;
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: var(--surface-2);
  border: none;
  color: var(--text);
  font-size: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  cursor: pointer;
}

.assignee-results button:hover {
  background: var(--surface-hover);
}

.assignee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
}

.assignee-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.4rem 0.25rem 0.65rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 0.75rem;
}

.assignee-chip button {
  background: none;
  border: none;
  color: inherit;
  padding: 0;
  display: flex;
  cursor: pointer;
}

.assignee-chip .icon {
  font-size: 15px;
}

.linked-apps {
  margin-bottom: 0.75rem;
}

.linked-apps__label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
  color: var(--text-muted);
}

.linked-apps__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 0.75rem;
  cursor: pointer;
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

.chip.small {
  font-size: 0.68rem;
  padding: 0.1rem 0.45rem;
  cursor: default;
}

.empty {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.todo {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.75rem;
  background: var(--surface-2);
  border-radius: 10px;
}

.todo.done {
  opacity: 0.6;
}

.todo.done strong {
  text-decoration: line-through;
}

.todo__check {
  padding-top: 0.15rem;
}

.todo__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.todo__apps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.muted {
  font-size: 0.75rem;
  color: var(--text-muted-2);
}

button {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.82rem;
}

button.primary {
  background: var(--accent);
  color: var(--accent-contrast);
}

button.primary:disabled {
  opacity: 0.5;
  cursor: default;
}

button.secondary {
  background: var(--surface-2);
  color: var(--text);
  display: flex;
  align-items: center;
}

button.secondary .icon {
  font-size: 16px;
}

@media (max-width: 900px) {
  .body.with-panel {
    flex-direction: column;
  }

  .form-panel {
    width: 100%;
    position: static;
  }

  .list-column {
    max-width: none;
  }
}
</style>
