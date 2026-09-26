import { useMutation } from '@tanstack/react-query'
import { LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError, login } from '../api'
import { clearSession, getToken, setSession } from '../auth'

export function LoginPage() {
  const navigate = useNavigate()
  const from: string = useLocation().state?.from ?? '/'
  const mutation = useMutation({
    mutationFn: ({ userName, password }: { userName: string; password: string }) => login(userName, password),
    onSuccess: (session) => {
      setSession(session)
      navigate(from, { replace: true })
    },
  })

  if (getToken()) return <Navigate to={from} replace />

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    clearSession()
    mutation.mutate({ userName: String(form.get('userName')), password: String(form.get('password')) })
  }

  const error = mutation.error
    ? mutation.error instanceof ApiError && mutation.error.status === 401
      ? 'Usuario o contraseña incorrectos.'
      : 'No se pudo conectar con el servidor.'
    : null

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 pb-2">
          <img src="/favicon.svg" alt="" className="size-14" />
          <h1 className="text-xl font-semibold">Conejito Ticket</h1>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Usuario</span>
          <input name="userName" required autoComplete="username" autoCapitalize="none"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-pink-600 px-4 py-2 font-medium text-white hover:bg-pink-700 disabled:opacity-60">
          {mutation.isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Entrar
        </button>
      </form>
    </div>
  )
}
