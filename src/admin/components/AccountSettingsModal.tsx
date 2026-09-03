import { useState } from 'react'
import { updateMyAccount } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

export function AccountSettingsModal({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth()
  const [username, setUsername] = useState(user?.employeeNo ?? '')
  const [current, setCurrent]   = useState('')
  const [newPass, setNewPass]   = useState('')
  const [posPass, setPosPass]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')
  const [ok, setOk]             = useState('')

  const submit = async () => {
    if (!current) { setErr('Enter your current password to confirm changes.'); return }
    setSaving(true); setErr(''); setOk('')
    try {
      const usernameChanged = username.trim() && username.trim() !== user?.employeeNo
      await updateMyAccount({
        currentPassword: current,
        ...(usernameChanged ? { newUsername: username.trim() } : {}),
        ...(newPass ? { newPassword: newPass } : {}),
        ...(posPass ? { newPosPassword: posPass } : {}),
      })
      setOk('Saved.')
      // If they changed their username or password, force a fresh login for a clean token
      if (usernameChanged || newPass) { setTimeout(() => logout(), 1200) }
      else { setCurrent(''); setNewPass(''); setPosPass('') }
    } catch (e: any) { setErr(e?.message ?? 'Failed to save') }
    finally { setSaving(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }
  const lbl = (t: string, hint?: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}{hint && <span style={{ fontWeight: 400, color: '#94A3B8' }}> — {hint}</span>}</div>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: FONT }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: 440, maxWidth: '100%', padding: 26 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 2 }}>My Account</div>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 18 }}>{user?.name}{user?.isOwner ? ' · Owner' : ''}</div>

        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{err}</div>}
        {ok  && <div style={{ background: '#F0FDF4', color: '#166534', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{ok}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>{lbl('Username (login)')}<input style={inp} value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. SuperAdmin" /></label>
          <label>{lbl('New Password', 'blank = keep')}<input type="password" style={inp} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New account password" /></label>
          <label>{lbl('New POS Password', 'blank = keep')}<input type="password" style={inp} value={posPass} onChange={e => setPosPass(e.target.value)} placeholder="Separate password for the POS counter" /></label>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <label>{lbl('Current Password', 'required to confirm')}<input type="password" style={inp} value={current} onChange={e => setCurrent(e.target.value)} placeholder="Your current password" /></label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Close</button>
          <button onClick={submit} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}
