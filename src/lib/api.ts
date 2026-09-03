const BASE = 'http://localhost:4000/api/v1'

const TOKEN_KEY = 'inkora_admin_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = `${method} ${path} → ${res.status}`
    try { message = JSON.parse(text)?.error ?? message } catch { message = text || message }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
}

// ── Internal (owner + employee) auth — against our own DB, not Supabase ────────
export interface AuthEmployee {
  id: string; employeeNo: string; name: string; email?: string | null
  role: string; jobTitle?: string | null; isOwner: boolean; permissions: string[]
  posRegisterId?: string | null; posRegisterName?: string | null
}

const AUTH_BASE = 'http://localhost:4000/employee/auth'

export async function loginInternal(identifier: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
  const isEmail = identifier.includes('@')
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isEmail ? { email: identifier, password } : { employeeNo: identifier, password }),
  })
  if (!res.ok) {
    const t = await res.text()
    let m = 'Login failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  const data = await res.json()
  setToken(data.token)
  return data
}

export async function updateMyAccount(body: { currentPassword: string; newUsername?: string; newPassword?: string; newPosPassword?: string }): Promise<{ ok: boolean; employeeNo: string }> {
  const token = getToken()
  const res = await fetch(`${AUTH_BASE}/account`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'Update failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

// Unlock the current logged-in operator's counter with just the POS password.
export async function posVerify(posPassword: string): Promise<{ ok: boolean; register: { id: string; name: string }; operator: { name: string } }> {
  const token = getToken()
  const res = await fetch(`${AUTH_BASE}/pos-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ posPassword }),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'POS unlock failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

export interface PosLoginResult { token: string; employee: { id: string; name: string; employeeNo: string }; register: { id: string; name: string } }
export async function posLogin(identifier: string, posPassword: string): Promise<PosLoginResult> {
  const isEmail = identifier.includes('@')
  const res = await fetch(`${AUTH_BASE}/pos-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isEmail ? { email: identifier, posPassword } : { employeeNo: identifier, posPassword }),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'POS login failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

export async function fetchMe(): Promise<AuthEmployee | null> {
  const token = getToken()
  if (!token) return null
  const res = await fetch(`${AUTH_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const p = await res.json()
  // /me returns the JWT payload (employeeId, no email) — normalize to AuthEmployee
  return {
    id: p.employeeId ?? p.id,
    employeeNo: p.employeeNo,
    name: p.name,
    email: p.email ?? null,
    role: p.role,
    jobTitle: p.jobTitle ?? null,
    isOwner: !!p.isOwner,
    permissions: Array.isArray(p.permissions) ? p.permissions : [],
    posRegisterId: p.posRegisterId ?? null,
    posRegisterName: p.posRegisterName ?? null,
  }
}
