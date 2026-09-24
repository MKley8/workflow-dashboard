<script setup lang="ts">
import { computed } from 'vue'
import { useAppsStore } from '../stores/apps'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { isNativePlatform } from '../services/platformRedirect'
import type { WorkflowApp } from '../types/app'

const props = defineProps<{ app: WorkflowApp }>()
const appsStore = useAppsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()

const initials = computed(() =>
  props.app.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

/** The Google account or username/email stored for signing in to this app, if any. */
const loginHint = computed(() => {
  if (props.app.loginMethod === 'google') return authStore.linkedGoogleEmail
  return props.app.loginUsername || null
})

function launch() {
  appsStore.launch(props.app)
}

async function copyLoginHint() {
  if (!loginHint.value) return
  try {
    await navigator.clipboard.writeText(loginHint.value)
    toastStore.show(`Copied "${loginHint.value}" to clipboard`)
  } catch {
    toastStore.show('Could not copy to clipboard')
  }
}
</script>

<template>
  <button class="tile" :style="{ '--accent': app.color || '#4a5568' }" @click="launch">
    <span class="tile__icon">
      <img v-if="app.iconUrl" :src="app.iconUrl" :alt="app.name" />
      <span v-else class="tile__monogram">{{ initials }}</span>
    </span>
    <span class="tile__name">{{ app.name }}</span>
    <span v-if="app.description" class="tile__desc">{{ app.description }}</span>
    <span
      v-if="loginHint"
      class="tile__login"
      :title="`Copy sign-in ${app.loginMethod === 'google' ? 'account' : 'username'} to clipboard`"
      @click.stop="copyLoginHint"
    >
      <span class="tile__login-icon">{{ app.loginMethod === 'google' ? 'G' : '👤' }}</span>
      <span class="tile__login-text">{{ loginHint }}</span>
    </span>
    <span v-if="isNativePlatform()" class="tile__badge">Open app</span>
  </button>
</template>

<style scoped>
.tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(160deg, color-mix(in srgb, var(--accent) 22%, #14181f), #14181f 70%);
  color: #f5f6fa;
  cursor: pointer;
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  min-height: 140px;
  justify-content: center;
}

.tile:hover,
.tile:focus-visible {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  outline: none;
}

.tile__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tile__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile__monogram {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.tile__name {
  font-weight: 600;
  font-size: 1rem;
}

.tile__desc {
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.7);
}

.tile__badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tile__login {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  max-width: 100%;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.65rem;
  color: rgba(245, 246, 250, 0.75);
  cursor: pointer;
}

.tile__login:hover {
  background: rgba(255, 255, 255, 0.16);
}

.tile__login-icon {
  font-weight: 700;
}

.tile__login-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}
</style>
