import { defineStore } from 'pinia'
import {
  deleteUserProfileData,
  listAdminProfiles,
  listAllUserProfiles,
  setUserAdmin,
} from '../services/userService'
import { deleteAllMyRequests } from '../services/adminRequestService'
import type { UserProfile } from '../types/user'

interface AdminState {
  accounts: UserProfile[]
  loading: boolean
  error: string | null
  loaded: boolean
  /** Admin-only subset, used for "request an admin" / "assign to" lookups. */
  adminOnlyProfiles: UserProfile[]
  adminOnlyLoaded: boolean
}

// Module-level (shared across all instances, like authReadyPromise in
// stores/auth.ts) so concurrent callers (e.g. two views mounting at once)
// await the same in-flight request instead of issuing duplicate reads.
let loadAccountsPromise: Promise<void> | null = null
let loadAdminOnlyPromise: Promise<void> | null = null

/** Admin-only account directory: lists every user profile and lets an admin promote/demote others. */
export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    accounts: [],
    loading: false,
    error: null,
    loaded: false,
    adminOnlyProfiles: [],
    adminOnlyLoaded: false,
  }),
  actions: {
    /**
     * Loads every account's profile (admin-only per Firestore rules).
     * Cached for the store's lifetime - repeat calls (e.g. from every view
     * that mounts) are free once loaded. Pass `force: true` to bypass the
     * cache and re-fetch (e.g. if accounts might have changed elsewhere).
     */
    async loadAccounts(force = false) {
      if (this.loaded && !force) return
      if (loadAccountsPromise && !force) return loadAccountsPromise
      this.loading = true
      this.error = null
      loadAccountsPromise = (async () => {
        try {
          this.accounts = await listAllUserProfiles()
          this.loaded = true
        } catch (err) {
          this.error = err instanceof Error ? err.message : 'Failed to load accounts.'
        } finally {
          this.loading = false
          loadAccountsPromise = null
        }
      })()
      return loadAccountsPromise
    },
    /**
     * Loads just the admin accounts, for "request an admin" / "assign to"
     * lookups available to any signed-in user. If the full account list is
     * already cached (typical for an admin caller), this derives the
     * subset from it at zero extra cost instead of issuing a second query.
     * Otherwise runs the (rules-permitted) admins-only query once and
     * caches the result for the session.
     */
    async loadAdminOnlyProfiles() {
      if (this.loaded) {
        this.adminOnlyProfiles = this.accounts.filter((a) => a.isAdmin)
        this.adminOnlyLoaded = true
        return
      }
      if (this.adminOnlyLoaded) return
      if (loadAdminOnlyPromise) return loadAdminOnlyPromise
      loadAdminOnlyPromise = (async () => {
        try {
          this.adminOnlyProfiles = await listAdminProfiles()
          this.adminOnlyLoaded = true
        } catch (err) {
          console.warn('Could not load admin list:', err)
        } finally {
          loadAdminOnlyPromise = null
        }
      })()
      return loadAdminOnlyPromise
    },
    async setAdmin(uid: string, isAdmin: boolean) {
      await setUserAdmin(uid, isAdmin)
      const account = this.accounts.find((a) => a.uid === uid)
      if (account) account.isAdmin = isAdmin

      const inAdminOnly = this.adminOnlyProfiles.some((a) => a.uid === uid)
      if (isAdmin && !inAdminOnly && account) this.adminOnlyProfiles.push(account)
      if (!isAdmin && inAdminOnly) {
        this.adminOnlyProfiles = this.adminOnlyProfiles.filter((a) => a.uid !== uid)
      }
    },
    /**
     * Deletes a member account's Firestore data (profile, dashboard layout
     * overrides, and their admin requests) as an admin. This can't remove
     * the Firebase Auth user itself (that requires the account owner's own
     * sign-in, or an Admin SDK backend this app doesn't have) - if they
     * sign back in afterward, a fresh blank profile is created for them.
     */
    async deleteAccount(uid: string) {
      await deleteUserProfileData(uid)
      await deleteAllMyRequests(uid)
      this.accounts = this.accounts.filter((a) => a.uid !== uid)
      this.adminOnlyProfiles = this.adminOnlyProfiles.filter((a) => a.uid !== uid)
    },
    /** Clears cached account data; call on logout so the next sign-in starts fresh. */
    teardown() {
      this.accounts = []
      this.loaded = false
      this.error = null
      this.adminOnlyProfiles = []
      this.adminOnlyLoaded = false
    },
  },
})
