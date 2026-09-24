import { defineStore } from 'pinia'

let hideTimer: ReturnType<typeof setTimeout> | null = null

/** Minimal transient toast/snackbar store used for quick user feedback. */
export const useToastStore = defineStore('toast', {
  state: () => ({
    message: '',
    visible: false,
  }),
  actions: {
    show(message: string, durationMs = 2500) {
      this.message = message
      this.visible = true
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = setTimeout(() => {
        this.visible = false
      }, durationMs)
    },
  },
})
