import { clearSession, getToken, hasSession, setSession, type Session } from './auth'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let refreshing: Promise<boolean> | null = null

// Una sola renovación en vuelo aunque varias peticiones la pidan a la vez.
// Resuelve false si el servidor rechaza la sesión; un error de red se propaga (offline no cierra la sesión).
function refresh(): Promise<boolean> {
  refreshing ??= fetch('/api/v1/auth/refresh', { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) return false
      setSession(await res.json())
      return true
    })
    .finally(() => (refreshing = null))
  return refreshing
}

function expire(): never {
  clearSession()
  location.assign('/login')
  throw new ApiError(401, 'Sesión expirada')
}

async function request(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
  if (!getToken() && hasSession() && !(await refresh())) expire()

  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (typeof init.body === 'string') headers.set('Content-Type', 'application/json')

  const res = await fetch(`/api/v1${path}`, { ...init, headers })

  if (res.status === 401 && token) {
    if (!retried && (await refresh())) return request(path, init, true)
    expire()
  }
  if (!res.ok) {
    // El backend responde ProblemDetails; si no, se usa el status.
    const problem = await res.json().catch(() => null)
    throw new ApiError(res.status, problem?.title ?? `Error ${res.status}`)
  }
  return res
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await request(path, init)
  return res.status === 204 ? (undefined as T) : res.json()
}

export const login = (userName: string, password: string) =>
  api<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ userName, password }) })

// fetch directo: no debe intentar renovar la sesión que se está cerrando.
export const logout = () =>
  fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {}).finally(clearSession)

export const STATUSES = ['New', 'InProgress', 'Resolved', 'Closed'] as const
export type TicketStatus = (typeof STATUSES)[number]
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type TicketPriority = (typeof PRIORITIES)[number]
export type TicketType = 'Bug' | 'FeatureRequest' | 'Question' | 'Improvement'

export type Ticket = {
  id: string
  ticketNumber: number
  systemAppId: string
  systemAppName: string
  tenantId: string | null
  tenantName: string | null
  reporterUserName: string | null
  reporterUserEmail: string | null
  title: string
  type: TicketType
  priority: TicketPriority
  status: TicketStatus
  createdAtUtc: string
  resolvedAtUtc: string | null
}

export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number }
export type SystemApp = { id: string; name: string }

// Los filtros viven en la URL y se reenvían tal cual (status, priority, systemAppId, tenantId, page).
export const getTickets = (params: URLSearchParams) => api<Paged<Ticket>>(`/tickets?${params}`)
export const getSystemApps = () => api<SystemApp[]>('/system-apps')

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })

export type Attachment = { id: string; fileName: string; contentType: string; sizeBytes: number }

export type TicketDetail = Ticket & {
  reporterUserId: string | null
  description: string
  metadataJson: string | null
  attachments: Attachment[]
}

export const getTicket = (id: string) => api<TicketDetail>(`/tickets/${id}`)

export const updateTicketStatus = (id: string, status: TicketStatus) =>
  api<void>(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

// Blob con el token: <img src>/<a href> no pueden enviar el header Authorization.
export const getAttachmentBlob = (ticketId: string, attachmentId: string) =>
  request(`/tickets/${ticketId}/attachments/${attachmentId}`).then((r) => r.blob())
