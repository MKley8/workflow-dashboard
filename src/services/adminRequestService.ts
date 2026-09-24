import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { AdminRequest } from '../types/adminRequest'

const COLLECTION = 'adminRequests'

function toRequest(docSnap: { id: string; data: () => Record<string, unknown> }): AdminRequest {
  return { id: docSnap.id, ...(docSnap.data() as Omit<AdminRequest, 'id'>) }
}

function byNewestFirst(a: AdminRequest, b: AdminRequest): number {
  return (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)
}

/**
 * Realtime subscription to the signed-in user's own requests, newest first.
 * Sorts client-side (rather than an `orderBy` alongside the `where`) so no
 * Firestore composite index needs to be provisioned for this query.
 */
export function subscribeToMyRequests(
  uid: string,
  onChange: (requests: AdminRequest[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), where('fromUid', '==', uid))
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map(toRequest).sort(byNewestFirst)),
    onError,
  )
}

/** Realtime subscription to every request, for the admin inbox. */
export function subscribeToAllRequests(
  onChange: (requests: AdminRequest[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => onChange(snapshot.docs.map(toRequest)), onError)
}

export interface CreateAdminRequestInput {
  fromUid: string
  fromEmail: string | null
  fromName: string | null
  toAdminUid: string
  toAdminEmail: string | null
  message: string
}

export async function createAdminRequest(input: CreateAdminRequestInput): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...input,
    read: false,
    createdAt: serverTimestamp(),
  })
}

/** Marks a request as read (admin-only, enforced by Firestore rules) - frees up the sender's slot. */
export async function markAdminRequestRead(requestId: string, adminUid: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, requestId), {
    read: true,
    readAt: serverTimestamp(),
    readByUid: adminUid,
  })
}

export async function deleteAdminRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, requestId))
}

/** Deletes all of a user's own requests - used when they delete their account. */
export async function deleteAllMyRequests(uid: string): Promise<void> {
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('fromUid', '==', uid)))
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)))
}
