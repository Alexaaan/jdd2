const CACHE_NAME = "jdd-platform-v1"
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg",
  "/matches",
  "/tournaments",
  "/rankings",
  "/profile",
  "/calendar",
]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nouvelle notification JDD Platform",
    icon: "/icon-192.jpg",
    badge: "/icon-72.jpg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Voir",
        icon: "/icon-192.jpg",
      },
      {
        action: "close",
        title: "Fermer",
        icon: "/icon-192.jpg",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("JDD Platform", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
