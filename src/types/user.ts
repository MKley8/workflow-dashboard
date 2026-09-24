/** A user's Firestore profile document (`users/{uid}`). */
export interface UserProfile {
  /** Firebase Auth uid - also the Firestore document id. */
  uid: string
  /** Denormalized from Firebase Auth so admins can search/list accounts. */
  email: string | null
  /**
   * Whether this account can access the Admin screen and manage other
   * accounts. Can only ever be changed by an existing admin (enforced by
   * Firestore rules) - never by the account itself.
   */
  isAdmin: boolean
  createdAt?: string
  updatedAt?: string
}
