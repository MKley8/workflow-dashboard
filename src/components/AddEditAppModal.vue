<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { AppCategory, WorkflowApp, WorkflowAppInput } from '../types/app'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ app?: WorkflowApp | null }>()
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
    })
  },
  { immediate: true },
)

function submit() {
  if (!form.name.trim() || !form.url.trim()) return
  emit('save', { ...form })
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form class="modal" @submit.prevent="submit">
      <h2>{{ app ? 'Edit App' : 'Add App' }}</h2>

      <label>Name<input v-model="form.name" required placeholder="e.g. Team Chat" /></label>
      <label>URL<input v-model="form.url" required placeholder="https://..." /></label>
      <label>Description<input v-model="form.description" placeholder="Short description" /></label>
      <label>
        Category
        <select v-model="form.category">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <label>Brand colour<input v-model="form.color" type="color" /></label>
      <label>Icon URL<input v-model="form.iconUrl" placeholder="https://.../icon.png" /></label>

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
        <label>iOS URL scheme<input v-model="form.iosScheme" placeholder="myapp://" /></label>
        <label>iOS App Store id<input v-model="form.iosAppStoreId" placeholder="id123456789" /></label>
        <label>Android package<input v-model="form.androidPackage" placeholder="com.example.app" /></label>
        <label>Android Play Store id<input v-model="form.androidPlayStoreId" placeholder="com.example.app" /></label>
      </fieldset>

      <label class="row"><input v-model="form.enabled" type="checkbox" /> Enabled</label>

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
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #10141c;
  color: inherit;
}

input[type='color'] {
  padding: 0.2rem;
  height: 2.25rem;
}

fieldset {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

legend {
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.6);
  padding: 0 0.25rem;
}

.segmented {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.segmented button {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 0;
  background: transparent;
  color: rgba(245, 246, 250, 0.7);
  font-size: 0.75rem;
  font-weight: 500;
}

.segmented button.active {
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
}

.google-hint {
  font-size: 0.75rem;
  color: rgba(245, 246, 250, 0.7);
  margin: 0;
  line-height: 1.4;
}

.google-hint.warning {
  color: #fbbf77;
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
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

button.secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: inherit;
}
</style>
