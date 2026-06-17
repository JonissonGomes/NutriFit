self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'NuFit', body: 'Nova notificação' }
  event.waitUntil(
    self.registration.showNotification(data.title || 'NuFit', {
      body: data.body || '',
      icon: '/favicon-192x192.png',
    })
  )
})
