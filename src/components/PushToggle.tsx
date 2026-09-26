import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api'

const VAPID_KEY: string | undefined = import.meta.env.VITE_VAPID_PUBLIC_KEY
const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// base64url → bytes; Safari no acepta la clave como string.
function toBytes(base64url: string) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

type State = 'loading' | 'on' | 'off' | 'denied' | 'unavailable'

export function PushToggle() {
  const [state, setState] = useState<State>(supported && VAPID_KEY ? 'loading' : 'unavailable')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!supported || !VAPID_KEY) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(Notification.permission === 'denied' ? 'denied' : sub ? 'on' : 'off'))
  }, [])

  async function enable() {
    setState('loading')
    setError(false)
    if ((await Notification.requestPermission()) !== 'granted') return setState('denied')
    const reg = await navigator.serviceWorker.ready
    let sub: PushSubscription | undefined
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(VAPID_KEY!) })
      await api('/push/subscriptions', { method: 'POST', body: JSON.stringify(sub.toJSON()) })
      setState('on')
    } catch {
      // Sin registro en el backend la suscripción no sirve: se deshace para no quedar a medias.
      await sub?.unsubscribe()
      setError(true)
      setState('off')
    }
  }

  async function disable() {
    setState('loading')
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription()
    if (sub) {
      // Si el DELETE falla, la baja local sigue: el backend borra la fila cuando el envío reciba 410.
      await api('/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {})
      await sub.unsubscribe()
    }
    setState('off')
  }

  const title = {
    loading: 'Cargando…',
    on: 'Notificaciones activadas en este dispositivo',
    off: error ? 'No se pudo activar. Inténtalo de nuevo.' : 'Activar notificaciones push en este dispositivo',
    denied: 'Notificaciones bloqueadas en la configuración del navegador',
    unavailable: VAPID_KEY
      ? 'Este navegador no admite notificaciones push. En iPhone, instala la app en la pantalla de inicio.'
      : 'Falta VITE_VAPID_PUBLIC_KEY',
  }[state]

  const Icon = state === 'loading' ? LoaderCircle : state === 'on' ? Bell : BellOff

  return (
    <button
      onClick={state === 'on' ? disable : enable}
      disabled={state === 'loading' || state === 'denied' || state === 'unavailable'}
      aria-pressed={state === 'on'}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
        state === 'on' ? 'bg-pink-50 text-pink-700 hover:bg-pink-100' : 'text-slate-600 hover:bg-slate-100'
      } ${error ? 'ring-1 ring-red-400' : ''}`}
    >
      <Icon className={`size-4 ${state === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
      <span className="hidden sm:inline">{state === 'on' ? 'Notificaciones activas' : 'Activar notificaciones'}</span>
      <span className="sr-only sm:hidden">{title}</span>
    </button>
  )
}
