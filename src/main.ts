import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { initNativeChrome } from './services/nativeChrome'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Apply the cached theme before mounting so there's no flash of the
// default theme before the account's saved preference is confirmed.
useThemeStore().applyCached()

app.mount('#app')

void initNativeChrome()
