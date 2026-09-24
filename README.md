# Workflow Dashboard

[![CI](https://github.com/MKley8/workflow-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/MKley8/workflow-dashboard/actions/workflows/ci.yml)

A modular, mobile-ready dashboard that gathers a team's workflow web apps
(scheduling, HR, compliance, operations, etc.) into a single home screen.
Built with **Vue 3 + TypeScript + Vite**, backed by **Firebase** (Auth +
Firestore), and wrapped for mobile with **Capacitor**.

> This is a portfolio/demo version: the seeded app catalog uses fictional
> placeholder services (`*.example.com`) so it can be shared publicly.
> Swap in your own team's real tools from the **Manage Apps** screen.

## Highlights

- **Modular app catalog** - every tile on the dashboard is a document in a
  Firestore `apps` collection. Add, edit, remove, enable/disable, or
  reorder apps from the built-in **Manage Apps** screen (or directly in the
  Firebase console) - no code change or redeploy needed.
- **Firebase Auth** - email/password and Google sign-in gate the dashboard;
  the same Firestore data is shared across web and mobile.
- **Mobile app compatibility** - the same codebase is wrapped with
  [Capacitor](https://capacitorjs.com/) to produce native iOS/Android apps.
- **Native app redirect** - when running inside the mobile app, tapping a
  tile tries to open that service's native app first (via a custom
  URL/intent scheme, with a timeout-based fallback), and only opens the
  website in the system browser if the native app isn't installed.
- Seeded with illustrative example apps across common workplace categories
  (scheduling, HR, productivity, shopping, recruitment, compliance,
  operations, verification) - all pointing at placeholder URLs.
- **Admin accounts** - any account can be promoted to admin. Admins get an
  **Admin** screen where they can search every account by email and, for
  each one, grant/revoke admin access or customize exactly which apps that
  account sees and in what order - without needing that person's password
  or session.

## Project structure

```
src/
  types/app.ts          WorkflowApp data model
  types/user.ts           UserProfile data model (email + isAdmin)
  data/defaultApps.ts    Seed catalog (used to populate Firestore once)
  firebase.ts             Firebase app/auth/firestore initialization
  services/
    authService.ts        Firebase Auth wrappers
    userService.ts          Account profiles: create/list/promote-demote admin
    appsService.ts         Firestore CRUD + realtime subscription (shared catalog)
    appLayoutService.ts     Per-account app visibility/order overrides (admin-managed)
    platformRedirect.ts     Native-app-first launch logic (the "redirect")
    nativeChrome.ts         Status bar / splash screen for the mobile shell
  stores/                 Pinia stores (auth, apps, admin)
  router/                 Vue Router (login/dashboard/manage/admin guards)
  components/             AppTile, AppGrid, NavBar, AddEditAppModal, EditUserLayoutModal
  views/                  LoginView, DashboardView, ManageAppsView, AdminView
capacitor.config.ts       Capacitor (mobile wrapper) configuration
firestore.rules            Firestore security rules
```

## 1. Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com/).
2. Enable **Authentication -> Sign-in method -> Email/Password**.
3. Also enable **Authentication -> Sign-in method -> Google** if you want the
   "Sign in with Google" button on the login screen to work (it's enabled by
   default in the code either way; the button will just fail until this
   provider is turned on in the console).
4. Enable **Firestore Database** (start in production mode) and publish the
   rules in [`firestore.rules`](./firestore.rules) (Firestore -> Rules tab,
   or via `firebase deploy --only firestore:rules` with the Firebase CLI).
5. Add a Web App in Project settings, copy the config values, then:

   ```
   copy .env.example .env.local
   ```

   and fill in the six `VITE_FIREBASE_*` values.

The first user to sign in and load the dashboard will automatically seed
the shared `apps` collection with the default catalog (see
`seedDefaultAppsIfEmpty` in [`appsService.ts`](./src/services/appsService.ts)),
as long as the Firestore rules allow it (the default rules do).

## 2. Run the web app

```
npm install
npm run dev
```

Open the printed local URL, sign up for an account (email/password, or
Google), and the dashboard will load.

## 3. Adding / removing apps

Go to **Manage Apps** in the nav bar:

- **Add App**: name, URL, description, category, brand colour, optional
  icon URL, sign-in method, and optional native-redirect hints (iOS URL
  scheme / App Store id, Android package / Play Store id).
- **Sign-in method**: choose **Username / Email** and store a hint (e.g.
  the login you use for that site) or **Sign in with Google** if the site
  offers Google sign-in - it will be tied to whichever Google account you
  used to sign in to the dashboard. On the dashboard, tapping the small
  badge on a tile (rather than the tile itself) copies that hint to your
  clipboard so it's ready to paste into the site's login form.
- **Edit**: click Edit on any row.
- **Enable/disable**: toggle the checkbox without deleting the entry.
- **Remove**: click Remove (with confirmation).

Because this is all backed by Firestore, changes are visible to every
signed-in user instantly, on both the web app and any mobile app builds -
no rebuild required.

## 4. Admin accounts

Admins can search every account and control both who else is an admin and
what each account's dashboard looks like.

**Publish the updated rules first:** this feature relies on the `isAdmin`
checks in [`firestore.rules`](./firestore.rules). Re-publish them any time
you update that file - Firestore Database -> Rules tab -> paste the file's
contents -> Publish (or `firebase deploy --only firestore:rules` if you
have the Firebase CLI set up).

**Bootstrapping the very first admin:** no account starts as an admin, and
by design no account can promote itself (the rules explicitly block
self-promotion). So the very first admin has to be set directly in the
Firebase console:

1. Sign up/sign in to the dashboard once, so your account has a profile
   document.
2. In the Firebase console, go to **Firestore Database -> Data**, open the
   `users` collection, and find the document whose id matches your account
   (check the `email` field to confirm).
3. Edit that document's `isAdmin` field to `true`.
4. Reload the dashboard - an **Admin** link now appears in the nav bar.

From then on, that admin (or any admin they promote from the **Admin**
screen) can promote/demote other accounts - no more manual console edits
needed.

**Using the Admin screen:**

- **Search** accounts by email.
- **Make admin / Remove admin**: toggles that account's admin access.
- **Edit Layout**: choose exactly which apps a specific account sees on
  their dashboard, and reorder them with the arrow buttons. Apps left
  unchecked simply don't appear for that account, without touching the
  shared catalog (their own copy in **Manage Apps** is untouched, and other
  accounts are unaffected). Only admins can edit any account's layout;
  regular accounts cannot edit their own.

## 5. Mobile app (Capacitor)

The web build is reused as the mobile app's UI. First build the web
assets, then add the native platform(s) you need:

```
npm run build
npm run cap:add:android   # generates the /android native project
npm run cap:add:ios       # generates the /ios native project (macOS + Xcode required)
```

After that, whenever you change the web app:

```
npm run cap:sync          # rebuilds web assets and copies them into native projects
npm run cap:open:android  # opens Android Studio
npm run cap:open:ios      # opens Xcode
```

From Android Studio / Xcode you can run on a simulator/device or produce a
signed build for the Play Store / App Store.

> Requires Node 20+ (Capacitor 7). iOS builds require macOS + Xcode;
> Android builds require Android Studio.

### How the native-app redirect works

Each app entry can optionally declare:

- `iosScheme` (e.g. `slingapp://`) and/or `androidPackage` /
  `androidScheme`.

When the dashboard is running inside the Capacitor mobile app
(`Capacitor.isNativePlatform()`), tapping a tile:

1. If a native scheme/package is configured, the app tries to launch it and
   watches for the page being backgrounded (a sign the OS switched to the
   native app) within ~1.5s.
2. If that doesn't happen (app not installed), it falls back to the app's
   Play Store / App Store listing if known, otherwise opens the website in
   the system browser via `@capacitor/browser`.
3. If no native scheme/package is configured at all, it just opens the
   website in the system browser - which itself will honour iOS Universal
   Links / Android App Links if the destination app is installed and
   registered for that domain.

On the plain web build, tiles simply open the URL in a new tab.

## 6. Build for production (web)

```
npm run build
npm run preview
```

## Notes / next steps

- The included Firestore rules allow any signed-in user to manage the app
  catalog. To restrict management to admins only, add an `isAdmin` field to
  a user's `users/{uid}` profile document and tighten the `allow write`
  rule on `/apps/{appId}` (a commented example is included in
  `firestore.rules`).
- Many real-world SaaS tools (e.g. productivity suites, shopping, job
  boards) don't have a single fixed "login" URL for every organization, so
  placeholder example URLs are seeded - update them from **Manage Apps**
  to point at your organization's exact URLs.
- To add per-user app selection/ordering instead of (or in addition to) a
  single shared catalog, add documents under `users/{uid}/apps` - the
  Firestore rules already reserve that path.
- **Google Sign-In on mobile:** the login screen's Google button works out
  of the box on the web build (`signInWithPopup`). Inside the packaged
  Capacitor mobile app it falls back to `signInWithRedirect`, but Google
  increasingly blocks OAuth from generic embedded WebViews. For a fully
  reliable native experience, swap this for a plugin that uses the
  platform's native Google Sign-In SDK, such as
  [`@capacitor-firebase/authentication`](https://github.com/capawesome-team/capacitor-firebase).
- Per-app "Sign in with Google" is a UX hint, not real single sign-on: the
  dashboard cannot inject credentials into a third-party site. Enabling it
  just tells the tile to display/copy the Google account you're signed
  into the dashboard with, so you know which account to pick when that
  site's own "Sign in with Google" button shows Google's account chooser.

## License

[MIT](./LICENSE)
