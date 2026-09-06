const CACHE_PREFIX = 'daystash-shell-'
const CACHE_NAME = `${CACHE_PREFIX}v2`
const APP_SHELL = [
  '/offline.html',
  '/manifest.webmanifest',
  '/daystash-leaf.svg',
  '/daystash-icon-192.png',
  '/daystash-icon-512.png',
  '/daystash-icon-maskable-512.png',
]

const cacheOfflineWorkspace = async (cache) => {
  try {
    const response = await fetch('/offline')
    if (!response.ok) return

    await cache.put('/offline', response.clone())

    const html = await response.text()
    const assetPaths = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path.startsWith('/_next/static/'))

    await Promise.allSettled(
      [...new Set(assetPaths)].map((path) => cache.add(path))
    )
  } catch {
    // Keep the basic offline fallback installable if the workspace is unavailable.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL)
      await cacheOfflineWorkspace(cache)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        if (url.pathname === '/offline') {
          return (
            (await caches.match('/offline')) ||
            (await caches.match('/offline.html'))
          )
        }

        return Response.redirect(new URL('/offline', self.location.origin), 302)
      })
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached

        const response = await fetch(request)
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
        return response
      })
    )
    return
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    )
  }
})
