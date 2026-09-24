import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import type { WorkflowApp } from '../types/app'

/** True when running inside the Capacitor-wrapped mobile app (iOS/Android). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

/** 'ios' | 'android' | 'web' */
export function currentPlatform(): string {
  return Capacitor.getPlatform()
}

/**
 * Build the best native "deep link" candidate for the current platform, if
 * the app entry declares one. Returns null when no native scheme/package is
 * configured, meaning we should just open the web URL directly.
 */
function buildNativeUrl(app: WorkflowApp): string | null {
  const platform = currentPlatform()
  if (platform === 'ios' && app.iosScheme) return app.iosScheme
  if (platform === 'android' && (app.androidScheme || app.androidPackage)) {
    if (app.androidScheme) return app.androidScheme
    // intent:// URL launches the app by package if installed, otherwise
    // falls back to the Play Store listing automatically.
    const fallback = encodeURIComponent(app.url)
    return `intent://${app.url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=${app.androidPackage};S.browser_fallback_url=${fallback};end`
  }
  return null
}

function buildStoreUrl(app: WorkflowApp): string | null {
  const platform = currentPlatform()
  if (platform === 'ios' && app.iosAppStoreId) {
    return `https://apps.apple.com/app/${app.iosAppStoreId}`
  }
  if (platform === 'android' && app.androidPlayStoreId) {
    return `https://play.google.com/store/apps/details?id=${app.androidPlayStoreId}`
  }
  return null
}

/**
 * Picks the URL to actually navigate to when launching an app: its direct
 * Google OAuth URL when Google sign-in is enabled and one is configured
 * (skipping that site's own login page and "Sign in with Google" button),
 * otherwise its normal web URL.
 */
function resolveLaunchUrl(app: WorkflowApp): string {
  if (app.loginMethod === 'google' && app.googleAuthUrl) {
    return app.googleAuthUrl
  }
  return app.url
}

/**
 * Open a workflow app, preferring its native mobile app when the dashboard
 * is running inside the Capacitor mobile wrapper and the app declares a
 * native scheme/package. Falls back to the system browser (which itself
 * honours iOS Universal Links / Android App Links when the native app is
 * installed) when no native hint is available, or when the native attempt
 * appears not to have launched anything.
 */
export async function openWorkflowApp(app: WorkflowApp): Promise<void> {
  const targetUrl = resolveLaunchUrl(app)

  if (!isNativePlatform()) {
    // Plain web: open in a new tab so the dashboard itself stays open.
    window.open(targetUrl, '_blank', 'noopener,noreferrer')
    return
  }

  const nativeUrl = buildNativeUrl(app)
  if (!nativeUrl) {
    await Browser.open({ url: targetUrl })
    return
  }

  const launched = await tryLaunchNativeApp(nativeUrl)
  if (launched) return

  // Native app not installed / didn't open: offer the store page if known,
  // otherwise just fall back to the website (or Google OAuth URL) in the
  // system browser.
  const storeUrl = buildStoreUrl(app)
  await Browser.open({ url: storeUrl ?? targetUrl })
}

/**
 * Attempts to launch a custom scheme / intent URL and detects whether the
 * app actually took over (the page becomes hidden) within a short window.
 * Resolves true if the native app appears to have opened, false otherwise.
 */
function tryLaunchNativeApp(nativeUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const onVisibilityChange = () => {
      if (document.hidden && !settled) {
        settled = true
        cleanup()
        resolve(true)
      }
    }
    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearTimeout(timer)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        cleanup()
        resolve(false)
      }
    }, 1500)

    window.location.href = nativeUrl
  })
}
