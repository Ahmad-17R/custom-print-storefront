import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Employee { id: string; employeeNo: string; name: string; jobTitle: string | null }
interface Attendance {
  id: string; date: string; status: string; checkIn: string | null; checkOut: string | null; note: string | null
  employee: Employee
}

const STATUS_LABEL: Record<string, string> = { present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day', on_leave: 'On Leave' }
const STATUS_COLOR: Record<string, string> = { present: '#10B981', absent: '#EF4444', late: '#F59E0B', half_day: '#1D4ED8', on_leave: '#8B5CF6' }
const STATUSES = ['present', 'absent', 'late', 'half_day', 'on_leave']

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none',
}
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function timeStr(dt: string | null) {
  if (!dt) return '—'
  return new Date(dt).toTimeString().slice(0, 5)
}

interface ModalProps {
  rec: Attendance | null; employees: Employee[]
  onClose: () => void; onSaved: () => void
}

function Modal({ rec, employees, onClose, onSaved }: ModalProps) {
  const [employeeId, setEmp]  = useState(rec?.employee.id ?? '')
  const [date, setDate]       = useState(rec?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
  const [status, setStatus]   = useState(rec?.status ?? 'present')
  const [checkIn, setIn]      = useState(rec?.checkIn ? new Date(rec.checkIn).toTimeString().slice(0, 5) : '')
  const [checkOut, setOut]    = useState(rec?.checkOut ? new Date(rec.checkOut).toTimeString().slice(0, 5) : '')
  const [note, setNote]       = useState(rec?.note ?? '')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const toDateTime = (d: string, t: string) => t ? `${d}T${t}:00` : null

  const submit = async () => {
    if (!employeeId) { setErr('Select an employee'); return }
    if (!date)       { setErr('Date is required'); return }
    setSaving(true)
    try {
      const body = {
        employeeId, date, status,
        checkIn:  toDateTime(date, checkIn),
        checkOut: toDateTime(date, checkOut),
        note: note.trim() || null,
      }
      if (rec) await api.patch(`/attendance/${rec.id}`, body)
      else     await api.post('/attendance', body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 480, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{rec ? 'Edit Attendance' : 'Log Attendance'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            <div>{lbl('Employee *')}</div>
            <select style={inp} value={employeeId} onChange={e => setEmp(e.target.value)} disabled={!!rec}>
              <option value="">— select —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
            </select>
          </label>
          <label><div>{lbl('Date *')}</div><input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} disabled={!!rec} /></label>
          <label>
            <div>{lbl('Status')}</div>
            <select style={inp} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label><div>{lbl('Check In')}</div><input type="time" style={inp} value={checkIn} onChange={e => setIn(e.target.value)} /></label>
          <label><div>{lbl('Check Out')}</div><input type="time" style={inp} value={checkOut} onChange={e => setOut(e.target.value)} /></label>
          <label style={{ gridColumn: '1 / -1' }}><div>{lbl('Note')}</div><input style={inp} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" /></label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : rec ? 'Save Changes' : 'Log Attendance'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AttendancePage() {
  const [data, setData]           = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState('all')
  const [dateFrom, setFrom]       = useState('')
  const [dateTo, setTo]           = useState('')
  const [modal, setModal]         = useState<Attendance | null | 'new'>('new' as any)

  // initialise modal to null (not 'new') on mount
  useEffect(() => { setModal(null as any) }, [])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '300' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo)   params.set('dateTo', dateTo)
      const [att, emps] = await Promise.all([
        api.get<{ data: Attendance[] }>(`/attendance?${params}`),
        api.get<{ data: Employee[] }>('/employees?pageSize=200&isActive=true'),
      ])
      setData(att.data)
      setEmployees(emps.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter, dateFrom, dateTo])

  const filtered = data.filter(r =>
    r.employee.name.toLowerCase().includes(q.toLowerCase()) ||
    r.employee.employeeNo.toLowerCase().includes(q.toLowerCase())
  )

  const COLS = [
    { key: 'empNo',    label: 'Emp #',     width: 90  },
    { key: 'name',     label: 'Employee',  width: 180 },
    { key: 'date',     label: 'Date',      width: 110 },
    { key: 'status',   label: 'Status',    width: 110 },
    { key: 'checkIn',  label: 'Check In',  width: 100 },
    { key: 'checkOut', label: 'Check Out', width: 100 },
    { key: 'note',     label: 'Note',      width: 200 },
    { key: 'actions',  label: '',          width: 70  },
  ]

  const rows = filtered.map(r => ({
    empNo:    r.employee.employeeNo,
    name:     r.employee.name,
    date:     r.date.slice(0, 10),
    status:   <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    checkIn:  timeStr(r.checkIn),
    checkOut: timeStr(r.checkOut),
    note:     r.note ?? '—',
    actions:  <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  const today     = filtered.filter(r => r.date.slice(0, 10) === new Date().toISOString().slice(0, 10))
  const present   = today.filter(r => r.status === 'present').length
  const absent    = today.filter(r => r.status === 'absent').length
  const late      = today.filter(r => r.status === 'late').length

  return (
    <AdminLayout
      title="Attendance"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search employee…" />
          <Btn label="+ Log Attendance" onClick={() => setModal({} as any)} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Today Present" value={String(present)} sub="Logged today" color="#10B981" />
        <StatCard label="Today Absent"  value={String(absent)}  sub="Logged today" color="#EF4444" />
        <StatCard label="Late Today"    value={String(late)}    sub="Logged today" color="#F59E0B" />
        <StatCard label="Total Records" value={String(data.length)} sub="In view" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT }} />
          <span style={{ fontSize: 12, color: '#94A3B8', alignSelf: 'center' }}>to</span>
          <input type="date" value={dateTo} onChange={e => setTo(e.target.value)} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT }} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} records</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal !== null && (modal as any) !== false && (
        <Modal
          rec={modal && (modal as any).id ? modal as Attendance : null}
          employees={employees}
          onClose={() => setModal(null as any)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
