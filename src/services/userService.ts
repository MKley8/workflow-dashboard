import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import type { UserProfile } from '../types/user'
import type { ThemeId } from '../types/theme'

const USERS_COLLECTION = 'users'
const LAYOUT_SUBCOLLECTION = 'apps'

/**
 * Ensures a Firestore profile document exists for the signed-in user
 * (creating it with `isAdmin: false` the first time), and keeps the
 * denormalized email/displayName fresh on every sign-in. Never sets
 * `isAdmin` on an existing profile, so admin status can only be changed by
 * another admin via `setUserAdmin` (also enforced server-side by Firestore
 * rules). Returns the resulting profile.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(db, USERS_COLLECTION, user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    const profile: Omit<UserProfile, 'uid'> = {
      email: user.email,
      displayName: user.displayName,
      isAdmin: false,
    }
    await setDoc(ref, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { uid: user.uid, ...profile }
  }

  await updateDoc(ref, {
    email: user.email,
    displayName: user.displayName,
    updatedAt: serverTimestamp(),
  })
  const existing = snap.data() as Omit<UserProfile, 'uid'>
  return {
    uid: user.uid,
    ...existing,
    email: user.email,
    displayName: user.displayName,
  }
}

/** Lists every account's profile. Only succeeds for admins (Firestore rules). */
export async function listAllUserProfiles(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION))
  return snap.docs.map((docSnap) => ({
    uid: docSnap.id,
    ...(docSnap.data() as Omit<UserProfile, 'uid'>),
  }))
}

/** Promotes/demotes an account's admin flag. Only succeeds for admins (Firestore rules). */
export async function setUserAdmin(uid: string, isAdmin: boolean): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    isAdmin,
    updatedAt: serverTimestamp(),
  })
}

/** Fetches a single account's profile (used to read your own theme, etc.). */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) }
}

/** Lists profiles that are admins - any signed-in user can look these up (Firestore rules). */
export async function listAdminProfiles(): Promise<UserProfile[]> {
  const snap = await getDocs(query(collection(db, USERS_COLLECTION), where('isAdmin', '==', true)))
  return snap.docs.map((docSnap) => ({
    uid: docSnap.id,
    ...(docSnap.data() as Omit<UserProfile, 'uid'>),
  }))
}

/** Updates the signed-in user's own selected theme. */
export async function updateUserTheme(uid: string, theme: ThemeId): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { theme, updatedAt: serverTimestamp() })
}

/**
 * Updates the signed-in user's theme and dashboard layout preferences
 * together in a single write - used by the dashboard layout panel's
 * "Save" button so every change made there is sent at once.
 */
export async function updateUserLayoutPreferences(
  uid: string,
  preferences: {
    theme: ThemeId
    showTileDescriptions: boolean
    fillCategoryWidth: boolean
    tileDensity: string
    sortCategoriesAlphabetically: boolean
  },
): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, uid), { ...preferences, updatedAt: serverTimestamp() })
}

/**
 * Deletes a user's Firestore data (profile doc + their app layout override
 * docs), as part of account deletion. Does not delete the Firebase Auth
 * user itself - call `deleteUser(auth.currentUser)` separately for that.
 */
export async function deleteUserProfileData(uid: string): Promise<void> {
  const layoutDocs = await getDocs(collection(db, USERS_COLLECTION, uid, LAYOUT_SUBCOLLECTION))
  await Promise.all(layoutDocs.docs.map((docSnap) => deleteDoc(docSnap.ref)))
  await deleteDoc(doc(db, USERS_COLLECTION, uid))
}
