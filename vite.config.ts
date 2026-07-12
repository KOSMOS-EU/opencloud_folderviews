import { defineConfig } from '@opencloud-eu/extension-sdk'

export default defineConfig({
  name: 'folderviews',
  build: {
    outDir: process.env.DIST_DIR || 'deploy/folderviews',
    rolldownOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].mjs',
        chunkFileNames: 'js/[name]-[hash].mjs',
      },
    },
  }
})
