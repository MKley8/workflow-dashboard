import type { Timestamp } from 'firebase/firestore'

/** A free-text request sent by any account to the admins (e.g. "please make me an admin"). */
export interface AdminRequest {
  id: string
  fromUid: string
  fromEmail: string | null
  fromName: string | null
  /** The admin the request was addressed to when created (any admin may still act on it). */
  toAdminUid: string
  toAdminEmail: string | null
  message: string
  read: boolean
  createdAt?: Timestamp | null
  readAt?: Timestamp | null
  readByUid?: string | null
}

/** Per-account cap on outstanding (unread) requests; matches the Firestore rules' expectations. */
export const MAX_PENDING_ADMIN_REQUESTS = 5
