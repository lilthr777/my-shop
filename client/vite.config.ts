import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'semi-css': path.resolve(__dirname, 'node_modules/@douyinfe/semi-ui/dist/css/semi.min.css'),
    },
  },
})
