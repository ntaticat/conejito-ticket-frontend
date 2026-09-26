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

// Hay sesión aunque el access token haya expirado: se renueva con la cookie HttpOnly del refresh token.
export const hasSession = () => getSession() !== null

// Access token vigente o null si expiró.
export function getToken(): string | null {
  const session = getSession()
  return session && Date.parse(session.expiresAtUtc) > Date.now() ? session.accessToken : null
}
