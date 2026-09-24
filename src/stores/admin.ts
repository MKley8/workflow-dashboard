import { defineStore } from 'pinia'
import { listAllUserProfiles, setUserAdmin } from '../services/userService'
import type { UserProfile } from '../types/user'

interface AdminState {
  accounts: UserProfile[]
  loading: boolean
  error: string | null
  loaded: boolean
}

/** Admin-only account directory: lists every user profile and lets an admin promote/demote others. */
export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    accounts: [],
    loading: false,
    error: null,
    loaded: false,
  }),
  actions: {
    async loadAccounts() {
      this.loading = true
      this.error = null
      try {
        this.accounts = await listAllUserProfiles()
        this.loaded = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load accounts.'
      } finally {
        this.loading = false
      }
    },
    async setAdmin(uid: string, isAdmin: boolean) {
      await setUserAdmin(uid, isAdmin)
      const account = this.accounts.find((a) => a.uid === uid)
      if (account) account.isAdmin = isAdmin
    },
  },
})
