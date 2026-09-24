import { defineStore } from 'pinia'
import { DEFAULT_THEME, isThemeId, type ThemeId } from '../types/theme'
import { updateUserTheme } from '../services/userService'

const STORAGE_KEY = 'workflow-dashboard-theme'
const FILL_WIDTH_STORAGE_KEY = 'workflow-dashboard-fill-category-width'

function readCachedTheme(): ThemeId {
  const cached = localStorage.getItem(STORAGE_KEY)
  return isThemeId(cached) ? cached : DEFAULT_THEME
}

function readCachedFillCategoryWidth(): boolean {
  return localStorage.getItem(FILL_WIDTH_STORAGE_KEY) === 'true'
}

function applyThemeToDocument(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
}

interface ThemeState {
  current: ThemeId
  /** Last-saved theme, used to revert an unsaved live preview (e.g. on cancel). */
  savedCurrent: ThemeId
  /** Whether dashboard category sections stretch to fill the full row width. */
  fillCategoryWidth: boolean
  /** Last-saved fill-category-width value, used to revert an unsaved live preview. */
  savedFillCategoryWidth: boolean
}

/**
 * Tracks the active UI theme and related layout preferences. Applies
 * instantly from cached localStorage values on boot (avoiding a flash of
 * the wrong look), then syncs with the signed-in account's saved
 * preferences in Firestore once available, so the choices follow the
 * account across devices. `previewTheme`/`revertThemePreview`/`commitTheme`
 * and the equivalent fill-category-width actions support the dashboard
 * layout panel's live-preview-then-batched-save flow.
 */
export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => {
    const current = readCachedTheme()
    const fillCategoryWidth = readCachedFillCategoryWidth()
    return {
      current,
      savedCurrent: current,
      fillCategoryWidth,
      savedFillCategoryWidth: fillCategoryWidth,
    }
  },
  actions: {
    /** Applies the cached/default theme immediately; call once on app boot. */
    applyCached() {
      applyThemeToDocument(this.current)
    },
    /** Called once the account's saved preferences are known (e.g. after sign-in). */
    setFromAccount(theme: string | undefined, fillCategoryWidth: boolean | undefined) {
      const resolvedTheme = isThemeId(theme) ? theme : DEFAULT_THEME
      this.current = resolvedTheme
      this.savedCurrent = resolvedTheme
      localStorage.setItem(STORAGE_KEY, resolvedTheme)
      applyThemeToDocument(resolvedTheme)

      this.fillCategoryWidth = fillCategoryWidth ?? false
      this.savedFillCategoryWidth = this.fillCategoryWidth
      localStorage.setItem(FILL_WIDTH_STORAGE_KEY, String(this.fillCategoryWidth))
    },
    /** Changes the theme, applying it immediately and persisting it for the account. */
    async setTheme(uid: string, theme: ThemeId) {
      this.current = theme
      this.savedCurrent = theme
      localStorage.setItem(STORAGE_KEY, theme)
      applyThemeToDocument(theme)
      await updateUserTheme(uid, theme)
    },
    /** Live-previews a theme locally (e.g. from the layout panel), without persisting it yet. */
    previewTheme(theme: ThemeId) {
      this.current = theme
      applyThemeToDocument(theme)
    },
    /** Live-previews the fill-category-width preference, without persisting it yet. */
    previewFillCategoryWidth(value: boolean) {
      this.fillCategoryWidth = value
    },
    /** Restores the last-saved theme and fill-category-width, discarding any unsaved live preview. */
    revertThemePreview() {
      this.current = this.savedCurrent
      applyThemeToDocument(this.savedCurrent)
      this.fillCategoryWidth = this.savedFillCategoryWidth
    },
    /** Marks the currently-previewed theme and fill-category-width as saved, after being persisted elsewhere. */
    commitTheme() {
      this.savedCurrent = this.current
      localStorage.setItem(STORAGE_KEY, this.current)
      this.savedFillCategoryWidth = this.fillCategoryWidth
      localStorage.setItem(FILL_WIDTH_STORAGE_KEY, String(this.fillCategoryWidth))
    },
  },
})
