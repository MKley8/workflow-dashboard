<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import EditUserLayoutModal from '../components/EditUserLayoutModal.vue'
import { useAdminStore } from '../stores/admin'
import { useAuthStore } from '../stores/auth'
import type { UserProfile } from '../types/user'

const adminStore = useAdminStore()
const authStore = useAuthStore()

const search = ref('')
const editingAccount = ref<UserProfile | null>(null)

onMounted(() => {
  adminStore.loadAccounts()
})

const filteredAccounts = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return adminStore.accounts
  return adminStore.accounts.filter((account) => (account.email || '').toLowerCase().includes(term))
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
</script>

<template>
  <div class="page">
    <NavBar />
    <main class="content">
      <h1>Admin</h1>
      <p class="hint">
        Search for an account and manage its admin access or dashboard layout. Only admins can
        see this screen.
      </p>

      <input v-model="search" class="search" type="search" placeholder="Search by email..." />

      <p v-if="adminStore.loading" class="status">Loading accounts...</p>
      <p v-else-if="adminStore.error" class="status error">{{ adminStore.error }}</p>
      <p v-else-if="filteredAccounts.length === 0" class="status">No accounts match your search.</p>

      <ul v-else class="list">
        <li v-for="account in filteredAccounts" :key="account.uid" class="row">
          <div class="info">
            <strong>{{ account.email || account.uid }}</strong>
            <span v-if="account.uid === authStore.user?.uid" class="you">You</span>
          </div>
          <span class="tag" :class="{ admin: account.isAdmin }">
            {{ account.isAdmin ? 'Admin' : 'Member' }}
          </span>
          <button class="secondary" @click="openLayoutEditor(account)">Edit Layout</button>
          <button class="secondary" @click="toggleAdmin(account)">
            {{ account.isAdmin ? 'Remove admin' : 'Make admin' }}
          </button>
        </li>
      </ul>
    </main>

    <EditUserLayoutModal
      v-if="editingAccount"
      :uid="editingAccount.uid"
      :email="editingAccount.email"
      @close="editingAccount = null"
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

.hint {
  color: rgba(245, 246, 250, 0.6);
  font-size: 0.85rem;
  margin: 0.25rem 0 1rem;
}

.search {
  width: 100%;
  max-width: 320px;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #10141c;
  color: inherit;
  margin-bottom: 1.25rem;
}

.status {
  padding: 1rem 0;
  color: rgba(245, 246, 250, 0.7);
}

.status.error {
  color: #f87171;
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

.info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 160px;
}

.you {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
}

.tag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.tag.admin {
  background: rgba(79, 70, 229, 0.25);
  color: #a5b4fc;
}

button {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

button.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}
</style>
