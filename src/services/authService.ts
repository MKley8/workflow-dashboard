import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'
import { isNativePlatform } from './platformRedirect'

const googleProvider = new GoogleAuthProvider()

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/**
 * Signs the user in with their Google account. On the web this uses a
 * popup so the caller gets the signed-in user immediately. Inside the
 * Capacitor mobile app, popups aren't reliable in the WebView, so a
 * redirect flow is used instead - the resulting user only becomes
 * available once `watchAuthState` fires after the app reloads.
 *
 * Note: Google increasingly blocks OAuth sign-in from generic embedded
 * WebViews. For a fully robust native mobile Google Sign-In, consider
 * swapping this for a native plugin (e.g. `@capacitor-firebase/authentication`)
 * that uses the platform's native Google Sign-In SDK.
 */
export async function signInWithGoogle(): Promise<User | null> {
  if (isNativePlatform()) {
    await signInWithRedirect(auth, googleProvider)
    return null
  }
  const credential = await signInWithPopup(auth, googleProvider)
  return credential.user
}

/** Picks up the result of a `signInWithRedirect` Google sign-in, if any. */
export async function consumeGoogleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth)
  return result?.user ?? null
}

export async function register(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}
