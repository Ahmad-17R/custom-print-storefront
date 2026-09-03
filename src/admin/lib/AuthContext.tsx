import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, clearToken, type AuthEmployee } from '../../lib/api'

interface AuthState {
  user: AuthEmployee | null
  loading: boolean
  setUser: (u: AuthEmployee | null) => void
  logout: () => void
  can: (key: string) => boolean
}

const AuthCtx = createContext<AuthState>({ user: null, loading: true, setUser: () => {}, logout: () => {}, can: () => false })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthEmployee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMe().then(u => setUser(u)).finally(() => setLoading(false))
  }, [])

  const logout = () => { clearToken(); setUser(null) }

  // Owner can do anything; otherwise the right must be granted.
  const can = (key: string) => !!user && (user.isOwner || user.permissions.includes(key))

  return <AuthCtx.Provider value={{ user, loading, setUser, logout, can }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
