import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import {
  consumeGoogleRedirectResult,
  deleteCurrentUser,
  register,
  signIn,
  signInWithGoogle,
  signOut,
  watchAuthState,
} from '../services/authService'
import { deleteUserProfileData, ensureUserProfile } from '../services/userService'
import { deleteAllMyRequests } from '../services/adminRequestService'
import { useAppsStore } from './apps'
import { useThemeStore } from './theme'
import { useDashboardLayoutStore } from './dashboardLayout'
import { useAdminRequestsStore } from './adminRequests'
import { useTodosStore } from './todos'
import { useAdminStore } from './admin'

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
              const profile = await ensureUserProfile(user)
              this.isAdmin = profile.isAdmin
              useThemeStore().setFromAccount(profile.theme, profile.fillCategoryWidth)
              useDashboardLayoutStore().setFromAccount(
                profile.showTileDescriptions,
                profile.tileDensity,
                profile.sortCategoriesAlphabetically,
              )
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
      // Reset per-account subscriptions so the next sign-in starts fresh
      // instead of showing the previous account's cached data.
      useAppsStore().teardown()
      useAdminRequestsStore().teardown()
      useTodosStore().teardown()
      useAdminStore().teardown()
    },
    /**
     * Permanently deletes the signed-in account: its Firestore profile/layout
     * data, its own admin requests, and the Firebase Auth user itself. If
     * Firebase requires a more recent sign-in for this, the caller should
     * catch the thrown error and prompt the user to sign out/in and retry.
     */
    async deleteAccount() {
      const uid = this.user?.uid
      if (!uid) throw new Error('No signed-in user to delete.')

      await deleteUserProfileData(uid)
      await deleteAllMyRequests(uid)
      await deleteCurrentUser()

      this.user = null
      this.isAdmin = false
      useAppsStore().teardown()
      useAdminRequestsStore().teardown()
      useTodosStore().teardown()
      useAdminStore().teardown()
    },
  },
})

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
