import { createClient, type Session } from '@supabase/supabase-js'
import { API_ORIGIN } from './api'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ── TEMPORARY local customer auth ────────────────────────────────────────────
// VITE_LOCAL_AUTH=true → storefront sign-up / sign-in go to our own backend
// (/customer/auth/local, needs LOCAL_AUTH=true there too) instead of Supabase.
// It exposes the same supabase.auth calls the app uses, so no page changes.
// Set VITE_LOCAL_AUTH=false (or remove it) to go back to Supabase.
export const LOCAL_AUTH = import.meta.env.VITE_LOCAL_AUTH === 'true'

const LOCAL_API = `${API_ORIGIN}/customer/auth/local`
const STORE_KEY = 'inkora_local_customer_session'
type Listener = (event: string, session: Session | null) => void
const listeners = new Set<Listener>()

const readSession = (): Session | null => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') } catch { return null }
}
const setSession = (s: Session | null, event: string) => {
  if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s)); else localStorage.removeItem(STORE_KEY)
  listeners.forEach(l => l(event, s))
}
async function post(path: string, body: unknown) {
  const res = await fetch(`${LOCAL_API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const json = await res.json().catch(() => ({}))
  return res.ok ? { session: json as Session, error: null } : { session: null, error: new Error(json.error ?? `Request failed (${res.status})`) }
}

const localClient = {
  auth: {
    async getSession() {
      const s = readSession()
      if (!s) return { data: { session: null }, error: null }
      // Drop a stored session the backend no longer accepts (expired / account removed)
      const ok = await fetch(`${LOCAL_API}/session`, { headers: { Authorization: `Bearer ${s.access_token}` } }).then(r => r.ok).catch(() => true)
      if (!ok) { setSession(null, 'SIGNED_OUT'); return { data: { session: null }, error: null } }
      return { data: { session: s }, error: null }
    },
    onAuthStateChange(cb: Listener) {
      listeners.add(cb)
      return { data: { subscription: { unsubscribe: () => { listeners.delete(cb) } } } }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const r = await post('/login', { email, password })
      if (r.session) setSession(r.session, 'SIGNED_IN')
      return { data: { session: r.session }, error: r.error }
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      const r = await post('/signup', { email, password, name: options?.data?.full_name })
      if (r.session) setSession(r.session, 'SIGNED_IN')
      return { data: { session: r.session }, error: r.error }
    },
    async signInWithOAuth(_opts: unknown) {
      return { data: null, error: new Error('Google / Apple sign-in is turned off in local mode — use email and password.') }
    },
    async signOut() {
      setSession(null, 'SIGNED_OUT')
      return { error: null }
    },
  },
}

export const supabase = (LOCAL_AUTH ? localClient : createClient(supabaseUrl, supabaseAnon)) as unknown as ReturnType<typeof createClient>
