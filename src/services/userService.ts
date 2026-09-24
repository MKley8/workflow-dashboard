import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { db } from '../firebase'
import type { UserProfile } from '../types/user'

const USERS_COLLECTION = 'users'

/**
 * Ensures a Firestore profile document exists for the signed-in user
 * (creating it with `isAdmin: false` the first time), and keeps the
 * denormalized email fresh on every sign-in. Never sets `isAdmin` on an
 * existing profile, so admin status can only be changed by another admin
 * via `setUserAdmin` (also enforced server-side by Firestore rules).
 * Returns whether the account is an admin.
 */
export async function ensureUserProfile(user: User): Promise<boolean> {
  const ref = doc(db, USERS_COLLECTION, user.uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      isAdmin: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return false
  }

  await updateDoc(ref, { email: user.email, updatedAt: serverTimestamp() })
  return snap.data().isAdmin === true
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
