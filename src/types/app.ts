/**
 * A single workflow application shown as a tile on the dashboard.
 *
 * These records are stored in Firestore (`apps` collection for the shared
 * catalog, and `users/{uid}/apps` for a user's personal selection/order),
 * so the dashboard is fully data-driven: adding, editing, or removing an
 * app never requires a code change or redeploy.
 */
export interface WorkflowApp {
  /** Firestore document id (assigned on create). */
  id: string
  /** Display name, e.g. "Team Chat". */
  name: string
  /** Short description shown under the name. */
  description?: string
  /** The web URL to open (desktop browser / mobile fallback). */
  url: string
  /** Optional icon URL. Falls back to a generated monogram if omitted. */
  iconUrl?: string
  /** Brand colour used for the tile background/accent (hex). */
  color?: string
  /** Category/group used to cluster tiles on the dashboard. */
  category?: AppCategory
  /**
   * Custom URL scheme used to try to open the native iOS app first,
   * e.g. "teamchat://". Optional - if omitted, only the universal
   * link / system browser open is attempted.
   */
  iosScheme?: string
  /** App Store id, used to offer an install link if the app isn't present. */
  iosAppStoreId?: string
  /**
   * Android package name / intent scheme used to try to open the native
   * Android app first, e.g. "com.example.teamchat".
   */
  androidPackage?: string
  /** Optional custom Android intent scheme (rarely needed; falls back to package). */
  androidScheme?: string
  /** Google Play package id, used to offer an install link if not present. */
  androidPlayStoreId?: string
  /** Sort order on the dashboard grid. */
  order?: number
  /** Whether the tile is enabled/visible. */
  enabled: boolean
  /**
   * How the user signs in to this specific app. 'google' means the site
   * offers a "Sign in with Google" option and the dashboard's own Google
   * account (see `linkedGoogleEmail` in the auth store) can be used;
   * 'manual' means a plain username/email (stored in `loginUsername`)
   * should be used instead. Defaults to 'manual' when unset.
   */
  loginMethod?: 'google' | 'manual'
  /** Username/email hint shown and copy-to-clipboard-able when loginMethod is 'manual'. */
  loginUsername?: string
  /**
   * Direct Google OAuth "authorize" URL that this app's own "Sign in with
   * Google" button normally links to (captured from the site, e.g. via
   * browser dev tools -> Network tab, right-click the button's request).
   * When `loginMethod` is 'google' and this is set, launching the app
   * skips its login page entirely and jumps straight to Google's account
   * chooser/consent screen. Optional - if omitted, the app's normal URL
   * (`url`) is opened and the user clicks "Sign in with Google" there
   * themselves.
   */
  googleAuthUrl?: string
  /** ISO timestamp strings, set by Firestore service. */
  createdAt?: string
  updatedAt?: string
}

export type AppCategory =
  | 'Scheduling'
  | 'HR'
  | 'Productivity'
  | 'Shopping'
  | 'Recruitment'
  | 'Compliance'
  | 'Operations'
  | 'Verification'
  | 'Other'

/** Shape used by the Add/Edit App form before it has an id. */
export type WorkflowAppInput = Omit<WorkflowApp, 'id' | 'createdAt' | 'updatedAt'>
