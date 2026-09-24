import { isNativePlatform } from './platformRedirect'

/**
 * Applies native mobile chrome (status bar styling, splash screen dismissal)
 * when running inside the Capacitor-wrapped app. No-ops on the web build.
 */
export async function initNativeChrome(): Promise<void> {
  if (!isNativePlatform()) return

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0f1218' })
  } catch {
    // Status bar plugin not available on this platform/build; ignore.
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    // Splash screen plugin not available; ignore.
  }
}
