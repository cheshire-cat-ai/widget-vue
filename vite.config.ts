import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from "unplugin-icons/resolver"
import { HeadlessUiResolver } from 'unplugin-vue-components/resolvers'
import Components from "unplugin-vue-components/vite"
import AutoImport from 'unplugin-auto-import/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: true,
      imports: [
        'vue',
        '@vueuse/core',
        'pinia'
      ],
      eslintrc: {
        enabled: true
      }
    }),
    Components({
      dts: true,
      resolvers: [
        HeadlessUiResolver({ prefix: "" }),
        IconsResolver({ prefix: "" })
      ]
    }),
    Icons({ autoInstall: true }),
    tsconfigPaths()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        minifyInternalExports: true,
        entryFileNames: 'assets/widget.js',
        assetFileNames: (info) => `assets/${info.name?.endsWith('css') ? 'widget' : '[name]'}[extname]`,
        chunkFileNames: 'chunk.js',
        manualChunks: () => 'chunk.js',
        generatedCode: {
          preset: 'es2015',
          constBindings: true,
          objectShorthand: true
        }
      }
    }
  }
})
