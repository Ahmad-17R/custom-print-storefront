import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Shift { id: string; name: string; startTime: string; endTime: string; isActive: boolean; _count?: { employees: number } }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function Modal({ shift, onClose, onSaved }: { shift: Shift | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName]         = useState(shift?.name ?? '')
  const [startTime, setStart]   = useState(shift?.startTime ?? '')
  const [endTime, setEnd]       = useState(shift?.endTime ?? '')
  const [isActive, setActive]   = useState(shift?.isActive ?? true)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const submit = async () => {
    if (!name.trim() || !startTime || !endTime) { setErr('All fields required'); return }
    setSaving(true)
    try {
      if (shift) await api.patch(`/shifts/${shift.id}`, { name: name.trim(), startTime, endTime, isActive })
      else       await api.post('/shifts', { name: name.trim(), startTime, endTime, isActive })
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 400, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{shift ? 'Edit Shift' : 'New Shift'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label><div>{lbl('Shift Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Morning Shift" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label><div>{lbl('Start Time *')}</div><input type="time" style={inp} value={startTime} onChange={e => setStart(e.target.value)} /></label>
            <label><div>{lbl('End Time *')}</div><input type="time" style={inp} value={endTime} onChange={e => setEnd(e.target.value)} /></label>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
            <span style={{ fontSize: 13 }}>Active</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : shift ? 'Save' : 'Create Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShiftsPage() {
  const [rows, setRows]   = useState<Shift[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Shift | null | 'new'>(null)

  const load = () => {
    setLoading(true)
    api.get<{ data: Shift[] }>('/shifts?pageSize=200').then(r => setRows(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const COLS = [
    { key: 'name',      label: 'Shift Name', width: 200 },
    { key: 'start',     label: 'Start',      width: 100 },
    { key: 'end',       label: 'End',        width: 100 },
    { key: 'employees', label: 'Employees',  width: 110 },
    { key: 'status',    label: 'Status',     width: 100 },
    { key: 'actions',   label: '',           width: 70  },
  ]

  const tableRows = filtered.map(r => ({
    name:      r.name,
    start:     r.startTime,
    end:       r.endTime,
    employees: r._count?.employees ?? 0,
    status:    <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#EF4444'} />,
    actions:   <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Work Shifts" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search shifts…" />
        <Btn label="+ New Shift" onClick={() => setModal('new')} />
      </div>
    }>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={tableRows} />}
      {modal !== null && <Modal shift={modal === 'new' ? null : modal as Shift} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
