import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, CircleCheck, Clock, LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError, formatDate, getTicket, updateTicketStatus, type TicketStatus } from '../api'
import { AttachmentItem } from '../components/AttachmentItem'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { MetadataViewer } from '../components/MetadataViewer'
import { TYPE } from '../ticketMeta'

const ACTIONS: { status: TicketStatus; label: string; Icon: LucideIcon; className: string }[] = [
  { status: 'InProgress', label: 'En proceso', Icon: Clock, className: 'bg-amber-500 hover:bg-amber-600' },
  { status: 'Resolved', label: 'Resuelto', Icon: CircleCheck, className: 'bg-emerald-600 hover:bg-emerald-700' },
  { status: 'Closed', label: 'Cerrar', Icon: Archive, className: 'bg-slate-600 hover:bg-slate-700' },
]

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="break-words text-sm">{children || '—'}</dd>
    </div>
  )
}

export function TicketDetailPage() {
  const id = useParams().id!
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const ticket = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) })
  const status = useMutation({
    mutationFn: (s: TicketStatus) => updateTicketStatus(id, s),
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ticket', id] }),
      queryClient.invalidateQueries({ queryKey: ['tickets'] }),
    ]),
  })

  // Volver conserva los filtros si se llegó desde la lista; si se abrió el enlace directo, va al inicio.
  const back = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  const backButton = (
    <button onClick={back} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
      <ArrowLeft className="size-4" aria-hidden /> Tickets
    </button>
  )

  if (ticket.isPending) return <p className="py-12 text-center text-slate-500">Cargando…</p>
  if (ticket.isError) {
    const notFound = ticket.error instanceof ApiError && ticket.error.status === 404
    return (
      <div className="space-y-4">
        {backButton}
        <p className="py-12 text-center text-red-600">{notFound ? 'Ticket no encontrado.' : 'No se pudo cargar el ticket.'}</p>
      </div>
    )
  }

  const t = ticket.data
  return (
    <div className="space-y-6">
      {backButton}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>#{t.ticketNumber}</span>
          <span>·</span>
          <span>{TYPE[t.type]}</span>
          <PriorityBadge priority={t.priority} />
          <StatusBadge status={t.status} />
        </div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
      </header>

      <section aria-label="Cambiar estado" className="flex flex-wrap items-center gap-2">
        {ACTIONS.map(({ status: s, label, Icon, className }) => (
          <button key={s} onClick={() => status.mutate(s)} disabled={status.isPending || t.status === s}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-40 ${className}`}>
            {status.isPending && status.variables === s
              ? <LoaderCircle className="size-4 animate-spin" aria-hidden />
              : <Icon className="size-4" aria-hidden />}
            {label}
          </button>
        ))}
        {status.isError && <p role="alert" className="text-sm text-red-600">No se pudo cambiar el estado.</p>}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="space-y-2 md:col-span-2">
          <h2 className="font-semibold">Descripción</h2>
          <p className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white p-4 text-sm">{t.description}</p>
        </section>

        <dl className="grid grid-cols-2 gap-3 self-start rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-1">
          <Field label="Sistema origen">{t.systemAppName}</Field>
          <Field label="Tenant">
            {t.tenantName}{t.tenantId && <span className="block text-xs text-slate-500">{t.tenantId}</span>}
          </Field>
          <Field label="Reportado por">
            {t.reporterUserName}
            {t.reporterUserEmail && <a href={`mailto:${t.reporterUserEmail}`} className="block text-xs text-pink-700 hover:underline">{t.reporterUserEmail}</a>}
            {t.reporterUserId && <span className="block text-xs text-slate-500">{t.reporterUserId}</span>}
          </Field>
          <Field label="Creado">{formatDate(t.createdAtUtc)}</Field>
          <Field label="Resuelto">{t.resolvedAtUtc && formatDate(t.resolvedAtUtc)}</Field>
        </dl>
      </div>

      {t.metadataJson && (
        <section className="space-y-2">
          <h2 className="font-semibold">Metadata</h2>
          <MetadataViewer json={t.metadataJson} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">Adjuntos ({t.attachments.length})</h2>
        {t.attachments.length === 0 ? (
          <p className="text-sm text-slate-500">Sin adjuntos.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {t.attachments.map((a) => <AttachmentItem key={a.id} ticketId={t.id} attachment={a} />)}
          </ul>
        )}
      </section>
    </div>
  )
}
