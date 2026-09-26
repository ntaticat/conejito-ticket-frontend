import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../auth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  return getToken() ? children : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
}
