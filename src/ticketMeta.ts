import {
  Archive, ArrowDown, ArrowUp, CircleCheck, CircleDot, Clock, Minus, TriangleAlert, type LucideIcon,
} from 'lucide-react'
import type { TicketPriority, TicketStatus, TicketType } from './api'

export type BadgeStyle = { label: string; className: string; Icon: LucideIcon }

export const STATUS: Record<TicketStatus, BadgeStyle> = {
  New: { label: 'Nuevo', className: 'bg-blue-50 text-blue-700 ring-blue-200', Icon: CircleDot },
  InProgress: { label: 'En proceso', className: 'bg-amber-50 text-amber-800 ring-amber-200', Icon: Clock },
  Resolved: { label: 'Resuelto', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CircleCheck },
  Closed: { label: 'Cerrado', className: 'bg-slate-100 text-slate-600 ring-slate-200', Icon: Archive },
}

export const PRIORITY: Record<TicketPriority, BadgeStyle> = {
  Low: { label: 'Baja', className: 'bg-slate-50 text-slate-600 ring-slate-200', Icon: ArrowDown },
  Medium: { label: 'Media', className: 'bg-sky-50 text-sky-700 ring-sky-200', Icon: Minus },
  High: { label: 'Alta', className: 'bg-orange-50 text-orange-700 ring-orange-200', Icon: ArrowUp },
  Critical: { label: 'Crítica', className: 'bg-red-600 text-white ring-red-700', Icon: TriangleAlert },
}

export const TYPE: Record<TicketType, string> = {
  Bug: 'Bug',
  FeatureRequest: 'Nueva funcionalidad',
  Question: 'Pregunta',
  Improvement: 'Mejora',
}
