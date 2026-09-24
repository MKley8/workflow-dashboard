<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { AppCategory, WorkflowApp, WorkflowAppInput } from '../types/app'
import { useAuthStore } from '../stores/auth'
import { faviconUrlFor } from '../utils/favicon'

const props = defineProps<{ app?: WorkflowApp | null; restricted?: boolean }>()
const emit = defineEmits<{
  save: [input: WorkflowAppInput]
  close: []
}>()

const authStore = useAuthStore()

const categories: AppCategory[] = [
  'Scheduling',
  'HR',
  'Productivity',
  'Shopping',
  'Recruitment',
  'Compliance',
  'Operations',
  'Verification',
  'Other',
]

const form = reactive<WorkflowAppInput>({
  name: '',
  description: '',
  url: '',
  iconUrl: '',
  color: '#4f46e5',
  category: 'Other',
  iosScheme: '',
  iosAppStoreId: '',
  androidPackage: '',
  androidScheme: '',
  androidPlayStoreId: '',
  order: 0,
  enabled: true,
  loginMethod: 'manual',
  loginUsername: '',
  googleAuthUrl: '',
  ownerIsAdmin: false,
})

watch(
  () => props.app,
  (app) => {
    Object.assign(form, {
      name: app?.name ?? '',
      description: app?.description ?? '',
      url: app?.url ?? '',
      iconUrl: app?.iconUrl ?? '',
      color: app?.color ?? '#4f46e5',
      category: app?.category ?? 'Other',
      iosScheme: app?.iosScheme ?? '',
      iosAppStoreId: app?.iosAppStoreId ?? '',
      androidPackage: app?.androidPackage ?? '',
      androidScheme: app?.androidScheme ?? '',
      androidPlayStoreId: app?.androidPlayStoreId ?? '',
      order: app?.order ?? 0,
      enabled: app?.enabled ?? true,
      loginMethod: app?.loginMethod ?? 'manual',
      loginUsername: app?.loginUsername ?? '',
      googleAuthUrl: app?.googleAuthUrl ?? '',
      ownerIsAdmin: app?.ownerIsAdmin ?? false,
    })
  },
  { immediate: true },
)

function submit() {
  if (!form.name.trim() || !form.url.trim()) return
  emit('save', { ...form })
}

/** Preview of the icon that will actually be shown: explicit iconUrl, or the auto-detected favicon. */
const iconPreviewSrc = computed(() => form.iconUrl || faviconUrlFor(form.url))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form class="modal" @submit.prevent="submit">
      <h2>{{ app ? 'Edit App' : 'Add App' }}</h2>

      <p v-if="restricted" class="restricted-notice">
        You can rename this app and change its sign-in method, but only an admin can change
        its other details or remove it. You can still hide it from just your own dashboard
        from the Manage Apps list.
      </p>

      <label>Name<input v-model="form.name" required placeholder="e.g. Shiftly" /></label>
      <label>URL<input v-model="form.url" required placeholder="https://..." :disabled="restricted" /></label>
      <label>
        Description
        <input v-model="form.description" placeholder="Short description" :disabled="restricted" />
      </label>
      <label>
        Category
        <select v-model="form.category" :disabled="restricted">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <label>Brand colour<input v-model="form.color" type="color" :disabled="restricted" /></label>
      <label>
        Icon URL (optional)
        <input v-model="form.iconUrl" placeholder="https://.../icon.png" :disabled="restricted" />
      </label>
      <p class="hint-small">
        Leave blank to auto-detect the site's favicon from its URL.
      </p>
      <div v-if="iconPreviewSrc" class="icon-preview">
        <img :src="iconPreviewSrc" alt="Icon preview" />
        <span>Preview</span>
      </div>

      <fieldset>
        <legend>Sign-in method</legend>
        <div class="segmented">
          <button
            type="button"
            :class="{ active: form.loginMethod !== 'google' }"
            @click="form.loginMethod = 'manual'"
          >
            Username / Email
          </button>
          <button
            type="button"
            :class="{ active: form.loginMethod === 'google' }"
            @click="form.loginMethod = 'google'"
          >
            Sign in with Google
          </button>
        </div>

        <template v-if="form.loginMethod === 'google'">
          <p v-if="authStore.linkedGoogleEmail" class="google-hint">
            Will use your Google account: <strong>{{ authStore.linkedGoogleEmail }}</strong>
          </p>
          <p v-else class="google-hint warning">
            You're not currently signed in to the dashboard with Google, so no account is
            linked yet. Sign out and sign back in with Google, or use "Username / Email"
            instead.
          </p>

          <label>
            Google OAuth URL (optional)
            <input
              v-model="form.googleAuthUrl"
              placeholder="https://accounts.google.com/o/oauth2/v2/auth?..."
              :disabled="restricted"
            />
          </label>
          <p class="google-hint">
            If set, launching this app skips its login page and jumps straight to Google's
            sign-in screen. Capture this URL from the site's own "Sign in with Google" button
            (browser dev tools -> Network tab, right-click the request -> Copy URL). Some
            sites tie the <code>state</code> value to a short-lived session, so this may need
            refreshing occasionally if sign-in starts failing.
          </p>
        </template>

        <label v-else>
          Username / email for this app
          <input v-model="form.loginUsername" placeholder="jane.doe@company.com" />
        </label>
      </fieldset>

      <fieldset>
        <legend>Native app redirect (optional)</legend>
        <label>iOS URL scheme<input v-model="form.iosScheme" placeholder="myapp://" :disabled="restricted" /></label>
        <label>
          iOS App Store id
          <input v-model="form.iosAppStoreId" placeholder="id123456789" :disabled="restricted" />
        </label>
        <label>
          Android package
          <input v-model="form.androidPackage" placeholder="com.example.app" :disabled="restricted" />
        </label>
        <label>
          Android Play Store id
          <input v-model="form.androidPlayStoreId" placeholder="com.example.app" :disabled="restricted" />
        </label>
      </fieldset>

      <label class="row">
        <input v-model="form.enabled" type="checkbox" :disabled="restricted" /> Enabled
      </label>

      <div class="actions">
        <button type="button" class="secondary" @click="emit('close')">Cancel</button>
        <button type="submit">Save</button>
      </div>
    </form>
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
  background: var(--surface);
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

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

label.row {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

input,
select {
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
}

input:disabled,
select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input[type='color'] {
  padding: 0.2rem;
  height: 2.25rem;
}

.restricted-notice {
  font-size: 0.8rem;
  color: var(--accent-2);
  background: rgba(99, 102, 241, 0.12);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  margin: 0;
}

fieldset {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

legend {
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 0 0.25rem;
}

.segmented {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.segmented button {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}

.segmented button.active {
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
}

.google-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.4;
}

.google-hint.warning {
  color: #fbbf77;
}

.hint-small {
  font-size: 0.7rem;
  color: var(--text-muted-2);
  margin: -0.4rem 0 0;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.icon-preview img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--surface-2);
  object-fit: contain;
  padding: 4px;
  box-sizing: border-box;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: var(--accent-contrast);
  cursor: pointer;
  font-weight: 600;
}

button.secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
</style>
