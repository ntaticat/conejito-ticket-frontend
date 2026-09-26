import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasSession } from '../auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  return hasSession() ? children : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}
