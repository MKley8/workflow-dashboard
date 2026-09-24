<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAppsStore } from '../stores/apps'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { useTodosStore } from '../stores/todos'
import { useDashboardLayoutStore } from '../stores/dashboardLayout'
import { isNativePlatform } from '../services/platformRedirect'
import { faviconUrlFor } from '../utils/favicon'
import type { WorkflowApp } from '../types/app'

const props = defineProps<{ app: WorkflowApp }>()
const appsStore = useAppsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const todosStore = useTodosStore()
const layoutStore = useDashboardLayoutStore()

const initials = computed(() =>
  props.app.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

// Prefer an explicitly set icon; otherwise auto-detect the site's favicon.
// Reset the failure flag whenever the underlying icon/url changes so a
// previously broken image gets a fresh chance to load.
const iconFailed = ref(false)
watch(
  () => [props.app.iconUrl, props.app.url],
  () => {
    iconFailed.value = false
  },
)

const iconSrc = computed(() => {
  if (iconFailed.value) return null
  return props.app.iconUrl || faviconUrlFor(props.app.url)
})

/** The Google account or username/email stored for signing in to this app, if any. */
const loginHint = computed(() => {
  if (props.app.loginMethod === 'google') return authStore.linkedGoogleEmail
  return props.app.loginUsername || null
})

/** Active (not-done) to-do items linked to this app, shown in a hover preview. */
const linkedTodos = computed(() => todosStore.activeByAppId[props.app.id] || [])

// The tasks tooltip normally opens above the tile; if there isn't enough
// room above it (e.g. the tile is near the top of the page), it flips to
// open below instead so it never overflows off-screen.
const tileRef = ref<HTMLButtonElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)
const tooltipBelow = ref(false)

function updateTooltipPlacement() {
  const tileEl = tileRef.value
  const tooltipEl = tooltipRef.value
  if (!tileEl || !tooltipEl) return
  const tileRect = tileEl.getBoundingClientRect()
  const tooltipHeight = tooltipEl.offsetHeight
  tooltipBelow.value = tileRect.top < tooltipHeight + 16
}

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
  <button
    ref="tileRef"
    class="tile"
    :style="{ '--app-accent': app.color || 'var(--accent)' }"
    @click="launch"
    @mouseenter="updateTooltipPlacement"
    @focus="updateTooltipPlacement"
  >
    <span v-if="linkedTodos.length" class="tile__todo-dot" :title="`${linkedTodos.length} active task(s)`" />
    <span class="tile__icon">
      <img v-if="iconSrc" :src="iconSrc" :alt="app.name" @error="iconFailed = true" />
      <span v-else class="tile__monogram">{{ initials }}</span>
    </span>
    <span class="tile__name">{{ app.name }}</span>
    <span v-if="layoutStore.showDescriptions && app.description" class="tile__desc">{{ app.description }}</span>
    <span
      v-if="loginHint"
      class="tile__login"
      :title="`Copy sign-in ${app.loginMethod === 'google' ? 'account' : 'username'} to clipboard`"
      @click.stop="copyLoginHint"
    >
      <span class="icon tile__login-icon">{{ app.loginMethod === 'google' ? 'account_circle' : 'person' }}</span>
      <span class="tile__login-text">{{ loginHint }}</span>
    </span>
    <span v-if="isNativePlatform()" class="tile__badge">Open app</span>

    <div v-if="linkedTodos.length" ref="tooltipRef" class="tile__todos-tooltip" :class="{ 'tile__todos-tooltip--below': tooltipBelow }">
      <strong>Active tasks</strong>
      <ul>
        <li v-for="todo in linkedTodos" :key="todo.id">{{ todo.title }}</li>
      </ul>
    </div>
  </button>
</template>

<style scoped>
.tile {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--tile-padding, 1.1rem 0.9rem);
  border-radius: 16px;
  border: 1px solid var(--border);
  background: linear-gradient(160deg, color-mix(in srgb, var(--app-accent) 20%, var(--surface)), var(--surface) 70%);
  color: var(--text);
  cursor: pointer;
  text-align: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  min-height: var(--tile-min-height, 128px);
  justify-content: center;
}

.tile:hover,
.tile:focus-visible {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: var(--app-accent);
  outline: none;
  /* Raise the whole tile (its transform already makes it a stacking
     context) above every sibling tile, so the tasks tooltip - which lives
     inside it - isn't painted behind neighboring tiles in the grid. */
  z-index: 30;
}

.tile__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--app-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.tile__icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tile__monogram {
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
}

.tile__name {
  font-weight: 600;
  font-size: 0.95rem;
}

.tile__desc {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.tile__badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  border-radius: 999px;
  background: var(--surface-hover);
  color: var(--text-muted);
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
  background: var(--surface-hover);
  font-size: 0.65rem;
  color: var(--text-muted);
  cursor: pointer;
}

.tile__login:hover {
  filter: brightness(1.15);
}

.tile__login-icon {
  font-size: 14px;
}

.tile__login-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.tile__todo-dot {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-2);
  box-shadow: 0 0 0 2px var(--surface);
}

.tile__todos-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.6rem 0.75rem;
  box-shadow: var(--shadow);
  min-width: 160px;
  max-width: 220px;
  text-align: left;
  z-index: 20;
  font-size: 0.75rem;
}

.tile:hover .tile__todos-tooltip {
  display: block;
}

.tile__todos-tooltip--below {
  bottom: auto;
  top: calc(100% + 8px);
}

.tile__todos-tooltip strong {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
}

.tile__todos-tooltip ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tile__todos-tooltip li {
  position: relative;
  padding-left: 0.85em;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

.tile__todos-tooltip li::before {
  content: '-';
  position: absolute;
  left: 0;
}
</style>
