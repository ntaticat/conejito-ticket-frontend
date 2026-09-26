/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// registerType 'autoUpdate': la versión nueva toma control sin esperar.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

type PushPayload = { title?: string; body?: string; url?: string; tag?: string }

// Payload esperado: JSON { title, body, url, tag }. Si llega texto plano (p. ej. el botón Push de DevTools), va como body.
self.addEventListener('push', (event) => {
  let data: PushPayload
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Conejito Ticket', {
      body: data.body,
      icon: '/pwa-192x192.png',
      tag: data.tag,
      data: { url: data.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Solo se navega dentro de la app, aunque el payload traiga otra URL.
  const target = new URL(event.notification.data?.url ?? '/', self.location.origin)
  const url = target.origin === self.location.origin ? target.href : self.location.origin
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (!open) return self.clients.openWindow(url)
      await open.focus()
      return open.navigate(url)
    })(),
  )
})
