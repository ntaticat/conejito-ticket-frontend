import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, LoaderCircle, Plus, Power, PowerOff, Server } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import {
  createSystemApp, formatDate, getSystemApps, regenerateSystemAppSecret, setSystemAppActive,
  type SystemApp, type SystemAppCredentials,
} from '../api'
import { CopyButton, SecretDialog } from '../components/SecretDialog'

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200'

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
      {active ? 'Activa' : 'Inactiva'}
    </span>
  )
}

export function SystemAppsPage() {
  const queryClient = useQueryClient()
  // El secret solo vive aquí, en memoria, hasta que se cierra el diálogo.
  const [credentials, setCredentials] = useState<SystemAppCredentials | null>(null)
  const apps = useQuery({ queryKey: ['system-apps'], queryFn: getSystemApps, staleTime: Infinity })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['system-apps'] })

  const create = useMutation({
    mutationFn: createSystemApp,
    onSuccess: (result) => {
      setCredentials(result)
      return invalidate()
    },
  })
  const regenerate = useMutation({
    mutationFn: (app: SystemApp) => regenerateSystemAppSecret(app.id).then((r) => ({ ...r, name: app.name })),
    onSuccess: setCredentials,
  })
  const toggle = useMutation({
    mutationFn: (app: SystemApp) => setSystemAppActive(app.id, !app.isActive),
    onSuccess: invalidate,
  })

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name = String(new FormData(form).get('name')).trim()
    if (name) create.mutate(name, { onSuccess: () => form.reset() })
  }

  function confirmToggle(app: SystemApp) {
    const message = app.isActive
      ? `¿Desactivar "${app.name}"? Dejará de poder crear tickets de inmediato. Podrás reactivarlo después.`
      : `¿Reactivar "${app.name}"? Podrá volver a crear tickets con su secret actual.`
    if (confirm(message)) toggle.mutate(app)
  }

  function confirmRegenerate(app: SystemApp) {
    if (confirm(`¿Regenerar el secret de "${app.name}"? El secret actual dejará de funcionar en este momento.`))
      regenerate.mutate(app)
  }

  const busy = (app: SystemApp) =>
    (toggle.isPending && toggle.variables?.id === app.id) || (regenerate.isPending && regenerate.variables?.id === app.id)

  function actions(app: SystemApp) {
    const buttonClass = 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-40'
    return (
      <span className="flex flex-wrap justify-end gap-1">
        {busy(app) && <LoaderCircle className="size-4 self-center animate-spin text-slate-400" aria-label="Procesando" />}
        <button onClick={() => confirmRegenerate(app)} disabled={busy(app)} className={`${buttonClass} text-slate-700`}>
          <KeyRound className="size-4" aria-hidden /> Regenerar secret
        </button>
        <button onClick={() => confirmToggle(app)} disabled={busy(app)}
          className={`${buttonClass} ${app.isActive ? 'text-red-700' : 'text-emerald-700'}`}>
          {app.isActive ? <PowerOff className="size-4" aria-hidden /> : <Power className="size-4" aria-hidden />}
          {app.isActive ? 'Desactivar' : 'Reactivar'}
        </button>
      </span>
    )
  }

  const error = create.isError || regenerate.isError || toggle.isError

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sistemas origen</h1>
        <p className="text-sm text-slate-500">Aplicaciones que reportan tickets con sus credenciales (client ID y secret).</p>
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input name="name" required maxLength={150} placeholder="Nombre del nuevo sistema" aria-label="Nombre del nuevo sistema"
          className={inputClass} />
        <button type="submit" disabled={create.isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60">
          {create.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          Registrar
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">No se pudo completar la acción. Inténtalo de nuevo.</p>}

      {apps.isPending ? (
        <p className="py-12 text-center text-slate-500">Cargando…</p>
      ) : apps.isError ? (
        <div className="py-12 text-center">
          <p className="text-red-600">No se pudieron cargar los sistemas.</p>
          <button onClick={() => apps.refetch()} className="mt-2 text-sm text-pink-700 underline">Reintentar</button>
        </div>
      ) : apps.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <Server className="size-8" aria-hidden />
          Todavía no hay sistemas registrados.
        </div>
      ) : (
        <>
          {/* Tarjetas en móvil */}
          <ul className="space-y-2 md:hidden">
            {apps.data.map((app) => (
              <li key={app.id} className={`space-y-2 rounded-lg border border-slate-200 bg-white p-3 ${app.isActive ? '' : 'opacity-70'}`}>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{app.name}</p>
                  <span className="ml-auto"><ActiveBadge active={app.isActive} /></span>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <code className="break-all">{app.clientId}</code>
                  <CopyButton value={app.clientId} label="client ID" />
                </div>
                <p className="text-xs text-slate-500">Registrado {formatDate(app.createdAtUtc)}</p>
                {actions(app)}
              </li>
            ))}
          </ul>

          {/* Tabla en escritorio */}
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Client ID</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Registrado</th>
                  <th className="px-3 py-2"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.data.map((app) => (
                  <tr key={app.id} className={app.isActive ? '' : 'text-slate-500'}>
                    <td className="px-3 py-2 font-medium">{app.name}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1"><code>{app.clientId}</code><CopyButton value={app.clientId} label="client ID" /></span>
                    </td>
                    <td className="px-3 py-2"><ActiveBadge active={app.isActive} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatDate(app.createdAtUtc)}</td>
                    <td className="px-3 py-2">{actions(app)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SecretDialog credentials={credentials} onClose={() => setCredentials(null)} />
    </div>
  )
}
