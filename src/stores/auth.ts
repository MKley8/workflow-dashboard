import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import {
  consumeGoogleRedirectResult,
  register,
  signIn,
  signInWithGoogle,
  signOut,
  watchAuthState,
} from '../services/authService'
import { ensureUserProfile } from '../services/userService'
import { useAppsStore } from './apps'

interface AuthState {
  user: User | null
  isAdmin: boolean
  initialized: boolean
  error: string | null
  loading: boolean
}

// Module-level (non-reactive) so the router guard and app bootstrap can
// share a single "auth state is known" promise, regardless of call order.
let authReadyPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAdmin: false,
    initialized: false,
    error: null,
    loading: false,
  }),
  getters: {
    isSignedIn: (state) => !!state.user,
    /**
     * The Google account email linked to the current dashboard session, or
     * null if the user isn't signed in with Google. Used to show which
     * account will be used when an app's sign-in method is set to Google.
     */
    linkedGoogleEmail: (state) => {
      const googleProfile = state.user?.providerData.find((p) => p.providerId === 'google.com')
      return googleProfile?.email ?? null
    },
  },
  actions: {
    /**
     * Starts listening to Firebase auth state and returns a promise that
     * resolves once the initial auth state is known. Safe to call multiple
     * times (e.g. from both main.ts and the router guard) - subsequent
     * calls return the same cached promise instead of re-subscribing.
     */
    init(): Promise<void> {
      if (authReadyPromise) return authReadyPromise
      authReadyPromise = new Promise((resolve) => {
        // Picks up the result of a Google redirect sign-in (mobile app),
        // if one is in flight; harmless no-op otherwise.
        consumeGoogleRedirectResult().catch((err) => {
          this.error = toMessage(err)
        })
        watchAuthState(async (user) => {
          this.user = user
          if (user) {
            try {
              this.isAdmin = await ensureUserProfile(user)
            } catch (err) {
              console.warn('Could not load user profile:', err)
              this.isAdmin = false
            }
          } else {
            this.isAdmin = false
          }
          this.initialized = true
          resolve()
        })
      })
      return authReadyPromise
    },
    async login(email: string, password: string) {
      this.loading = true
      this.error = null
      try {
        this.user = await signIn(email, password)
      } catch (err) {
        this.error = toMessage(err)
        throw err
      } finally {
        this.loading = false
      }
    },
    async loginWithGoogle() {
      this.loading = true
      this.error = null
      try {
        const user = await signInWithGoogle()
        if (user) this.user = user
      } catch (err) {
        this.error = toMessage(err)
        throw err
      } finally {
        this.loading = false
      }
    },
    async signup(email: string, password: string) {
      this.loading = true
      this.error = null
      try {
        this.user = await register(email, password)
      } catch (err) {
        this.error = toMessage(err)
        throw err
      } finally {
        this.loading = false
      }
    },
    async logout() {
      await signOut()
      this.user = null
      this.isAdmin = false
      // Reset the shared apps store so its per-account layout subscription
      // is torn down; the next sign-in re-subscribes for the new account.
      useAppsStore().teardown()
    },
  },
})

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
