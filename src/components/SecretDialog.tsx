import { Check, Copy, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { SystemAppCredentials } from '../api'

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" onClick={copy} aria-label={`Copiar ${label}`} title={`Copiar ${label}`}
      className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
    </button>
  )
}

// El secret se muestra una sola vez: solo se cierra con el botón, no con Escape ni clic afuera.
export function SecretDialog({ credentials, onClose }: { credentials: SystemAppCredentials | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (credentials && !dialog?.open) dialog?.showModal()
    if (!credentials && dialog?.open) dialog.close()
  }, [credentials])

  return (
    <dialog ref={ref} onCancel={(e) => e.preventDefault()} aria-labelledby="secret-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-slate-900/50">
      {credentials && (
        <div className="space-y-4 p-5">
          <h2 id="secret-title" className="text-lg font-semibold">Credenciales de {credentials.name}</h2>
          <p className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <TriangleAlert className="size-5 shrink-0" aria-hidden />
            Guarda el secret ahora: no se volverá a mostrar. Si lo pierdes, tendrás que regenerarlo.
          </p>
          {[
            { label: 'Client ID', value: credentials.clientId },
            { label: 'Client secret', value: credentials.clientSecret },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-xs text-slate-500">{label}</p>
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 pl-3">
                <code className="min-w-0 flex-1 break-all py-2 text-sm">{value}</code>
                <CopyButton value={value} label={label} />
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <button onClick={onClose} autoFocus
              className="rounded-md bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700">
              Ya lo guardé
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
