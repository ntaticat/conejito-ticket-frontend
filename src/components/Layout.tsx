import { LogOut, Server, Ticket } from 'lucide-react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout as endSession } from '../api'
import { PushToggle } from './PushToggle'

export function Layout() {
  const navigate = useNavigate()

  async function logout() {
    await endSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-7" />
            <span className="hidden sm:inline">Conejito Ticket</span>
          </Link>
          <nav className="flex gap-1" aria-label="Principal">
            {[
              { to: '/', label: 'Tickets', Icon: Ticket },
              { to: '/system-apps', label: 'Sistemas', Icon: Server },
            ].map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm ${
                  isActive ? 'bg-pink-50 font-medium text-pink-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto" />
          <PushToggle />
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Salir</span>
            <span className="sr-only sm:hidden">Salir</span>
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
