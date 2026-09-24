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
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import { defaultApps } from '../data/defaultApps'
import type { WorkflowApp, WorkflowAppInput } from '../types/app'

const APPS_COLLECTION = 'apps'

/**
 * Subscribes to the shared, live app catalog in Firestore. This is what
 * makes the dashboard modular: any add/edit/remove made anywhere (by any
 * signed-in user, or from the Firebase console) is reflected instantly for
 * everyone, with no code change or redeploy required.
 */
export function subscribeToApps(
  onChange: (apps: WorkflowApp[]) => void,
  onError?: (error: unknown) => void,
): Unsubscribe {
  const appsQuery = query(collection(db, APPS_COLLECTION), orderBy('order', 'asc'))
  return onSnapshot(
    appsQuery,
    (snapshot) => {
      const apps = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<WorkflowApp, 'id'>),
      }))
      onChange(apps)
    },
    onError,
  )
}

export async function addApp(input: WorkflowAppInput): Promise<string> {
  const docRef = await addDoc(collection(db, APPS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateApp(id: string, changes: Partial<WorkflowAppInput>): Promise<void> {
  await updateDoc(doc(db, APPS_COLLECTION, id), {
    ...changes,
    updatedAt: serverTimestamp(),
  })
}

export async function removeApp(id: string): Promise<void> {
  await deleteDoc(doc(db, APPS_COLLECTION, id))
}

export async function reorderApps(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, APPS_COLLECTION, id), { order: index, updatedAt: serverTimestamp() })
  })
  await batch.commit()
}

/**
 * Populates Firestore with the default app catalog the first time the
 * dashboard is used against a fresh Firebase project (i.e. the `apps`
 * collection is empty). Safe to call repeatedly; it is a no-op once any
 * app documents exist.
 */
export async function seedDefaultAppsIfEmpty(): Promise<void> {
  const existing = await getDocs(collection(db, APPS_COLLECTION))
  if (!existing.empty) return

  const batch = writeBatch(db)
  defaultApps.forEach((app) => {
    const docRef = doc(collection(db, APPS_COLLECTION))
    batch.set(docRef, {
      ...app,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}
