import { defineStore } from 'pinia'
import type { Unsubscribe } from 'firebase/firestore'
import type { WorkflowApp, WorkflowAppInput } from '../types/app'
import {
  addApp,
  removeApp,
  seedDefaultAppsIfEmpty,
  subscribeToApps,
  updateApp,
} from '../services/appsService'
import { subscribeToUserLayout, type AppLayoutEntry } from '../services/appLayoutService'
import { openWorkflowApp } from '../services/platformRedirect'
import { useAuthStore } from './auth'

interface AppsState {
  apps: WorkflowApp[]
  /** The signed-in user's own visibility/order overrides, set by an admin. */
  myLayout: Record<string, AppLayoutEntry>
  loading: boolean
  error: string | null
  unsubscribeApps: Unsubscribe | null
  unsubscribeLayout: Unsubscribe | null
}

export const useAppsStore = defineStore('apps', {
  state: (): AppsState => ({
    apps: [],
    myLayout: {},
    loading: false,
    error: null,
    unsubscribeApps: null,
    unsubscribeLayout: null,
  }),
  getters: {
    enabledApps: (state) => state.apps.filter((app) => app.enabled),
    sortedApps: (state) =>
      [...state.apps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    /**
     * Apps to show on the signed-in user's own dashboard: the shared
     * catalog with that user's admin-managed visibility/order overrides
     * applied on top, if any exist for them.
     */
    dashboardApps: (state): WorkflowApp[] => {
      const merged = state.apps.map((app) => {
        const override = state.myLayout[app.id]
        if (!override) return app
        return { ...app, enabled: override.enabled, order: override.order }
      })
      return merged.filter((app) => app.enabled).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    },
  },
  actions: {
    /** Starts the realtime Firestore subscriptions; call once after sign-in. */
    async init() {
      if (this.unsubscribeApps) return
      this.loading = true
      try {
        await seedDefaultAppsIfEmpty()
      } catch (err) {
        // Seeding is best-effort (e.g. blocked by security rules for a
        // non-admin); the live subscription below still works normally.
        console.warn('Could not seed default apps:', err)
      }
      this.unsubscribeApps = subscribeToApps(
        (apps) => {
          this.apps = apps
          this.loading = false
        },
        (err) => {
          this.error = err instanceof Error ? err.message : 'Failed to load apps.'
          this.loading = false
        },
      )

      const uid = useAuthStore().user?.uid
      if (uid) {
        this.unsubscribeLayout = subscribeToUserLayout(uid, (layout) => {
          this.myLayout = layout
        })
      }
    },
    teardown() {
      this.unsubscribeApps?.()
      this.unsubscribeApps = null
      this.unsubscribeLayout?.()
      this.unsubscribeLayout = null
      this.apps = []
      this.myLayout = {}
    },
    async create(input: WorkflowAppInput) {
      await addApp(input)
    },
    async update(id: string, changes: Partial<WorkflowAppInput>) {
      await updateApp(id, changes)
    },
    async remove(id: string) {
      await removeApp(id)
    },
    /** Opens an app, redirecting to its native mobile app when available. */
    async launch(app: WorkflowApp) {
      await openWorkflowApp(app)
    },
  },
})
