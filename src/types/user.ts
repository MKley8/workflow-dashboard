/** A user's Firestore profile document (`users/{uid}`). */
export interface UserProfile {
  /** Firebase Auth uid - also the Firestore document id. */
  uid: string
  /** Denormalized from Firebase Auth so admins can search/list accounts. */
  email: string | null
  /**
   * Denormalized from Firebase Auth so admins can search/list accounts by
   * name. Populated automatically for Google sign-in; null for
   * email/password accounts unless the user has set a display name.
   */
  displayName: string | null
  /**
   * Whether this account can access the Admin screen and manage other
   * accounts. Can only ever be changed by an existing admin (enforced by
   * Firestore rules) - never by the account itself.
   */
  isAdmin: boolean
  /** Selected UI theme id (see types/theme.ts). Defaults to 'midnight' if unset. */
  theme?: string
  /**
   * Whether dashboard category sections should stretch to fill the full
   * row width. Defaults to false (compact cards that wrap multiple per
   * row) when unset.
   */
  fillCategoryWidth?: boolean
  /** Whether app descriptions are shown on dashboard tiles. Defaults to false (off) when unset. */
  showTileDescriptions?: boolean
  /**
   * How much padding/height each dashboard tile takes up: 'compact',
   * 'comfortable', or 'spacious'. Defaults to 'comfortable' when unset.
   */
  tileDensity?: string
  /**
   * Whether dashboard categories are sorted alphabetically instead of by
   * creation order. Defaults to false (creation order) when unset.
   */
  sortCategoriesAlphabetically?: boolean
  createdAt?: string
  updatedAt?: string
}
