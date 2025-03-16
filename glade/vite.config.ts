import path from 'node:path'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/glade/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-import.d.ts',
    }),
    Components({
      dts: 'src/components.d.ts',
    }),
    VueI18nPlugin({
      include: [path.resolve(__dirname, './src/locales/**')],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          '@glade-app/core': ['@glade-app/core'],
          '@glade-app/plugins': ['@glade-app/plugins'],
        },
      },
    },
  },
})
