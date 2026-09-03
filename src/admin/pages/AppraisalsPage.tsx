import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Employee { id: string; employeeNo: string; name: string }
interface Appraisal {
  id: string; period: string; score: string | null; rating: string | null
  status: string; reviewDate: string | null; comments: string | null; reviewedBy: string; createdAt: string
  employee: Employee
}

const STATUS_COLOR: Record<string, string> = { draft: '#64748B', submitted: '#F59E0B', completed: '#10B981', cancelled: '#EF4444' }
const RATINGS = ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function Modal({ apr, employees, onClose, onSaved }: { apr: Appraisal | null; employees: Employee[]; onClose: () => void; onSaved: () => void }) {
  const isNew = !apr
  const [employeeId, setEmp]   = useState(apr?.employee.id ?? '')
  const [period, setPeriod]    = useState(apr?.period ?? '')
  const [reviewedBy, setBy]    = useState(apr?.reviewedBy ?? '')
  const [score, setScore]      = useState(apr?.score ? String(Number(apr.score)) : '')
  const [rating, setRating]    = useState(apr?.rating ?? '')
  const [comments, setComments]= useState(apr?.comments ?? '')
  const [reviewDate, setDate]  = useState(apr?.reviewDate?.slice(0, 10) ?? '')
  const [status, setStatus]    = useState(apr?.status ?? 'draft')
  const [saving, setSaving]    = useState(false)
  const [err, setErr]          = useState('')

  const submit = async () => {
    if (!employeeId)   { setErr('Select an employee'); return }
    if (!period.trim()) { setErr('Period is required'); return }
    if (!reviewedBy.trim()) { setErr('Reviewed by is required'); return }
    setSaving(true)
    try {
      const body = {
        employeeId, period: period.trim(), reviewedBy: reviewedBy.trim(),
        score: score ? Number(score) : null, rating: rating || null,
        comments: comments.trim() || null, reviewDate: reviewDate || null, status,
      }
      if (isNew) await api.post('/appraisals', body)
      else       await api.patch(`/appraisals/${apr.id}`, body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 520, maxHeight: '90vh', overflowY: 'auto', padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{isNew ? 'New Appraisal' : 'Edit Appraisal'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={{ gridColumn: '1 / -1' }}>
            <div>{lbl('Employee *')}</div>
            <select style={inp} value={employeeId} onChange={e => setEmp(e.target.value)} disabled={!isNew}>
              <option value="">— select —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.employeeNo})</option>)}
            </select>
          </label>
          <label><div>{lbl('Period (e.g. Q1 2026) *')}</div><input style={inp} value={period} onChange={e => setPeriod(e.target.value)} placeholder="Q1 2026" /></label>
          <label><div>{lbl('Reviewed By *')}</div><input style={inp} value={reviewedBy} onChange={e => setBy(e.target.value)} placeholder="Manager name" /></label>
          <label><div>{lbl('Score (0–100)')}</div><input type="number" min={0} max={100} style={inp} value={score} onChange={e => setScore(e.target.value)} placeholder="85" /></label>
          <label>
            <div>{lbl('Rating')}</div>
            <select style={inp} value={rating} onChange={e => setRating(e.target.value)}>
              <option value="">— select —</option>
              {RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label><div>{lbl('Review Date')}</div><input type="date" style={inp} value={reviewDate} onChange={e => setDate(e.target.value)} /></label>
          <label>
            <div>{lbl('Status')}</div>
            <select style={inp} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label style={{ gridColumn: '1 / -1' }}><div>{lbl('Comments')}</div><textarea style={{ ...inp, resize: 'vertical', minHeight: 80 }} value={comments} onChange={e => setComments(e.target.value)} placeholder="Performance summary…" /></label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : isNew ? 'Create Appraisal' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppraisalsPage() {
  const [data, setData]           = useState<Appraisal[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [modal, setModal]         = useState<Appraisal | null | 'new'>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [aprs, emps] = await Promise.all([
        api.get<{ data: Appraisal[] }>('/appraisals?pageSize=200'),
        api.get<{ data: Employee[] }>('/employees?pageSize=200&isActive=true'),
      ])
      setData(aprs.data)
      setEmployees(emps.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.employee.name.toLowerCase().includes(q.toLowerCase()) ||
    r.period.toLowerCase().includes(q.toLowerCase()) ||
    r.employee.employeeNo.toLowerCase().includes(q.toLowerCase())
  )

  const COLS = [
    { key: 'empNo',   label: 'Emp #',    width: 90  },
    { key: 'name',    label: 'Employee', width: 170 },
    { key: 'period',  label: 'Period',   width: 130 },
    { key: 'score',   label: 'Score',    width: 80  },
    { key: 'rating',  label: 'Rating',   width: 160 },
    { key: 'status',  label: 'Status',   width: 110 },
    { key: 'date',    label: 'Review Date', width: 120 },
    { key: 'actions', label: '',         width: 70  },
  ]

  const rows = filtered.map(r => ({
    empNo:  r.employee.employeeNo,
    name:   r.employee.name,
    period: r.period,
    score:  r.score ? Number(r.score).toFixed(1) : '—',
    rating: r.rating ?? '—',
    status: <Badge label={r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    date:   r.reviewDate ? r.reviewDate.slice(0, 10) : '—',
    actions: <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  const avgScore = data.filter(r => r.score).reduce((s, r, _, arr) => s + Number(r.score) / arr.length, 0)
  const completed = data.filter(r => r.status === 'completed').length

  return (
    <AdminLayout
      title="Appraisals"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search employee, period…" />
          <Btn label="+ New Appraisal" onClick={() => setModal('new')} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total"     value={String(data.length)} sub="All appraisals" />
        <StatCard label="Completed" value={String(completed)}   sub="Finalised"      color="#10B981" />
        <StatCard label="Avg Score" value={data.some(r => r.score) ? avgScore.toFixed(1) : '—'} sub="Out of 100" color="#1D4ED8" />
        <StatCard label="Pending"   value={String(data.filter(r => r.status === 'draft').length)} sub="Draft" color="#F59E0B" />
      </StatGrid>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} appraisals</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal !== null && (
        <Modal
          apr={modal === 'new' ? null : modal as Appraisal}
          employees={employees}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
