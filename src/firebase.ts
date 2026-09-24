import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

/**
 * Firebase configuration is read from Vite env vars so the same build can
 * be pointed at different Firebase projects (dev/staging/prod) without code
 * changes. Copy `.env.example` to `.env.local` and fill in your project's
 * values from the Firebase console (Project settings -> Your apps -> SDK
 * setup and configuration).
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)

/**
 * Enables Firestore's IndexedDB-backed persistent local cache (shared
 * across browser tabs). This is the single biggest lever for cutting
 * billed document reads: realtime `onSnapshot` listeners resume from the
 * on-disk cache on every reload/new tab instead of re-fetching every
 * document from the server, and cached data is available immediately
 * (and offline). Falls back to Firestore's default (memory-only) cache
 * if persistence can't be enabled, e.g. in some private-browsing modes.
 */
function createFirestoreWithCache() {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch (err) {
    console.warn('Persistent Firestore cache unavailable, falling back to in-memory cache:', err)
    return initializeFirestore(firebaseApp, {})
  }
}

export const db = createFirestoreWithCache()
