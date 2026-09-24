export const THEMES = [
  'midnight',
  'slate',
  'sunset',
  'light',
  'plant',
  'plant-light',
  'coffee',
  'coffee-light',
] as const

export type ThemeId = (typeof THEMES)[number]

export interface ThemeOption {
  id: ThemeId
  label: string
  /** Swatch colours shown in the theme picker preview. */
  swatch: [string, string, string]
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'midnight', label: 'Midnight', swatch: ['#0f1218', '#4f46e5', '#f5f6fa'] },
  { id: 'slate', label: 'Slate', swatch: ['#15171b', '#14b8a6', '#eef0f3'] },
  { id: 'sunset', label: 'Sunset', swatch: ['#1a1114', '#f97362', '#fbeef0'] },
  { id: 'light', label: 'Light', swatch: ['#f4f5f8', '#4f46e5', '#171a21'] },
  { id: 'plant', label: 'Plant', swatch: ['#0f1a12', '#22c55e', '#eaf5ec'] },
  { id: 'plant-light', label: 'Plant (Light)', swatch: ['#f2f7f0', '#16a34a', '#16281a'] },
  { id: 'coffee', label: 'Coffee', swatch: ['#1a120c', '#c08552', '#f5ece2'] },
  { id: 'coffee-light', label: 'Coffee (Light)', swatch: ['#f7f0e6', '#8a5a2b', '#2b1d12'] },
]

export const DEFAULT_THEME: ThemeId = 'midnight'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}
