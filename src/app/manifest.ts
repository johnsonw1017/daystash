import type { MetadataRoute } from 'next'

const manifest = (): MetadataRoute.Manifest => ({
  id: '/',
  name: 'Daystash',
  short_name: 'Daystash',
  description: 'Stash your important moments in one place.',
  start_url: '/dashboard',
  scope: '/',
  display: 'standalone',
  background_color: '#dad5cd',
  theme_color: '#134b34',
  orientation: 'portrait-primary',
  categories: ['lifestyle', 'productivity'],
  icons: [
    {
      src: '/daystash-icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/daystash-icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
    {
      src: '/daystash-icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
  shortcuts: [
    {
      name: 'Write a journal',
      short_name: 'Write',
      url: '/write',
      icons: [{ src: '/daystash-icon-192.png', sizes: '192x192' }],
    },
    {
      name: 'View journals',
      short_name: 'Journals',
      url: '/dashboard',
      icons: [{ src: '/daystash-icon-192.png', sizes: '192x192' }],
    },
  ],
})

export default manifest
