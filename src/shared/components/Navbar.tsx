import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function StampMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
      <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
      <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
      <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
    </svg>
  )
}

// ── User menu (avatar dropdown) ───────────────────────────────────────────────
function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  if (!user) return null

  const displayName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '?'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  const avatar: string | undefined = user.user_metadata?.avatar_url

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Account menu"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: open ? '2px solid #1D4ED8' : '2px solid transparent',
          overflow: 'hidden', cursor: 'pointer', backgroundColor: 'transparent',
          padding: 0, transition: 'border-color 0.15s ease', flexShrink: 0,
        }}
      >
        {avatar ? (
          <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', backgroundColor: '#1D4ED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}>
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          backgroundColor: 'white', border: '1px solid #E2E8F0',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(28,25,23,0.12)',
          minWidth: 220, zIndex: 300, overflow: 'hidden',
          animation: 'stor-fadeInUp 0.15s ease both',
        }}>
          {/* User info header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F3EE' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui, sans-serif', lineHeight: 1.3 }}>
              {displayName}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#78716C', fontFamily: 'system-ui, sans-serif' }}>
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          {[
            { label: 'My Designs', icon: 'M4 6h16M4 10h16M4 14h8', onClick: () => { setOpen(false); navigate('/editor') } },
            { label: 'My Orders', icon: 'M3 6l1 12h16l1-12H3zM8 6V4a2 2 0 014 0v2', onClick: () => setOpen(false) },
            { label: 'Account Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z', onClick: () => setOpen(false) },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.onClick}
              style={{
                width: '100%', backgroundColor: 'transparent', border: 'none',
                padding: '11px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left', transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#78716C', flexShrink: 0 }}>
                <path d={item.icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 14, color: '#0F172A', fontFamily: 'system-ui, sans-serif' }}>{item.label}</span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid #F5F3EE' }}>
            <button
              onClick={async () => { setOpen(false); await signOut(); navigate('/') }}
              style={{
                width: '100%', backgroundColor: 'transparent', border: 'none',
                padding: '11px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                textAlign: 'left', transition: 'background 0.1s ease',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FEF2F2'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 14, color: '#EF4444', fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, loading } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  const navBg = scrolled ? 'rgba(250,250,248,0.94)' : '#16151D'
  const foreground = scrolled ? '#0F172A' : '#F8FAFC'
  const linkColor = scrolled ? '#334155' : '#E2E8F0'
  const outlineBorder = scrolled ? '#CBD5E1' : 'rgba(248,250,252,0.72)'

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      backgroundColor: navBg,
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid #E2E8F0' : '1px solid transparent',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', height: 64, gap: 8,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <StampMark />
          <span style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: foreground, letterSpacing: '-0.02em', lineHeight: 1, transition: 'color 0.3s ease' }}>
            myprintingworld
          </span>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="stor-desktop-nav">
          <Link to="/products" className="stor-nav-link" style={{ textDecoration: 'none', color: linkColor, fontSize: 15, fontWeight: 500, fontFamily: 'system-ui, sans-serif' }}>
            Products
          </Link>
          <a href="#how-it-works" className="stor-nav-link" style={{ textDecoration: 'none', color: linkColor, fontSize: 15, fontWeight: 500, fontFamily: 'system-ui, sans-serif' }}>
            How it works
          </a>
          <a href="#trust" className="stor-nav-link" style={{ textDecoration: 'none', color: linkColor, fontSize: 15, fontWeight: 500, fontFamily: 'system-ui, sans-serif' }}>
            Why MyPrintingWorld
          </a>
        </div>

        <div style={{ flex: 1 }} className="stor-desktop-nav" />

        {/* Auth section */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }} className="stor-desktop-nav">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/editor')}
                  className="stor-btn-primary"
                  style={{
                    backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                    borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Start Designing
                </button>
                <UserMenu />
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="stor-btn-outline"
                  style={{
                    backgroundColor: 'transparent', color: foreground,
                    border: `1.5px solid ${outlineBorder}`, borderRadius: 8,
                    padding: '9px 18px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="stor-btn-primary"
                  style={{
                    backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                    borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        )}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ display: 'none', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 8, color: foreground, flexShrink: 0 }}
          className="stor-hamburger"
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '16px 24px', display: 'flex', flexDirection: 'column' }}>
          {[
            { label: 'Products', action: () => { setMenuOpen(false); navigate('/products') } },
            { label: 'How it works', action: () => { setMenuOpen(false); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }) } },
            { label: 'Why MyPrintingWorld', action: () => { setMenuOpen(false); document.querySelector('#trust')?.scrollIntoView({ behavior: 'smooth' }) } },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{ display: 'block', padding: '14px 0', color: '#334155', backgroundColor: 'transparent', border: 'none', textAlign: 'left', fontSize: 16, fontWeight: 500, borderBottom: '1px solid #E2E8F0', fontFamily: 'system-ui, sans-serif', cursor: 'pointer' }}
            >
              {item.label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {user ? (
              <button
                onClick={() => { setMenuOpen(false); navigate('/editor') }}
                style={{ flex: 1, backgroundColor: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}
              >
                Start Designing
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/login') }}
                  style={{ flex: 1, backgroundColor: 'white', color: '#0F172A', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/signup') }}
                  style={{ flex: 1, backgroundColor: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .stor-desktop-nav { display: none !important; }
          .stor-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
