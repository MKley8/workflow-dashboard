import { defineStore } from 'pinia'

const SHOW_DESCRIPTIONS_STORAGE_KEY = 'workflow-dashboard-show-descriptions'
const TILE_DENSITY_STORAGE_KEY = 'workflow-dashboard-tile-density'
const SORT_CATEGORIES_STORAGE_KEY = 'workflow-dashboard-sort-categories'

export const TILE_DENSITIES = ['compact', 'comfortable', 'spacious'] as const
export type TileDensity = (typeof TILE_DENSITIES)[number]
export const DEFAULT_TILE_DENSITY: TileDensity = 'comfortable'

function isTileDensity(value: unknown): value is TileDensity {
  return typeof value === 'string' && (TILE_DENSITIES as readonly string[]).includes(value)
}

function readCachedShowDescriptions(): boolean {
  return localStorage.getItem(SHOW_DESCRIPTIONS_STORAGE_KEY) === 'true'
}

function readCachedTileDensity(): TileDensity {
  const cached = localStorage.getItem(TILE_DENSITY_STORAGE_KEY)
  return isTileDensity(cached) ? cached : DEFAULT_TILE_DENSITY
}

function readCachedSortCategories(): boolean {
  return localStorage.getItem(SORT_CATEGORIES_STORAGE_KEY) === 'true'
}

interface DashboardLayoutState {
  /** Whether app descriptions are shown on dashboard tiles. Off by default. */
  showDescriptions: boolean
  /** How much padding/height each tile takes up. 'comfortable' by default. */
  tileDensity: TileDensity
  /** Whether dashboard categories are sorted alphabetically instead of by creation order. */
  sortCategoriesAlphabetically: boolean
  /** Last-saved values, used to revert an unsaved live preview (e.g. on cancel). */
  savedShowDescriptions: boolean
  savedTileDensity: TileDensity
  savedSortCategoriesAlphabetically: boolean
}

/**
 * Tracks the dashboard's tile layout preferences (description visibility,
 * tile density, category sort order). Applies instantly from cached
 * localStorage values on boot, then syncs with the signed-in account's
 * saved preferences once available. `preview` lets the layout panel show
 * changes live on the dashboard without persisting them; `commitLocal`
 * marks the previewed values as saved once they've been persisted
 * elsewhere, and `revertPreview` restores the last-saved values, e.g.
 * when the panel is closed without saving.
 */
export const useDashboardLayoutStore = defineStore('dashboardLayout', {
  state: (): DashboardLayoutState => {
    const showDescriptions = readCachedShowDescriptions()
    const tileDensity = readCachedTileDensity()
    const sortCategoriesAlphabetically = readCachedSortCategories()
    return {
      showDescriptions,
      tileDensity,
      sortCategoriesAlphabetically,
      savedShowDescriptions: showDescriptions,
      savedTileDensity: tileDensity,
      savedSortCategoriesAlphabetically: sortCategoriesAlphabetically,
    }
  },
  actions: {
    /** Called once the account's saved preferences are known (e.g. after sign-in). */
    setFromAccount(
      showDescriptions: boolean | undefined,
      tileDensity: string | undefined,
      sortCategoriesAlphabetically: boolean | undefined,
    ) {
      this.showDescriptions = showDescriptions ?? false
      this.tileDensity = isTileDensity(tileDensity) ? tileDensity : DEFAULT_TILE_DENSITY
      this.sortCategoriesAlphabetically = sortCategoriesAlphabetically ?? false
      this.savedShowDescriptions = this.showDescriptions
      this.savedTileDensity = this.tileDensity
      this.savedSortCategoriesAlphabetically = this.sortCategoriesAlphabetically
      localStorage.setItem(SHOW_DESCRIPTIONS_STORAGE_KEY, String(this.showDescriptions))
      localStorage.setItem(TILE_DENSITY_STORAGE_KEY, this.tileDensity)
      localStorage.setItem(SORT_CATEGORIES_STORAGE_KEY, String(this.sortCategoriesAlphabetically))
    },
    /** Live-previews a layout change locally, without persisting it yet. */
    preview(showDescriptions: boolean, tileDensity: TileDensity, sortCategoriesAlphabetically: boolean) {
      this.showDescriptions = showDescriptions
      this.tileDensity = tileDensity
      this.sortCategoriesAlphabetically = sortCategoriesAlphabetically
    },
    /** Restores the last-saved values, discarding any unsaved live preview. */
    revertPreview() {
      this.showDescriptions = this.savedShowDescriptions
      this.tileDensity = this.savedTileDensity
      this.sortCategoriesAlphabetically = this.savedSortCategoriesAlphabetically
    },
    /** Marks the current values as saved, after they've been persisted elsewhere. */
    commitLocal() {
      this.savedShowDescriptions = this.showDescriptions
      this.savedTileDensity = this.tileDensity
      this.savedSortCategoriesAlphabetically = this.sortCategoriesAlphabetically
      localStorage.setItem(SHOW_DESCRIPTIONS_STORAGE_KEY, String(this.showDescriptions))
      localStorage.setItem(TILE_DENSITY_STORAGE_KEY, this.tileDensity)
      localStorage.setItem(SORT_CATEGORIES_STORAGE_KEY, String(this.sortCategoriesAlphabetically))
    },
  },
})
