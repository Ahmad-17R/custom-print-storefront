import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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

function LoadingSpinner({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

// ── Password strength ─────────────────────────────────────────────────────────
function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#F59E0B' }
  if (score <= 3) return { score, label: 'Good', color: '#3B82F6' }
  return { score, label: 'Strong', color: '#10B981' }
}

function friendlyError(message: string): string {
  if (message.includes('User already registered'))   return 'An account with this email already exists. Try signing in.'
  if (message.includes('Password should be'))        return 'Password must be at least 6 characters.'
  if (message.includes('Unable to validate'))        return 'Please enter a valid email address.'
  if (message.includes('Network'))                   return 'Network error. Check your connection and try again.'
  return message || 'Something went wrong. Please try again.'
}

function AuthSidebar() {
  return (
    <div style={{
      backgroundColor: '#0F172A', flex: '0 0 420px',
      display: 'flex', flexDirection: 'column', minHeight: '100%',
      padding: '48px 40px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 320, height: 320,
        borderRadius: '50%', pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60, width: 240, height: 240,
        borderRadius: '50%', pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(29,78,216,0.08) 0%, transparent 70%)',
      }} />

      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
          <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
          <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
          <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
        </svg>
        <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#F8FAFC', letterSpacing: '-0.02em' }}>myprintingworld</span>
      </Link>

      <div style={{ flex: 1 }}>
        <h2 style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 800, fontSize: 32, color: '#F8FAFC',
          letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px',
        }}>
          Start designing<br /><span style={{ color: '#1D4ED8' }}>for free.</span>
        </h2>
        <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'system-ui, sans-serif', lineHeight: 1.6, margin: '0 0 40px' }}>
          Join 10,000+ UAE businesses that trust MyPrintingWorld for their print needs.
        </p>

        {/* Social proof */}
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)', padding: '20px 20px 16px',
        }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
            {['#1D4ED8', '#0369A1', '#7C3AED', '#047857', '#B45309'].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%', backgroundColor: c,
                border: '2px solid #0F172A', marginLeft: i === 0 ? 0 : -8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'white', fontWeight: 700,
              }}>
                {['A', 'M', 'F', 'S', 'K'][i]}
              </div>
            ))}
            <span style={{ marginLeft: 12, fontSize: 13, color: '#A8A29E', fontFamily: 'system-ui, sans-serif', alignSelf: 'center' }}>
              +9,990 businesses
            </span>
          </div>
          <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
            {[1,2,3,4,5].map(n => (
              <svg key={n} width="14" height="14" viewBox="0 0 14 14" fill="#3B82F6"><path d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5z"/></svg>
            ))}
          </div>
          <p style={{ color: '#64748B', fontSize: 13, fontFamily: 'system-ui, sans-serif', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            "MyPrintingWorld's online editor saved us hours. Our business cards looked exactly as designed."
          </p>
          <p style={{ color: '#57534E', fontSize: 12, fontFamily: 'system-ui, sans-serif', margin: '8px 0 0' }}>
            — Fatima A., Dubai
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SignupPage() {
  const { signUp, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)

  const strength = passwordStrength(password)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!agreed) { setError('Please accept the terms to continue.'); return }
    setError('')
    setLoading(true)
    try {
      await signUp(name.trim(), email, password)
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
    padding: '12px 14px', border: '1.5px solid #E2E8F0',
    borderRadius: 10, fontSize: 15, fontFamily: 'system-ui, sans-serif',
    color: '#0F172A', backgroundColor: '#F8FAFC', outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div style={{ height: '100%', minHeight: '100vh', display: 'flex' }}>
      <div className="auth-sidebar" style={{ display: 'flex' }}>
        <AuthSidebar />
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F8FAFC', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
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
            Create your account
          </h1>
          <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'system-ui, sans-serif', margin: '0 0 28px' }}>
            Free forever. No credit card required.
          </p>

          {error && (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
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
              onClick={handleGoogle} disabled={googleLoading || appleLoading || loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                backgroundColor: 'white', border: '1.5px solid #E2E8F0',
                fontSize: 14, fontWeight: 600, color: '#0F172A',
                fontFamily: 'system-ui, sans-serif', transition: 'border-color 0.15s ease',
                opacity: googleLoading ? 0.7 : 1,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#1D4ED8'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'}
            >
              {googleLoading ? <LoadingSpinner size={16} color="#64748B" /> : <GoogleLogo />}
              {googleLoading ? 'Continuing…' : 'Google'}
            </button>

            <button
              onClick={handleApple} disabled={appleLoading || googleLoading || loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                backgroundColor: '#0F172A', border: '1.5px solid #0F172A',
                fontSize: 14, fontWeight: 600, color: 'white',
                fontFamily: 'system-ui, sans-serif', transition: 'background-color 0.15s ease',
                opacity: appleLoading ? 0.7 : 1,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#1E293B'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#0F172A'}
            >
              {appleLoading ? <LoadingSpinner size={16} color="white" /> : <AppleLogo />}
              {appleLoading ? 'Continuing…' : 'Apple'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <span style={{ fontSize: 13, color: '#A8A29E', fontFamily: 'system-ui, sans-serif' }}>or with email</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui, sans-serif', marginBottom: 6 }}>
                Full name
              </label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Ahmad Al-Rashid" style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui, sans-serif', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
                onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui, sans-serif', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex' }}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 2l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>
                  )}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        backgroundColor: i <= strength.score ? strength.color : '#E2E8F0',
                        transition: 'background-color 0.2s ease',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: strength.color, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#1D4ED8', flexShrink: 0, width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                I agree to the{' '}
                <a href="#" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
                {' '}and{' '}
                <a href="#" style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
              </span>
            </label>

            <button
              type="submit" disabled={loading || googleLoading || !agreed}
              className="stor-btn-primary"
              style={{
                width: '100%', backgroundColor: !agreed ? '#E2E8F0' : '#1D4ED8',
                color: !agreed ? '#A8A29E' : 'white',
                border: 'none', borderRadius: 10, padding: '13px 16px',
                fontSize: 15, fontWeight: 700,
                cursor: loading || !agreed ? 'not-allowed' : 'pointer',
                fontFamily: 'system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: loading ? 0.75 : 1, marginTop: 4,
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              {loading ? <><LoadingSpinner size={16} color="white" /> Creating account…</> : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', fontFamily: 'system-ui, sans-serif', margin: '24px 0 0' }}>
            Already have an account?{' '}
            <Link to="/login" state={{ from }} style={{ color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
            >
              Sign in
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
