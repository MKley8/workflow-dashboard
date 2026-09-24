import { defineStore } from 'pinia'
import type { Unsubscribe } from 'firebase/firestore'
import type { AdminRequest } from '../types/adminRequest'
import { MAX_PENDING_ADMIN_REQUESTS } from '../types/adminRequest'
import {
  createAdminRequest,
  deleteAdminRequest,
  markAdminRequestRead,
  subscribeToAllRequests,
  subscribeToMyRequests,
  type CreateAdminRequestInput,
} from '../services/adminRequestService'

interface AdminRequestsState {
  /** The signed-in user's own requests (used in the To-Do page). */
  mine: AdminRequest[]
  /** Every request across all accounts (used in the Admin inbox). */
  all: AdminRequest[]
  unsubscribeMine: Unsubscribe | null
  unsubscribeAll: Unsubscribe | null
}

export const useAdminRequestsStore = defineStore('adminRequests', {
  state: (): AdminRequestsState => ({
    mine: [],
    all: [],
    unsubscribeMine: null,
    unsubscribeAll: null,
  }),
  getters: {
    pendingMineCount: (state) => state.mine.filter((r) => !r.read).length,
    canSendMore(): boolean {
      return this.pendingMineCount < MAX_PENDING_ADMIN_REQUESTS
    },
    pendingAllCount: (state) => state.all.filter((r) => !r.read).length,
  },
  actions: {
    subscribeMine(uid: string) {
      if (this.unsubscribeMine) return
      this.unsubscribeMine = subscribeToMyRequests(uid, (requests) => {
        this.mine = requests
      })
    },
    subscribeAll() {
      if (this.unsubscribeAll) return
      this.unsubscribeAll = subscribeToAllRequests((requests) => {
        this.all = requests
      })
    },
    teardown() {
      this.unsubscribeMine?.()
      this.unsubscribeMine = null
      this.unsubscribeAll?.()
      this.unsubscribeAll = null
      this.mine = []
      this.all = []
    },
    async send(input: CreateAdminRequestInput) {
      if (!this.canSendMore) {
        throw new Error(
          `You already have ${MAX_PENDING_ADMIN_REQUESTS} pending requests. Delete one below before sending another.`,
        )
      }
      await createAdminRequest(input)
    },
    async remove(requestId: string) {
      await deleteAdminRequest(requestId)
    },
    async markRead(requestId: string, adminUid: string) {
      await markAdminRequestRead(requestId, adminUid)
    },
  },
})
