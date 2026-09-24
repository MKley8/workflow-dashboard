<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { currentPlatform } from '../services/platformRedirect'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

async function logout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="nav">
    <div class="nav__brand">
      <span class="nav__logo">WF</span>
      <span>Workflow Dashboard</span>
      <span class="nav__platform">{{ currentPlatform() }}</span>
    </div>
    <nav class="nav__links">
      <RouterLink to="/" :class="{ active: route.name === 'dashboard' }">Dashboard</RouterLink>
      <RouterLink to="/manage" :class="{ active: route.name === 'manage' }">Manage Apps</RouterLink>
      <RouterLink v-if="authStore.isAdmin" to="/admin" :class="{ active: route.name === 'admin' }">
        Admin
      </RouterLink>
      <button v-if="authStore.isSignedIn" class="nav__logout" @click="logout">Sign out</button>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.nav__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
}

.nav__logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.nav__platform {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  font-weight: 500;
}

.nav__links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav__links a {
  color: rgba(245, 246, 250, 0.75);
  text-decoration: none;
  font-size: 0.9rem;
}

.nav__links a.active {
  color: #fff;
  font-weight: 600;
}

.nav__logout {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
}
</style>
