import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ApiError } from './api'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import './index.css'
import { LoginPage } from './pages/LoginPage'
import { SystemAppsPage } from './pages/SystemAppsPage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { TicketsPage } from './pages/TicketsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    // Los 4xx no se arreglan reintentando.
    queries: { retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2 },
  },
})

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><Layout /></RequireAuth>,
    children: [
      { index: true, element: <TicketsPage /> },
      { path: 'tickets/:id', element: <TicketDetailPage /> },
      { path: 'system-apps', element: <SystemAppsPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
