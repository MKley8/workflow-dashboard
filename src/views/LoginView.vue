<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const googleSubmitting = ref(false)
const formError = ref<string | null>(null)

async function submit() {
  submitting.value = true
  formError.value = null
  try {
    if (mode.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.signup(email.value, password.value)
    }
    router.replace({ name: 'dashboard' })
  } catch (err) {
    formError.value = authStore.error
  } finally {
    submitting.value = false
  }
}

async function submitWithGoogle() {
  googleSubmitting.value = true
  formError.value = null
  try {
    await authStore.loginWithGoogle()
    // On mobile this redirects away and back; isSignedIn will only be true
    // once the app reloads, so guard the navigation on it.
    if (authStore.isSignedIn) {
      router.replace({ name: 'dashboard' })
    }
  } catch (err) {
    formError.value = authStore.error
  } finally {
    googleSubmitting.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="submit">
      <div class="brand">
        <span class="brand__logo">WF</span>
      </div>
      <h1>Workflow Dashboard</h1>
      <p class="subtitle">Sign in to access your team's apps</p>

      <button
        type="button"
        class="google-btn"
        :disabled="googleSubmitting"
        @click="submitWithGoogle"
      >
        <span class="google-icon" aria-hidden="true">G</span>
        {{ googleSubmitting ? 'Signing in...' : 'Sign in with Google' }}
      </button>

      <div class="divider"><span>or</span></div>

      <label>Email<input v-model="email" type="email" required autocomplete="email" /></label>
      <label>
        Password
        <input v-model="password" type="password" required autocomplete="current-password" />
      </label>

      <p v-if="formError" class="error">{{ formError }}</p>

      <button type="submit" :disabled="submitting">
        {{ mode === 'login' ? 'Sign in' : 'Create account' }}
      </button>

      <button type="button" class="link" @click="mode = mode === 'login' ? 'signup' : 'login'">
        {{ mode === 'login' ? "Need an account? Sign up" : 'Have an account? Sign in' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%),
    radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 55%),
    var(--bg);
}

.card {
  width: 100%;
  max-width: 360px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  box-shadow: var(--shadow);
}

.brand {
  display: flex;
  justify-content: center;
  margin-bottom: -0.25rem;
}

.brand__logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--accent-contrast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.9rem;
}

h1 {
  font-size: 1.4rem;
  margin: 0;
  text-align: center;
}

.subtitle {
  margin: 0 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

input {
  padding: 0.6rem 0.7rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
}

button[type='submit'] {
  padding: 0.65rem;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: var(--accent-contrast);
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}

button[type='submit']:hover {
  filter: brightness(1.08);
}

button[type='submit']:disabled {
  opacity: 0.6;
  cursor: default;
}

.link {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
}

.error {
  color: var(--danger);
  font-size: 0.8rem;
  margin: 0;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: #fff;
  color: #1f2328;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.google-btn:hover {
  filter: brightness(0.97);
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.google-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4285f4, #34a853 40%, #fbbc05 70%, #ea4335);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted-2);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
</style>
