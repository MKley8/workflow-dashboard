<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { updateUserLayoutPreferences } from '../services/userService'
import { THEME_OPTIONS } from '../types/theme'
import { useDashboardLayoutStore, TILE_DENSITIES, type TileDensity } from '../stores/dashboardLayout'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const themeStore = useThemeStore()
const layoutStore = useDashboardLayoutStore()
const saving = ref(false)

const TILE_DENSITY_LABELS: Record<TileDensity, string> = {
  compact: 'Compact',
  comfortable: 'Comfortable',
  spacious: 'Spacious',
}
const tileDensityOptions = TILE_DENSITIES.map((id) => ({ id, label: TILE_DENSITY_LABELS[id] }))

// Local draft, previewed live on the dashboard as it changes, but only
// sent to the account when "Save" is pressed.
const draftShowDescriptions = ref(layoutStore.showDescriptions)
const draftTileDensity = ref<TileDensity>(layoutStore.tileDensity)
const draftSortCategoriesAlphabetically = ref(layoutStore.sortCategoriesAlphabetically)

// Resync the draft with the last-saved values whenever the panel opens.
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    draftShowDescriptions.value = layoutStore.showDescriptions
    draftTileDensity.value = layoutStore.tileDensity
    draftSortCategoriesAlphabetically.value = layoutStore.sortCategoriesAlphabetically
  },
)

watch([draftShowDescriptions, draftTileDensity, draftSortCategoriesAlphabetically], ([showDescriptions, tileDensity, sortCategoriesAlphabetically]) => {
  layoutStore.preview(showDescriptions, tileDensity, sortCategoriesAlphabetically)
})

function selectTheme(themeId: (typeof THEME_OPTIONS)[number]['id']) {
  themeStore.previewTheme(themeId)
}

function toggleFillCategoryWidth(event: Event) {
  themeStore.previewFillCategoryWidth((event.target as HTMLInputElement).checked)
}

function closeWithoutSaving() {
  themeStore.revertThemePreview()
  layoutStore.revertPreview()
  emit('close')
}

async function save() {
  if (!authStore.user) return
  saving.value = true
  try {
    await updateUserLayoutPreferences(authStore.user.uid, {
      theme: themeStore.current,
      showTileDescriptions: layoutStore.showDescriptions,
      fillCategoryWidth: themeStore.fillCategoryWidth,
      tileDensity: layoutStore.tileDensity,
      sortCategoriesAlphabetically: layoutStore.sortCategoriesAlphabetically,
    })
    themeStore.commitTheme()
    layoutStore.commitLocal()
    emit('close')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="open" class="scrim" @click.self="closeWithoutSaving">
    <aside class="panel">
      <header class="panel__header">
        <h2>Layout options</h2>
        <button type="button" class="icon-btn" title="Close" @click="closeWithoutSaving">
          <span class="icon">close</span>
        </button>
      </header>

      <div class="field">
        <span class="field__label">Theme</span>
        <div class="themes">
          <button
            v-for="option in THEME_OPTIONS"
            :key="option.id"
            type="button"
            class="theme-option"
            :class="{ active: themeStore.current === option.id }"
            @click="selectTheme(option.id)"
          >
            <span class="theme-option__swatch">
              <span :style="{ background: option.swatch[0] }" />
              <span :style="{ background: option.swatch[1] }" />
              <span :style="{ background: option.swatch[2] }" />
            </span>
            {{ option.label }}
          </button>
        </div>
      </div>

      <label class="toggle">
        <input v-model="draftShowDescriptions" type="checkbox" />
        Show descriptions
      </label>
      <p class="hint">Off by default. Shows each app's description under its name on the dashboard.</p>

      <label class="toggle">
        <input
          type="checkbox"
          :checked="themeStore.fillCategoryWidth"
          @change="toggleFillCategoryWidth"
        />
        Fill full width for each dashboard category section
      </label>
      <p class="hint">
        Off by default: category sections stay compact and wrap multiple per row. Turn this
        on to have each category stretch across the full row instead.
      </p>

      <div class="field">
        <span class="field__label">Tile size</span>
        <div class="segmented">
          <button
            v-for="option in tileDensityOptions"
            :key="option.id"
            type="button"
            class="segmented__option"
            :class="{ active: draftTileDensity === option.id }"
            @click="draftTileDensity = option.id"
          >
            {{ option.label }}
          </button>
        </div>
        <p class="hint">Comfortable by default. Compact fits more tiles on screen; spacious gives each tile more room.</p>
      </div>

      <label class="toggle">
        <input v-model="draftSortCategoriesAlphabetically" type="checkbox" />
        Sort categories alphabetically
      </label>
      <p class="hint">Off by default: categories appear in the order apps were added. Turn this on to sort them A-Z instead.</p>

      <div class="panel__actions">
        <button type="button" class="secondary" @click="closeWithoutSaving">Cancel</button>
        <button type="button" :disabled="saving" @click="save">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 60;
}

.panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 320px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  animation: slide-in 0.18s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel__header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.icon-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  display: flex;
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.hint {
  margin: -0.4rem 0 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.field__label {
  font-size: 0.85rem;
}

.themes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem;
  border-radius: 12px;
  border: 2px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 500;
  min-width: 72px;
}

.theme-option.active {
  border-color: var(--accent);
}

.theme-option__swatch {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  width: 50px;
  height: 18px;
}

.theme-option__swatch span {
  flex: 1;
}

.segmented {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.segmented__option {
  flex: 1;
  border: none;
  background: var(--surface-2);
  color: var(--text-muted);
  padding: 0.45rem 0.4rem;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
}

.segmented__option + .segmented__option {
  border-left: 1px solid var(--border);
}

.segmented__option.active {
  background: var(--accent);
  color: var(--accent-contrast);
}

.panel__actions {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.panel__actions button {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: var(--accent);
  color: var(--accent-contrast);
  cursor: pointer;
  font-weight: 600;
}

.panel__actions button:disabled {
  opacity: 0.6;
  cursor: default;
}

.panel__actions button.secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}
</style>
