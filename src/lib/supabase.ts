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

// ── Supabase mode + team logins ──────────────────────────────────────────────
// Customers sign in with Supabase (email or Google / Apple). Authorised users of an account
// (team logins from My Account → Team) live in our own DB: if Supabase rejects an
// email + password, the same sign-in box tries the team login. Their session is kept apart.
const MEMBER_KEY = 'inkora_member_session'
const MEMBER_API = `${API_ORIGIN}/customer/auth/member`
const readMember = (): Session | null => {
  try { return JSON.parse(localStorage.getItem(MEMBER_KEY) ?? 'null') } catch { return null }
}
const setMember = (s: Session | null, event: string) => {
  if (s) localStorage.setItem(MEMBER_KEY, JSON.stringify(s)); else localStorage.removeItem(MEMBER_KEY)
  listeners.forEach(l => l(event, s))
}

function supabaseWithTeamLogins() {
  const real = createClient(supabaseUrl, supabaseAnon)
  const overrides = {
      async getSession() {
        const m = readMember()
        if (m) {
          const ok = await fetch(`${MEMBER_API}/session`, { headers: { Authorization: `Bearer ${m.access_token}` } }).then(r => r.ok).catch(() => true)
          if (ok) return { data: { session: m }, error: null }
          setMember(null, 'SIGNED_OUT')
        }
        return real.auth.getSession()
      },
      onAuthStateChange(cb: Listener) {
        listeners.add(cb)
        const { data } = real.auth.onAuthStateChange((event, s) => { if (!readMember()) cb(event, s) })
        return { data: { subscription: { unsubscribe: () => { listeners.delete(cb); data.subscription.unsubscribe() } } } }
      },
      async signInWithPassword(creds: { email: string; password: string }) {
        const r = await real.auth.signInWithPassword(creds)
        if (!r.error) { localStorage.removeItem(MEMBER_KEY); return r }
        const res = await fetch(`${MEMBER_API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          // 401 = not a team login either → show Supabase's own message
          return res.status === 401 ? r : { data: { session: null, user: null }, error: new Error(j.error ?? 'Sign in failed') }
        }
        const session = await res.json() as Session
        await real.auth.signOut().catch(() => {})
        setMember(session, 'SIGNED_IN')
        return { data: { session, user: session.user }, error: null }
      },
      async signOut() {
        if (readMember()) { setMember(null, 'SIGNED_OUT'); return { error: null } }
        return real.auth.signOut()
      },
  }
  // Everything not overridden (signUp, signInWithOAuth, resetPasswordForEmail, …) goes straight
  // to Supabase — a Proxy, because auth is a class instance and spreading would drop its methods
  const auth = new Proxy(real.auth, {
    get(target, prop, receiver) {
      if (prop in overrides) return overrides[prop as keyof typeof overrides]
      const v = Reflect.get(target, prop, receiver)
      return typeof v === 'function' ? v.bind(target) : v
    },
  })
  return new Proxy(real, { get: (target, prop, receiver) => prop === 'auth' ? auth : Reflect.get(target, prop, receiver) })
}

export const supabase = (LOCAL_AUTH ? localClient : supabaseWithTeamLogins()) as unknown as ReturnType<typeof createClient>
