import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const pwaManifest = {
  registerType:'autoUpdate',
  includeAssests:['favicon.ico', "apple-touch-icon.png", "masked-icon.svg"],
  manifest: {
    name:"schedule-it",
    short_name:"schedule-it",
    description:"Simple app for scheduling time-based tasks on a timeline",
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png'
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'  
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    theme_color:'#171717',
    background_color:'#f0e7db',
    display:"standalone",
    scope:'/',
    start_url:"/",
    orientation:'portrait'
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA(pwaManifest)],
})
