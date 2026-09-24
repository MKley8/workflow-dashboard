<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAdminRequestsStore } from '../stores/adminRequests'
import { useAdminStore } from '../stores/admin'
import { MAX_PENDING_ADMIN_REQUESTS } from '../types/adminRequest'
import type { UserProfile } from '../types/user'

const authStore = useAuthStore()
const requestsStore = useAdminRequestsStore()
const adminStore = useAdminStore()
const router = useRouter()

onMounted(() => {
  if (authStore.user) requestsStore.subscribeMine(authStore.user.uid)
  // Cached after the first call across the whole session (and reused
  // instantly if an admin already has the full account list loaded), so
  // revisiting Settings never re-queries Firestore for this.
  adminStore.loadAdminOnlyProfiles()
})

onUnmounted(() => {
  requestsStore.teardown()
})

// --- Admin lookup + request form ---
const adminSearch = ref('')
const selectedAdmin = ref<UserProfile | null>(null)
const requestMessage = ref('')
const sending = ref(false)
const sendError = ref<string | null>(null)

const filteredAdmins = computed(() => {
  const term = adminSearch.value.trim().toLowerCase()
  if (!term) return adminStore.adminOnlyProfiles
  return adminStore.adminOnlyProfiles.filter((a) => {
    const email = (a.email || '').toLowerCase()
    const name = (a.displayName || '').toLowerCase()
    return email.includes(term) || name.includes(term)
  })
})

function pickAdmin(admin: UserProfile) {
  selectedAdmin.value = admin
  adminSearch.value = admin.displayName || admin.email || ''
}

async function submitRequest() {
  if (!authStore.user || !selectedAdmin.value || !requestMessage.value.trim()) return
  sending.value = true
  sendError.value = null
  try {
    await requestsStore.send({
      fromUid: authStore.user.uid,
      fromEmail: authStore.user.email,
      fromName: authStore.user.displayName,
      toAdminUid: selectedAdmin.value.uid,
      toAdminEmail: selectedAdmin.value.email,
      message: requestMessage.value.trim(),
    })
    requestMessage.value = ''
    selectedAdmin.value = null
    adminSearch.value = ''
  } catch (err) {
    sendError.value = err instanceof Error ? err.message : 'Failed to send request.'
  } finally {
    sending.value = false
  }
}

async function removeRequest(requestId: string) {
  await requestsStore.remove(requestId)
}

// --- Delete account ---
const showDeleteConfirm = ref(false)
const deleteConfirmEmail = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const canConfirmDelete = computed(
  () => deleteConfirmEmail.value.trim().toLowerCase() === (authStore.user?.email || '').toLowerCase(),
)

async function deleteAccount() {
  if (!canConfirmDelete.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await authStore.deleteAccount()
    router.replace({ name: 'login' })
  } catch (err) {
    const code = (err as { code?: string })?.code
    if (code === 'auth/requires-recent-login') {
      deleteError.value =
        'For security, please sign out and sign back in, then try deleting your account again.'
    } else {
      deleteError.value = err instanceof Error ? err.message : 'Failed to delete account.'
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="content">
    <h1>Settings</h1>

    <section class="card">
      <h2>Account</h2>
      <p class="account-line">
        <strong>{{ authStore.user?.displayName || 'No name set' }}</strong>
        <span class="muted">{{ authStore.user?.email }}</span>
      </p>
    </section>

    <section class="card">
      <h2>Request an admin</h2>
      <p class="hint">
        Send a message to any admin (e.g. to request admin access, or ask for a layout
        change). You can have up to {{ MAX_PENDING_ADMIN_REQUESTS }} pending requests at a
        time - delete one below to free up a slot, or wait for an admin to mark it read.
      </p>

      <label>
        Admin
        <input
          v-model="adminSearch"
          type="text"
          placeholder="Search admins by name or email..."
          @focus="selectedAdmin = null"
        />
      </label>
      <ul v-if="adminSearch && !selectedAdmin" class="admin-results">
        <li v-if="filteredAdmins.length === 0" class="admin-results__empty">No admins found.</li>
        <li v-for="admin in filteredAdmins" :key="admin.uid">
          <button type="button" @click="pickAdmin(admin)">
            {{ admin.displayName || admin.email || admin.uid }}
            <span v-if="admin.displayName" class="muted">{{ admin.email }}</span>
          </button>
        </li>
      </ul>

      <label>
        Message
        <textarea v-model="requestMessage" rows="3" placeholder="What do you need from an admin?" />
      </label>

      <p v-if="!requestsStore.canSendMore" class="warning">
        You have {{ requestsStore.pendingMineCount }} pending requests, the max allowed.
        Delete one below to send a new one.
      </p>
      <p v-if="sendError" class="warning">{{ sendError }}</p>

      <button
        type="button"
        class="primary"
        :disabled="!selectedAdmin || !requestMessage.trim() || !requestsStore.canSendMore || sending"
        @click="submitRequest"
      >
        {{ sending ? 'Sending...' : 'Send request' }}
      </button>

      <ul v-if="requestsStore.mine.length" class="requests-list">
        <li v-for="request in requestsStore.mine" :key="request.id" class="request">
          <div class="request__body">
            <p>{{ request.message }}</p>
            <span class="muted">To: {{ request.toAdminEmail || request.toAdminUid }}</span>
          </div>
          <span class="tag" :class="{ read: request.read }">
            {{ request.read ? 'Read' : 'Pending' }}
          </span>
          <button type="button" class="secondary" @click="removeRequest(request.id)">Delete</button>
        </li>
      </ul>
    </section>

    <section class="card danger-zone">
      <h2>Delete account</h2>
      <p class="hint">
        This permanently deletes your account and all of its data. This cannot be undone.
      </p>
      <button type="button" class="danger" @click="showDeleteConfirm = true">
        Delete my account
      </button>
    </section>

    <div v-if="showDeleteConfirm" class="overlay" @click.self="showDeleteConfirm = false">
      <div class="modal">
        <h2>Delete your account?</h2>
        <p class="hint">
          Type your email address (<strong>{{ authStore.user?.email }}</strong
          >) to confirm. This will permanently delete your profile, dashboard layout, and
          pending requests, and cannot be undone.
        </p>
        <input v-model="deleteConfirmEmail" type="email" placeholder="Confirm your email" />
        <p v-if="deleteError" class="warning">{{ deleteError }}</p>
        <div class="actions">
          <button type="button" class="secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button type="button" class="danger" :disabled="!canConfirmDelete || deleting" @click="deleteAccount">
            {{ deleting ? 'Deleting...' : 'Permanently delete' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.content {
  padding: 1.5rem;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
}

.card h2 {
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0 0 0.85rem;
}

.account-line {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.muted {
  color: var(--text-muted-2);
  font-size: 0.8rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
}

input,
textarea {
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-size: 0.85rem;
  resize: vertical;
}

.admin-results {
  list-style: none;
  margin: -0.4rem 0 0.6rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  max-height: 160px;
  overflow-y: auto;
}

.admin-results__empty {
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.admin-results button {
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

.admin-results button:hover {
  background: var(--surface-hover);
}

.warning {
  color: #fbbf77;
  font-size: 0.8rem;
  margin: 0 0 0.6rem;
}

.requests-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 1rem 0 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.request {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.7rem;
  background: var(--surface-2);
  border-radius: 10px;
  flex-wrap: wrap;
}

.request__body {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.request__body p {
  margin: 0;
  font-size: 0.85rem;
}

.tag {
  font-size: 0.68rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.22);
  color: var(--accent-2);
}

.tag.read {
  background: var(--surface-hover);
  color: var(--text-muted);
}

.danger-zone {
  border-color: rgba(248, 113, 113, 0.3);
}

button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
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
}

button.danger {
  background: rgba(248, 113, 113, 0.15);
  color: var(--danger);
}

button.danger:disabled {
  opacity: 0.5;
  cursor: default;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 200;
}

.modal {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal input {
  margin-bottom: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.actions button.secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
</style>
