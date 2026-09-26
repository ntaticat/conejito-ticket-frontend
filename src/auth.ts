export type Session = { accessToken: string; expiresAtUtc: string }

const KEY = 'conejito.session'

function getSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

export const setSession = (session: Session) => localStorage.setItem(KEY, JSON.stringify(session))
export const clearSession = () => localStorage.removeItem(KEY)

// Token vigente o null (expirado = sin sesión).
export function getToken(): string | null {
  const session = getSession()
  return session && Date.parse(session.expiresAtUtc) > Date.now() ? session.accessToken : null
}
