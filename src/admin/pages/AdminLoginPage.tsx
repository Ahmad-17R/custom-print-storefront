import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginInternal } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

export function AdminLoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [identifier, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setErr('')
    try {
      const { employee } = await loginInternal(identifier.trim(), password)
      setUser(employee)
      // Always land on the dashboard; AdminGate bounces to the first available page if not granted
      navigate('/admin', { replace: true })
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed')
    } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 14, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', fontFamily: FONT, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 36, width: 400, maxWidth: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: DARK, letterSpacing: -0.5 }}>MyPrintingWorld</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Staff & Admin Sign In</div>
        </div>

        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Email or Employee No.</label>
            <input style={inp} value={identifier} onChange={e => setId(e.target.value)} placeholder="ali@company.ae or EMP-001" autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 5 }}>Password</label>
            <input type="password" style={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading || !identifier || !password}
            style={{ marginTop: 6, padding: '12px', borderRadius: 10, border: 'none', background: (loading || !identifier || !password) ? '#CBD5E1' : DARK, color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: (loading || !identifier || !password) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#94A3B8' }}>
          Internal staff access only. Customers shop on the main store.
        </div>
      </div>
    </div>
  )
}
