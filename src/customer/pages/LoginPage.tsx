import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ── Google logo SVG (official brand colours) ──────────────────────────────────
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleLogo() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.2C67.7 714 0 537.7 0 371.4c0-222.7 145.5-340.3 289.3-340.3 73.7 0 134.8 48.4 180.5 48.4 43.4 0 112.7-51.4 197.4-51.4 32.5 0 133.1 2.9 204.9 108.4zm-338-119c10.3-48.4 58.6-84.2 108.6-84.2 3.9 33.8-9.7 67-32.5 91.4-21.5 23.1-58 41.1-93.6 38.5z"/>
    </svg>
  )
}

function AuthSidebar() {
  return (
    <div style={{
      backgroundColor: '#0F172A', flex: '0 0 420px',
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      padding: '48px 40px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: '50%',
        backgroundImage: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60,
        width: 240, height: 240, borderRadius: '50%',
        backgroundImage: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
          <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
          <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
          <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
        </svg>
        <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#F8FAFC', letterSpacing: '-0.02em' }}>
          myprintingworld
        </span>
      </Link>

      {/* Copy */}
      <div style={{ flex: 1 }}>
        <h2 style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 800, fontSize: 32, color: '#F8FAFC',
          letterSpacing: '-0.03em', lineHeight: 1.15,
          margin: '0 0 16px',
        }}>
          Print your brand<br />
          <span style={{ color: '#1D4ED8' }}>identity.</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, margin: '0 0 40px' }}>
          Design online, print at 300 DPI, delivered across the UAE — fast.
        </p>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { icon: '✦', text: 'Business cards, letterheads, pens & more' },
            { icon: '✦', text: 'Browser-based design editor — no installs' },
            { icon: '✦', text: 'UAE-based studio, 24–48 hr turnaround' },
            { icon: '✦', text: 'Save & reorder your designs any time' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ color: '#1D4ED8', fontSize: 12, marginTop: 3, flexShrink: 0 }}>{f.icon}</span>
              <span style={{ color: '#A8A29E', fontSize: 14, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini product mockup row */}
      <div style={{ display: 'flex', gap: 10, marginTop: 40 }}>
        {[
          { bg: 'linear-gradient(135deg, #1D4ED8, #2563EB)', w: 80, h: 48 },
          { bg: 'linear-gradient(135deg, #1D4ED8, #2563EB)', w: 50, h: 70 },
          { bg: 'linear-gradient(135deg, #047857, #059669)', w: 48, h: 48, round: '50%' },
        ].map((m, i) => (
          <div key={i} style={{
            width: m.w, height: m.h, borderRadius: m.round ?? 6,
            backgroundImage: m.bg, opacity: 0.7, flexShrink: 0,
          }} />
        ))}
      </div>
    </div>
  )
}

// ── Supabase error → human-readable message ──────────────────────────────────
function friendlyError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (message.includes('Email not confirmed'))       return 'Please verify your email before signing in.'
  if (message.includes('Too many requests'))         return 'Too many attempts. Please wait a moment and try again.'
  if (message.includes('User not found'))            return 'No account found with that email.'
  if (message.includes('Network'))                   return 'Network error. Check your connection and try again.'
  return message || 'Something went wrong. Please try again.'
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: string })?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError(friendlyError((err as Error).message ?? ''))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      setError(friendlyError((err as Error).message ?? ''))
      setGoogleLoading(false)
    }
  }

  const handleApple = async () => {
    setError('')
    setAppleLoading(true)
    try {
      await signInWithApple()
    } catch (err: unknown) {
      setError(friendlyError((err as Error).message ?? ''))
      setAppleLoading(false)
    }
  }

  const inp = {
    width: '100%', boxSizing: 'border-box' as const,
    padding: '12px 16px', border: '1.5px solid #E2E8F0',
    borderRadius: 12, fontSize: 14, fontFamily: "'Poppins', system-ui, sans-serif",
    color: '#0F172A', backgroundColor: '#F8FAFC', outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex' }}>
      {/* Left sidebar — hidden on mobile */}
      <div className="auth-sidebar" style={{ display: 'flex' }}>
        <AuthSidebar />
      </div>

      {/* Right: form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F8FAFC', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="auth-mobile-logo" style={{ display: 'none', marginBottom: 32, justifyContent: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
                <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
                <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
                <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
              </svg>
              <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#0F172A', letterSpacing: '-0.02em' }}>myprintingworld</span>
            </Link>
          </div>

          <h1 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 800, fontSize: 28, color: '#0F172A',
            letterSpacing: '-0.02em', margin: '0 0 6px',
          }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'system-ui, sans-serif', margin: '0 0 28px', lineHeight: 1.5 }}>
            Sign in to manage your designs and orders.
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12,
              padding: '12px 14px', marginBottom: 20,
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="1.5"/>
                <path d="M8 5v3M8 11h.01" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, color: '#991B1B', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          {/* Social buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <button
              onClick={handleGoogle}
              disabled={googleLoading || appleLoading || loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                backgroundColor: 'white', border: '1.5px solid #E2E8F0',
                fontSize: 14, fontWeight: 600, color: '#0F172A',
                fontFamily: 'system-ui, sans-serif', transition: 'all 0.15s ease',
                opacity: googleLoading ? 0.7 : 1,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1D4ED8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}
            >
              {googleLoading ? <LoadingSpinner size={16} color="#64748B" /> : <GoogleLogo />}
              {googleLoading ? 'Signing in…' : 'Google'}
            </button>

            <button
              onClick={handleApple}
              disabled={appleLoading || googleLoading || loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                backgroundColor: '#0F172A', border: '1.5px solid #0F172A',
                fontSize: 14, fontWeight: 600, color: 'white',
                fontFamily: 'system-ui, sans-serif', transition: 'all 0.15s ease',
                opacity: appleLoading ? 0.7 : 1,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1E293B'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#0F172A'}
            >
              {appleLoading ? <LoadingSpinner size={16} color="white" /> : <AppleLogo />}
              {appleLoading ? 'Signing in…' : 'Apple'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: 13, color: '#A8A29E', fontFamily: 'system-ui, sans-serif' }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui, sans-serif', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui, sans-serif' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: 13, color: '#1D4ED8', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#64748B', padding: 4, display: 'flex',
                  }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading || googleLoading}
              className="stor-btn-primary"
              style={{
                width: '100%', backgroundColor: '#1D4ED8', color: 'white',
                border: 'none', borderRadius: 12, padding: '13px 16px',
                fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Poppins', system-ui, sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.75 : 1, marginTop: 4,
              }}
            >
              {loading ? <><LoadingSpinner size={16} color="white" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: 'center', fontSize: 14, color: '#64748B',
            fontFamily: 'system-ui, sans-serif', margin: '24px 0 0',
          }}>
            Don't have an account?{' '}
            <Link to="/signup" state={{ from }} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-sidebar { display: none !important; }
          .auth-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

// ── Tiny spinner ──────────────────────────────────────────────────────────────
function LoadingSpinner({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
