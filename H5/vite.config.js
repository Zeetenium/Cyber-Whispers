import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
    }),
    Components({
      dirs: ['src/components'], 
    }),
    Legacy({
      targets: ['defaults', 'not IE 11'] 
    })
  ],
  base: './',
})