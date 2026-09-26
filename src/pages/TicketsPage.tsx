import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Inbox, LoaderCircle, X } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatDate, getSystemApps, getTickets, PRIORITIES, STATUSES } from '../api'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { PRIORITY, STATUS } from '../ticketMeta'

const selectClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200'

export function TicketsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tickets = useQuery({
    queryKey: ['tickets', params.toString()],
    queryFn: () => getTickets(params),
    placeholderData: keepPreviousData,
  })
  const apps = useQuery({ queryKey: ['system-apps'], queryFn: getSystemApps, staleTime: Infinity })

  // Cualquier cambio de filtro vuelve a la página 1.
  function update(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    }, { replace: key !== 'page' })
  }

  const hasFilters = ['status', 'priority', 'systemAppId', 'tenantId'].some((k) => params.has(k))
  const data = tickets.data
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">Tickets</h1>
        {tickets.isFetching && <LoaderCircle className="size-4 animate-spin text-slate-400" aria-label="Actualizando" />}
        {hasFilters && (
          <button onClick={() => setParams({}, { replace: true })}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
            <X className="size-4" aria-hidden /> Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <select aria-label="Estado" className={selectClass} value={params.get('status') ?? ''} onChange={(e) => update('status', e.target.value)}>
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
        <select aria-label="Prioridad" className={selectClass} value={params.get('priority') ?? ''} onChange={(e) => update('priority', e.target.value)}>
          <option value="">Todas las prioridades</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY[p].label}</option>)}
        </select>
        <select aria-label="Sistema origen" className={selectClass} value={params.get('systemAppId') ?? ''} onChange={(e) => update('systemAppId', e.target.value)}>
          <option value="">Todos los sistemas</option>
          {apps.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {/* Se aplica al salir del campo o con Enter, no en cada tecla. */}
        <form onSubmit={(e) => { e.preventDefault(); update('tenantId', (e.currentTarget.elements.namedItem('tenantId') as HTMLInputElement).value.trim()) }}>
          <input key={params.get('tenantId')} name="tenantId" aria-label="Tenant ID" placeholder="Tenant ID" enterKeyHint="search"
            defaultValue={params.get('tenantId') ?? ''} onBlur={(e) => e.currentTarget.form?.requestSubmit()} className={selectClass} />
        </form>
      </div>

      {tickets.isPending ? (
        <p className="py-12 text-center text-slate-500">Cargando…</p>
      ) : tickets.isError ? (
        <div className="py-12 text-center">
          <p className="text-red-600">No se pudieron cargar los tickets.</p>
          <button onClick={() => tickets.refetch()} className="mt-2 text-sm text-pink-700 underline">Reintentar</button>
        </div>
      ) : data!.items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-500">
          <Inbox className="size-8" aria-hidden />
          No hay tickets{hasFilters && ' con estos filtros'}.
        </div>
      ) : (
        <>
          {/* Tarjetas en móvil */}
          <ul className="space-y-2 md:hidden">
            {data!.items.map((t) => (
              <li key={t.id}>
                <Link to={`/tickets/${t.id}`} className="block space-y-2 rounded-lg border border-slate-200 bg-white p-3 active:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">#{t.ticketNumber}</span>
                    <span className="ml-auto flex gap-1"><PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></span>
                  </div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.systemAppName}{t.tenantName || t.tenantId ? ` · ${t.tenantName ?? t.tenantId}` : ''} · {formatDate(t.createdAtUtc)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Tabla en escritorio */}
          <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Sistema</th>
                  <th className="px-3 py-2">Tenant</th>
                  <th className="px-3 py-2">Prioridad</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data!.items.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500">{t.ticketNumber}</td>
                    <td className="px-3 py-2 font-medium">
                      <Link to={`/tickets/${t.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{t.title}</Link>
                    </td>
                    <td className="px-3 py-2">{t.systemAppName}</td>
                    <td className="px-3 py-2" title={t.tenantId ?? undefined}>{t.tenantName ?? t.tenantId ?? '—'}</td>
                    <td className="px-3 py-2"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-500">{formatDate(t.createdAtUtc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="flex items-center justify-between text-sm text-slate-600" aria-label="Paginación">
            <span>{data!.totalCount} tickets · Página {data!.page} de {totalPages}</span>
            <span className="flex gap-1">
              <button disabled={data!.page <= 1} onClick={() => update('page', String(data!.page - 1))} aria-label="Página anterior"
                className="rounded-md border border-slate-300 bg-white p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <button disabled={data!.page >= totalPages} onClick={() => update('page', String(data!.page + 1))} aria-label="Página siguiente"
                className="rounded-md border border-slate-300 bg-white p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </span>
          </nav>
        </>
      )}
    </div>
  )
}
