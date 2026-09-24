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
- **Themes** - pick from four built-in themes (Midnight, Slate, Sunset,
  Light) in **Settings**; the choice is saved to the account and applied
  everywhere, including a flash-free load via a cached local copy.
- **Sidebar navigation** - a clickable left sidebar (collapsible into a
  drawer on mobile) replaces a traditional top navbar, using sleek
  [Material Symbols](https://fonts.google.com/icons) icons instead of emoji.
- **Settings page** - per-account theme picker and self-service account
  deletion.
- **To-Do list** - a sidebar-accessible page for personal or admin-assigned
  tasks. Tasks can link to specific catalog apps - hovering that app's tile
  shows its active linked tasks. Checking a task off moves it to a "Done"
  section. This page also hosts sending free-text requests to admins
  (capped at 5 pending at a time).
- **Member vs. admin app permissions** - any signed-in user can add an app,
  but only admins (or whoever added it, if not an admin) can remove one.
  Members editing an admin-added ("admin-given") app can only rename it and
  change its sign-in method; every other field is admin-only.

## Project structure

```
src/
  types/app.ts          WorkflowApp data model (incl. ownerIsAdmin)
  types/user.ts           UserProfile data model (email + isAdmin + theme)
  types/theme.ts          Theme ids/options
  types/adminRequest.ts   AdminRequest data model + the 5-pending cap
  types/todo.ts           TodoItem data model
  data/defaultApps.ts    Seed catalog (used to populate Firestore once)
  firebase.ts             Firebase app/auth/firestore initialization
  services/
    authService.ts        Firebase Auth wrappers (incl. account deletion)
    userService.ts          Account profiles: create/list/promote-demote admin, theme
    appsService.ts         Firestore CRUD + realtime subscription (shared catalog)
    appLayoutService.ts     Per-account app visibility/order overrides (admin-managed)
    adminRequestService.ts  Free-text requests from accounts to admins
    todoService.ts          To-do tasks: create/subscribe/toggle-done/delete
    platformRedirect.ts     Native-app-first launch logic (the "redirect")
    nativeChrome.ts         Status bar / splash screen for the mobile shell
  stores/                 Pinia stores (auth, apps, admin, adminRequests, todos, theme)
  router/                 Vue Router (login/dashboard/manage/admin/settings/todos guards)
  components/             AppTile, AppGrid, Sidebar, AddEditAppModal, EditUserLayoutModal
  views/                  LoginView, DashboardView, ManageAppsView, AdminView, SettingsView, TodosView
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

Go to **Manage Apps** in the sidebar:

- **Add App**: name, URL, description, category, brand colour, optional
  icon URL, sign-in method, and optional native-redirect hints (iOS URL
  scheme / App Store id, Android package / Play Store id). Any signed-in
  account can add an app.
- **Sign-in method**: choose **Username / Email** and store a hint (e.g.
  the login you use for that site) or **Sign in with Google** if the site
  offers Google sign-in - it will be tied to whichever Google account you
  used to sign in to the dashboard. On the dashboard, tapping the small
  badge on a tile (rather than the tile itself) copies that hint to your
  clipboard so it's ready to paste into the site's login form.
- **Edit**: click Edit on any row.
- **Enable/disable**: toggle the checkbox without deleting the entry.
- **Remove**: click Remove (with confirmation).
- **Member vs. admin permissions**: apps added by an admin are marked
  **Admin-given**. Regular (non-admin) members can rename an admin-given
  app and change its sign-in method, but can't edit its other fields,
  disable it, or remove it - only an admin can. Apps added by a regular
  member have no such restriction (any signed-in account can fully manage
  them, matching the original behaviour).

Because this is all backed by Firestore, changes are visible to every
signed-in user instantly, on both the web app and any mobile app builds -
no rebuild required.

## 4. Admin accounts

Admins can search every account and control both who else is an admin and
what each account's dashboard looks like.

**Publish the updated rules first:** this feature (and the To-Do page's
task assignment/admin requests/account deletion) relies on the checks in
[`firestore.rules`](./firestore.rules), including the `adminRequests` and
`todos` collections, the `apps` field-level restrictions, and self-delete
permissions. Re-publish them any time you update that file - Firestore
Database -> Rules tab -> paste the file's contents -> Publish (or
`firebase deploy --only firestore:rules` if you have the Firebase CLI set
up).

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
4. Reload the dashboard - an **Admin** link now appears in the sidebar.

From then on, that admin (or any admin they promote from the **Admin**
screen) can promote/demote other accounts - no more manual console edits
needed.

**Using the Admin screen:**

- **Accounts tab** - search accounts by name or email, **Make admin /
  Remove admin** to toggle admin access, and **Edit Layout** to choose
  exactly which apps a specific account sees on their dashboard and
  reorder them with the arrow buttons. Apps left unchecked simply don't
  appear for that account, without touching the shared catalog. Only
  admins can edit any account's layout; regular accounts cannot edit their
  own.
- **Requests tab** - every request sent from the **To-Do** page's "Request
  an admin" form, across all accounts. Click **Mark as read** to
  acknowledge one - this frees up a slot for that account to send another
  (see below).

## 5. To-Do list

Every account has a **To-Do** page (in the sidebar, with a badge showing
its active task count) plus a collapsible **Active Tasks** dropdown built
into the sidebar itself (expanded by default) for quick access/completion
from anywhere:

- Click **+ Add Task** in the page's top banner to expand a form panel to
  the right of the task list (stacks below it on narrow screens).
- **Add a task**: a title, optional description, and optionally one or
  more linked apps from the catalog. Admins additionally get a multi-select
  **Assign to** list to create a task for one or more other accounts (or
  themselves); regular accounts can only create tasks for themselves. Only
  admins can assign tasks to other people at all.
- **Linked apps**: hovering a linked app's tile on the **Dashboard** shows
  a small popover listing that app's active (not-done) linked tasks, and
  the tile shows a small dot indicator when it has any.
- **Active / Done**: checking a task's checkbox (from the To-Do page or
  directly from the sidebar dropdown) marks it done and moves it into the
  **Done** section; unchecking moves it back.

## 6. Settings: themes, layout, admin requests, and account deletion

Every account has a **Settings** page (in the sidebar) with:

- **Theme** - pick from four built-in themes (Midnight, Slate, Sunset,
  Light). The choice is saved to the account (so it follows you to other
  devices) and cached locally for an instant, flash-free load next time.
- **Fill full width for each dashboard category section** - off by
  default, so category sections on the **Dashboard** stay compact and
  wrap multiple per row instead of each stretching across the whole page;
  turn it on to restore the traditional one-category-per-row layout.
- **Request an admin** - search for an admin by name/email and send them a
  free-text message (e.g. "please make me an admin" or "please fix my
  layout"). Each account can have at most 5 pending (unread) requests at
  once - delete one of your own below the form, or wait for an admin to
  mark one as read, to free up a slot for a new one.
- **Delete account** - permanently deletes the signed-in account: its
  Firestore profile, dashboard layout, and pending requests, plus the
  underlying Firebase Auth user. Requires typing your email to confirm.
  If Firebase reports the sign-in is too old for this sensitive action,
  sign out, sign back in, and try again.

## 7. Mobile app (Capacitor)

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

## 8. Reducing Firestore read costs

Two complementary layers keep billed document reads down:

- **Persistent local cache** ([`firebase.ts`](./src/firebase.ts)) - Firestore
  is initialized with an IndexedDB-backed, multi-tab persistent cache. Every
  realtime `onSnapshot` listener (apps, per-user layout, to-dos, admin
  requests) resumes from the on-disk cache on reload or in a new tab instead
  of re-reading every document from the server, and data stays available
  offline. Falls back to the default in-memory cache automatically if the
  browser can't support persistence (e.g. some private-browsing modes).
- **Session-cached one-time reads** - the admin directory (used by the
  Admin screen, and by "Assign to" / "Request an admin" lookups) is fetched
  at most once per session via [`stores/admin.ts`](./src/stores/admin.ts):
  concurrent callers await the same in-flight request, and the admins-only
  subset is derived for free from the already-cached full list when an
  admin has it, rather than running a second query. Call `loadAccounts(true)`
  to force a refresh if you suspect accounts changed elsewhere during a
  long session.

## 9. Build for production (web)

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
