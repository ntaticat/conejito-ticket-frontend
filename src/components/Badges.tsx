import type { TicketPriority, TicketStatus } from '../api'
import { PRIORITY, STATUS, type BadgeStyle } from '../ticketMeta'

function Badge({ label, className, Icon }: BadgeStyle) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}

export const StatusBadge = ({ status }: { status: TicketStatus }) => <Badge {...STATUS[status]} />
export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => <Badge {...PRIORITY[priority]} />
