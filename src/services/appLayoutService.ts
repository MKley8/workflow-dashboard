import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'

/** A single app's visibility/order override for one specific user account. */
export interface AppLayoutEntry {
  enabled: boolean
  order: number
}

const USERS_COLLECTION = 'users'
// Reuses the `users/{uid}/apps/{appId}` subcollection already reserved for
// per-user data in firestore.rules.
const LAYOUT_SUBCOLLECTION = 'apps'

function toLayoutMap(
  docs: { id: string; data: () => Record<string, unknown> }[],
): Record<string, AppLayoutEntry> {
  const layout: Record<string, AppLayoutEntry> = {}
  for (const docSnap of docs) {
    const data = docSnap.data() as Partial<AppLayoutEntry>
    layout[docSnap.id] = { enabled: data.enabled ?? true, order: data.order ?? 0 }
  }
  return layout
}

/**
 * Subscribes in realtime to a user's personal app layout (visibility/order
 * overrides on top of the shared catalog). Used to render the signed-in
 * user's own dashboard exactly as an admin configured it for them.
 */
export function subscribeToUserLayout(
  uid: string,
  onChange: (layout: Record<string, AppLayoutEntry>) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const ref = collection(db, USERS_COLLECTION, uid, LAYOUT_SUBCOLLECTION)
  return onSnapshot(ref, (snapshot) => onChange(toLayoutMap(snapshot.docs)), onError)
}

/** One-time fetch of a user's layout - used by the admin "Edit Layout" screen. */
export async function getUserLayoutOnce(uid: string): Promise<Record<string, AppLayoutEntry>> {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION, uid, LAYOUT_SUBCOLLECTION))
  return toLayoutMap(snapshot.docs)
}

/**
 * Sets a specific app's visibility/order override for a specific user.
 * Admin-only - enforced by Firestore rules.
 */
export async function setUserLayoutEntry(
  uid: string,
  appId: string,
  entry: AppLayoutEntry,
): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, uid, LAYOUT_SUBCOLLECTION, appId),
    { ...entry, updatedAt: serverTimestamp() },
    { merge: true },
  )
}
