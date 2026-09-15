import { useEffect, useState } from 'react'
import { AdminLayout, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
const STATUS_COLOR: Record<string, string> = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444', paid: '#059669', recovered: '#64748B', cancelled: '#94A3B8' }

const input: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: FONT }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }
const btn: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }

interface LeaveRow { id: string; leaveType: string; startDate: string; endDate: string; status: string; reason?: string | null; createdAt: string }
interface AdvanceRow { id: string; amount: string; status: string; reason?: string | null; createdAt: string }
interface ReqRow { id: string; note?: string | null; status: string; neededBy?: string | null; createdAt: string }

export function MyRequestsPage() {
  const { user } = useAuth()
  const eid = user?.id ?? ''
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [advances, setAdvances] = useState<AdvanceRow[]>([])
  const [requisitions, setRequisitions] = useState<ReqRow[]>([])
  const [msg, setMsg] = useState('')
  // Requisition form
  const [reqNote, setReqNote] = useState('')
  const [reqNeededBy, setReqNeededBy] = useState('')

  // Leave form
  const [leaveType, setLeaveType] = useState('annual')
  const [startDate, setStart] = useState('')
  const [endDate, setEnd] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  // Advance form
  const [amount, setAmount] = useState('')
  const [advReason, setAdvReason] = useState('')
  const [busy, setBusy] = useState('')

  const load = () => {
    if (!eid) return
    api.get<{ data: LeaveRow[] }>(`/leave?employeeId=${eid}&pageSize=100`).then(r => setLeaves(r.data)).catch(() => {})
    api.get<{ data: AdvanceRow[] }>(`/advances?employeeId=${eid}&pageSize=100`).then(r => setAdvances(r.data)).catch(() => {})
    api.get<{ data: ReqRow[] }>(`/purchase-requisitions?requestedBy=${eid}&pageSize=100`).then(r => setRequisitions(r.data)).catch(() => {})
  }
  useEffect(load, [eid])

  const submitLeave = async () => {
    if (!startDate || !endDate) return setMsg('Pick start and end dates')
    setBusy('leave'); setMsg('')
    try { await api.post('/leave', { employeeId: eid, leaveType, startDate, endDate, reason: leaveReason.trim() || null }); setStart(''); setEnd(''); setLeaveReason(''); setMsg('Leave request submitted ✓'); load() }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy('') }
  }
  const submitAdvance = async () => {
    if (!(Number(amount) > 0)) return setMsg('Enter an amount')
    setBusy('advance'); setMsg('')
    try { await api.post('/advances', { employeeId: eid, amount: Number(amount), reason: advReason.trim() || null }); setAmount(''); setAdvReason(''); setMsg('Advance request submitted ✓'); load() }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy('') }
  }
  const submitRequisition = async () => {
    if (!reqNote.trim()) return setMsg('Describe what you need')
    setBusy('req'); setMsg('')
    try {
      const created = await api.post<{ id: string }>('/purchase-requisitions', { note: reqNote.trim(), neededBy: reqNeededBy || null })
      await api.post(`/purchase-requisitions/${created.id}/submit`, {})
      setReqNote(''); setReqNeededBy(''); setMsg('Requisition submitted ✓'); load()
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Failed') }
    finally { setBusy('') }
  }

  return (
    <AdminLayout title="My Requests">
      <div style={{ maxWidth: 820, fontFamily: FONT }}>
        {msg && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.includes('✓') ? '#ECFDF5' : '#FEF2F2', color: msg.includes('✓') ? '#059669' : '#B91C1C' }}>{msg}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Leave request */}
          <div style={card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: DARK }}>Request Leave</h3>
            <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Type</span>
              <select style={input} value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                {['annual', 'sick', 'unpaid', 'emergency'].map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label><span style={label}>From</span><input type="date" style={input} value={startDate} onChange={e => setStart(e.target.value)} /></label>
              <label><span style={label}>To</span><input type="date" style={input} value={endDate} onChange={e => setEnd(e.target.value)} /></label>
            </div>
            <label style={{ display: 'block', marginBottom: 16 }}><span style={label}>Reason (optional)</span><input style={input} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} /></label>
            <button style={btn} onClick={submitLeave} disabled={busy === 'leave'}>{busy === 'leave' ? 'Submitting…' : 'Submit leave request'}</button>
          </div>

          {/* Advance request */}
          <div style={card}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: DARK }}>Request Salary Advance</h3>
            <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Amount (AED)</span><input type="number" min={0} step="0.01" style={input} value={amount} onChange={e => setAmount(e.target.value)} /></label>
            <label style={{ display: 'block', marginBottom: 16 }}><span style={label}>Reason (optional)</span><input style={input} value={advReason} onChange={e => setAdvReason(e.target.value)} /></label>
            <button style={btn} onClick={submitAdvance} disabled={busy === 'advance'}>{busy === 'advance' ? 'Submitting…' : 'Submit advance request'}</button>
          </div>

          {/* Requisition / supplies request */}
          <div style={{ ...card, gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, color: DARK }}>Request Supplies / Purchase</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'end' }}>
              <label><span style={label}>What do you need?</span><input style={input} value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="e.g. 2 boxes of A4 paper, printer toner, ink cartridges…" /></label>
              <label><span style={label}>Needed by (optional)</span><input type="date" style={input} value={reqNeededBy} onChange={e => setReqNeededBy(e.target.value)} /></label>
            </div>
            <button style={{ ...btn, marginTop: 14 }} onClick={submitRequisition} disabled={busy === 'req'}>{busy === 'req' ? 'Submitting…' : 'Submit requisition'}</button>
          </div>
        </div>

        {/* My history */}
        <h3 style={{ margin: '0 0 10px', fontSize: 15, color: DARK }}>My Requests</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {[...leaves.map(l => ({ kind: 'Leave', id: l.id, detail: `${l.leaveType} · ${String(l.startDate).slice(0, 10)} → ${String(l.endDate).slice(0, 10)}`, status: l.status, when: l.createdAt })),
            ...advances.map(a => ({ kind: 'Advance', id: a.id, detail: `${money(a.amount)}${a.reason ? ` · ${a.reason}` : ''}`, status: a.status, when: a.createdAt })),
            ...requisitions.map(q => ({ kind: 'Requisition', id: q.id, detail: q.note ?? '—', status: q.status === 'pending_approval' ? 'pending' : q.status, when: q.createdAt }))]
            .sort((x, y) => new Date(y.when).getTime() - new Date(x.when).getTime())
            .map(r => (
              <div key={`${r.kind}-${r.id}`} style={{ ...card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, minWidth: 70, color: '#64748B' }}>{r.kind}</span>
                <div style={{ flex: 1, fontSize: 13, color: DARK }}>{r.detail}</div>
                <Badge label={r.status[0].toUpperCase() + r.status.slice(1)} color={STATUS_COLOR[r.status] ?? '#64748B'} />
              </div>
            ))}
          {leaves.length === 0 && advances.length === 0 && requisitions.length === 0 && <div style={{ ...card, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No requests yet.</div>}
        </div>
      </div>
    </AdminLayout>
  )
}
