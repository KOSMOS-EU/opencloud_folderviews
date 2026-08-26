import { defineConfig } from '@opencloud-eu/extension-sdk'

export default defineConfig({
  name: 'folderviews',
  // msgreader (Outlook .msg) erwartet das Node-Global `global`
  // (Kopie aus opencloud_htmlviewer/vite.config.ts)
  define: {
    'global': 'globalThis'
  },
  build: {
    outDir: process.env.DIST_DIR || 'deploy/folderviews',
  }
})
