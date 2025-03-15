import messages from '@intlify/unplugin-vue-i18n/messages'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import { GLADE_CONFIG } from './utils/storage'
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'

/**
 * https://cn.vitejs.dev/guide/build#load-error-handling
 */
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

const i18n = createI18n({
  locale: GLADE_CONFIG.value.locale || navigator.language,
  fallbackLocale: 'en',
  messages,
})

createApp(App).use(i18n).mount('#app')
