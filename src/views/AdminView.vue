<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import EditUserLayoutModal from '../components/EditUserLayoutModal.vue'
import { useAdminStore } from '../stores/admin'
import { useAuthStore } from '../stores/auth'
import { useAdminRequestsStore } from '../stores/adminRequests'
import type { UserProfile } from '../types/user'

const adminStore = useAdminStore()
const authStore = useAuthStore()
const requestsStore = useAdminRequestsStore()

const search = ref('')
const editingAccount = ref<UserProfile | null>(null)
const activeTab = ref<'accounts' | 'requests'>('accounts')

onMounted(() => {
  adminStore.loadAccounts()
  requestsStore.subscribeAll()
})

onUnmounted(() => {
  requestsStore.teardown()
})

const filteredAccounts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return adminStore.accounts
  return adminStore.accounts.filter((account) => {
    const email = (account.email || '').toLowerCase()
    const name = (account.displayName || '').toLowerCase()
    return email.includes(term) || name.includes(term)
  })
})

async function toggleAdmin(account: UserProfile) {
  const isSelf = account.uid === authStore.user?.uid
  if (isSelf && account.isAdmin) {
    const confirmed = confirm(
      'This will remove your own admin access. Continue only if another admin can restore it later. Continue?',
    )
    if (!confirmed) return
  }
  await adminStore.setAdmin(account.uid, !account.isAdmin)
}

function openLayoutEditor(account: UserProfile) {
  editingAccount.value = account
}

async function markRead(requestId: string) {
  if (!authStore.user) return
  await requestsStore.markRead(requestId, authStore.user.uid)
}

// --- Delete account (admin-initiated) ---
const deletingAccount = ref<UserProfile | null>(null)
const deleteConfirmEmail = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const canConfirmDelete = computed(
  () => deleteConfirmEmail.value.trim().toLowerCase() === (deletingAccount.value?.email || '').toLowerCase(),
)

function openDeleteConfirm(account: UserProfile) {
  deletingAccount.value = account
  deleteConfirmEmail.value = ''
  deleteError.value = null
}

function closeDeleteConfirm() {
  deletingAccount.value = null
}

async function confirmDeleteAccount() {
  if (!deletingAccount.value || !canConfirmDelete.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await adminStore.deleteAccount(deletingAccount.value.uid)
    deletingAccount.value = null
  } catch (err) {
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete account.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <main class="content">
    <h1>Admin</h1>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: activeTab === 'accounts' }"
        @click="activeTab = 'accounts'"
      >
        Accounts
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'requests' }"
        @click="activeTab = 'requests'"
      >
        Requests
        <span v-if="requestsStore.pendingAllCount" class="badge">{{ requestsStore.pendingAllCount }}</span>
      </button>
    </div>

    <template v-if="activeTab === 'accounts'">
      <p class="hint">
        Search for an account and manage its admin access or dashboard layout. Only admins
        can see this screen.
      </p>

      <input v-model="search" class="search" type="search" placeholder="Search by name or email..." />

      <p v-if="adminStore.loading" class="status">Loading accounts...</p>
      <p v-else-if="adminStore.error" class="status error">{{ adminStore.error }}</p>
      <p v-else-if="filteredAccounts.length === 0" class="status">No accounts match your search.</p>

      <ul v-else class="list">
        <li v-for="account in filteredAccounts" :key="account.uid" class="row">
          <div class="info">
            <div class="info__names">
              <strong>{{ account.displayName || account.email || account.uid }}</strong>
              <span v-if="account.displayName" class="muted">{{ account.email }}</span>
            </div>
            <span v-if="account.uid === authStore.user?.uid" class="you">You</span>
          </div>
          <span class="tag" :class="{ admin: account.isAdmin }">
            {{ account.isAdmin ? 'Admin' : 'Member' }}
          </span>
          <button class="secondary" @click="openLayoutEditor(account)">Edit Layout</button>
          <button class="secondary" @click="toggleAdmin(account)">
            {{ account.isAdmin ? 'Remove admin' : 'Make admin' }}
          </button>
          <button
            v-if="!account.isAdmin && account.uid !== authStore.user?.uid"
            class="danger"
            @click="openDeleteConfirm(account)"
          >
            Delete
          </button>
        </li>
      </ul>
    </template>

    <template v-else>
      <p class="hint">
        Requests sent by any account. Marking one as read frees up that account's request
        slot (they can have up to 5 pending at a time).
      </p>

      <p v-if="requestsStore.all.length === 0" class="status">No requests yet.</p>
      <ul v-else class="list">
        <li v-for="request in requestsStore.all" :key="request.id" class="row">
          <div class="info">
            <div class="info__names">
              <strong>{{ request.fromName || request.fromEmail || request.fromUid }}</strong>
              <span class="muted">{{ request.message }}</span>
            </div>
          </div>
          <span class="tag" :class="{ admin: !request.read }">
            {{ request.read ? 'Read' : 'Pending' }}
          </span>
          <button v-if="!request.read" class="secondary" @click="markRead(request.id)">
            Mark as read
          </button>
        </li>
      </ul>
    </template>

    <EditUserLayoutModal
      v-if="editingAccount"
      :uid="editingAccount.uid"
      :email="editingAccount.email"
      @close="editingAccount = null"
    />

    <div v-if="deletingAccount" class="overlay" @click.self="closeDeleteConfirm">
      <div class="modal">
        <h2>Delete this account?</h2>
        <p class="hint">
          Type this account's email (<strong>{{ deletingAccount.email }}</strong
          >) to confirm. This permanently deletes their profile, dashboard layout, and
          pending requests, and cannot be undone. Note: this doesn't remove their sign-in
          access - if they sign in again afterward, a fresh blank profile is created.
        </p>
        <input v-model="deleteConfirmEmail" type="email" placeholder="Confirm their email" />
        <p v-if="deleteError" class="warning">{{ deleteError }}</p>
        <div class="actions">
          <button type="button" class="secondary" @click="closeDeleteConfirm">Cancel</button>
          <button
            type="button"
            class="danger"
            :disabled="!canConfirmDelete || deleting"
            @click="confirmDeleteAccount"
          >
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
  max-width: 900px;
  margin: 0 auto;
}

.hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0.2rem 0 0.85rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin: 0.6rem 0 0.85rem;
}

.tabs button {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.tabs button.active {
  background: var(--accent);
  color: var(--accent-contrast);
  border-color: transparent;
}

.badge {
  background: var(--danger);
  color: #fff;
  font-size: 0.65rem;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
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

.status.error {
  color: var(--danger);
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

.info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 160px;
}

.info__names {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.muted {
  font-size: 0.75rem;
  color: var(--text-muted-2);
}

.you {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
}

.tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
}

.tag.admin {
  background: rgba(99, 102, 241, 0.22);
  color: var(--accent-2);
}

button {
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: background-color 0.15s ease;
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

button.danger:hover {
  background: rgba(248, 113, 113, 0.25);
}

button.danger:disabled {
  opacity: 0.5;
  cursor: default;
}

.warning {
  color: #fbbf77;
  font-size: 0.8rem;
  margin: 0 0 0.6rem;
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
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
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
