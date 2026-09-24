<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTodosStore } from '../stores/todos'
import { useAdminRequestsStore } from '../stores/adminRequests'
import { currentPlatform } from '../services/platformRedirect'

const authStore = useAuthStore()
const todosStore = useTodosStore()
const adminRequestsStore = useAdminRequestsStore()
const route = useRoute()
const router = useRouter()

/** Whether the mobile drawer is open; irrelevant/ignored on desktop widths. */
const open = ref(false)
/** Whether the "Active Tasks" dropdown is expanded; on by default. */
const tasksExpanded = ref(true)

onMounted(() => {
  if (authStore.user) todosStore.subscribe(authStore.user.uid)
  if (authStore.isAdmin) adminRequestsStore.subscribeAll()
})

// Subscribe to the admin request inbox as soon as admin status resolves
// (e.g. after the profile loads post sign-in), so the badge shows up
// without needing to visit the Admin page first.
watch(
  () => authStore.isAdmin,
  (isAdmin) => {
    if (isAdmin) adminRequestsStore.subscribeAll()
  },
)

// Close the mobile drawer automatically after navigating anywhere.
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

const navItems = computed(() => [
  { to: '/', name: 'dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/manage', name: 'manage', label: 'Manage Apps', icon: 'extension' },
  ...(authStore.isAdmin
    ? [
        {
          to: '/admin',
          name: 'admin',
          label: 'Admin',
          icon: 'admin_panel_settings',
          badge: adminRequestsStore.pendingAllCount,
        },
      ]
    : []),
  { to: '/todos', name: 'todos', label: 'To-Do', icon: 'checklist', badge: todosStore.active.length },
  { to: '/settings', name: 'settings', label: 'Settings', icon: 'settings' },
])

async function toggleTaskDone(id: string) {
  await todosStore.setDone(id, true)
}

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <button
    class="menu-toggle"
    type="button"
    :aria-expanded="open"
    aria-label="Toggle navigation menu"
    @click="open = !open"
  >
    <span />
    <span />
    <span />
  </button>
  <div v-if="open" class="backdrop" @click="open = false" />

  <aside class="sidebar" :class="{ open }">
    <div class="brand">
      <span class="brand__logo">WF</span>
      <div class="brand__text">
        <strong>Workflow</strong>
        <span>Dashboard</span>
      </div>
    </div>

    <nav class="nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="item.to"
        class="nav__item"
        :class="{ active: route.name === item.name }"
      >
        <span class="icon nav__icon">{{ item.icon }}</span>
        {{ item.label }}
        <span v-if="item.badge" class="nav__badge">{{ item.badge }}</span>
      </RouterLink>
    </nav>

    <div class="tasks">
      <button type="button" class="tasks__header" @click="tasksExpanded = !tasksExpanded">
        <span class="icon">checklist</span>
        Active Tasks
        <span v-if="todosStore.active.length" class="tasks__count">{{ todosStore.active.length }}</span>
        <span class="icon tasks__chevron" :class="{ collapsed: !tasksExpanded }">expand_more</span>
      </button>
      <ul v-if="tasksExpanded" class="tasks__list">
        <li v-if="todosStore.active.length === 0" class="tasks__empty">No active tasks.</li>
        <li v-for="task in todosStore.active" :key="task.id" class="tasks__item">
          <input type="checkbox" @change="toggleTaskDone(task.id)" />
          <span class="tasks__title">{{ task.title }}</span>
        </li>
      </ul>
    </div>

    <div class="sidebar__footer">
      <span class="platform-badge">{{ currentPlatform() }}</span>
      <button v-if="authStore.isSignedIn" class="logout" @click="logout">Sign out</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 232px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.25rem 1rem;
  gap: 1.5rem;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.25rem;
}

.brand__logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--accent-contrast);
  flex-shrink: 0;
}

.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand__text span {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav__item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav__item:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.nav__item.active {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.nav__icon {
  font-size: 20px;
  width: 1.25rem;
  text-align: center;
}

.nav__badge {
  margin-left: auto;
  background: var(--danger);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.nav__item.active .nav__badge {
  background: rgba(255, 255, 255, 0.3);
}

.tasks {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-top: 1px solid var(--border);
  padding-top: 0.6rem;
  margin-top: 0.4rem;
}

.tasks__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
  border-radius: 8px;
}

.tasks__header:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.tasks__header .icon:first-child {
  font-size: 16px;
}

.tasks__count {
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.05rem 0.4rem;
  border-radius: 999px;
}

.tasks__chevron {
  margin-left: auto;
  font-size: 18px;
  transition: transform 0.15s ease;
}

.tasks__chevron.collapsed {
  transform: rotate(-90deg);
}

.tasks__list {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow-y: auto;
  min-height: 0;
}

.tasks__empty {
  padding: 0.4rem 0.5rem;
  font-size: 0.78rem;
  color: var(--text-muted-2);
}

.tasks__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  font-size: 0.82rem;
}

.tasks__item:hover {
  background: var(--surface-hover);
}

.tasks__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.platform-badge {
  align-self: flex-start;
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.logout {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  padding: 0.5rem 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background-color 0.15s ease;
}

.logout:hover {
  background: var(--surface-hover);
}

.menu-toggle {
  display: none;
}

.backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .menu-toggle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    position: fixed;
    top: 0.75rem;
    left: 0.75rem;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    z-index: 110;
    cursor: pointer;
  }

  .menu-toggle span {
    width: 18px;
    height: 2px;
    background: var(--text);
    border-radius: 999px;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
}
</style>
