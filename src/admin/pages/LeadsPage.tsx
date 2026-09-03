import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  createdAt: string
  _count: { opportunities: number }
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new:         'New',
  contacted:   'Contacted',
  qualified:   'Qualified',
  unqualified: 'Unqualified',
  converted:   'Converted',
}
const STATUS_COLOR: Record<LeadStatus, string> = {
  new:         '#1D4ED8',
  contacted:   '#8B5CF6',
  qualified:   '#10B981',
  unqualified: '#64748B',
  converted:   '#F59E0B',
}

const COLS = [
  { key: 'name',    label: 'Name' },
  { key: 'email',   label: 'Email',   width: 200 },
  { key: 'company', label: 'Company', width: 160 },
  { key: 'source',  label: 'Source',  width: 120 },
  { key: 'opps',    label: 'Opps',    width: 70  },
  { key: 'status',  label: 'Status',  width: 120 },
  { key: 'created', label: 'Created', width: 110 },
  { key: 'actions', label: '',        width: 80  },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}

const STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'unqualified', 'converted']

interface ModalProps { lead: Lead | null; isNew: boolean; onClose: () => void; onSaved: () => void }

function Modal({ lead, isNew, onClose, onSaved }: ModalProps) {
  const [name, setName]       = useState(lead?.name ?? '')
  const [email, setEmail]     = useState(lead?.email ?? '')
  const [phone, setPhone]     = useState(lead?.phone ?? '')
  const [company, setCompany] = useState(lead?.company ?? '')
  const [source, setSource]   = useState(lead?.source ?? '')
  const [status, setStatus]   = useState<LeadStatus>(lead?.status ?? 'new')
  const [notes, setNotes]     = useState(lead?.notes ?? '')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true)
    try {
      const body = { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, company: company.trim() || null, source: source.trim() || null, status, notes: notes.trim() || null }
      if (isNew) {
        await api.post('/leads', { ...body, userId: 'system' })
      } else {
        await api.patch(`/leads/${lead!.id}`, body)
      }
      onSaved(); onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, fontFamily: FONT, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{isNew ? 'New Lead' : 'Edit Lead'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Full Name *</span>
            <input value={name} onChange={e => setName(e.target.value)} style={inp} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Email</span>
            <input value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Phone</span>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inp} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Company</span>
            <input value={company} onChange={e => setCompany(e.target.value)} style={inp} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Source</span>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Website, Referral" style={inp} />
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Status</span>
            <select value={status} onChange={e => setStatus(e.target.value as LeadStatus)} style={inp}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <label style={{ gridColumn: '1/-1' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Notes</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
          </label>
        </div>

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : (isNew ? 'Create Lead' : 'Save')} onClick={submit} />
        </div>
      </div>
    </div>
  )
}

export function LeadsPage() {
  const [data, setData]           = useState<Lead[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<LeadStatus | 'all'>('all')
  const [modal, setModal]         = useState<{ lead: Lead | null; isNew: boolean } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Lead[] }>('/leads?pageSize=200')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.name.toLowerCase().includes(q.toLowerCase()) ||
     (r.company ?? '').toLowerCase().includes(q.toLowerCase()) ||
     (r.email ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    name:    r.name,
    email:   r.email ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    company: r.company ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    source:  r.source ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    opps:    r._count.opportunities,
    status:  <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    created: r.createdAt.slice(0, 10),
    actions: <button onClick={() => setModal({ lead: r, isNew: false })} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Leads" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search leads…" />
        <Btn label="+ New Lead" onClick={() => setModal({ lead: null, isNew: true })} />
      </div>
    }>
      <StatGrid>
        <StatCard label="Total Leads"  value={String(data.length)}                                                    sub="All leads" />
        <StatCard label="Qualified"    value={String(data.filter(r => r.status === 'qualified').length)}               sub="Ready to close"   color="#10B981" />
        <StatCard label="In Progress"  value={String(data.filter(r => ['new','contacted'].includes(r.status)).length)} sub="New + contacted"   color="#8B5CF6" />
        <StatCard label="Converted"    value={String(data.filter(r => r.status === 'converted').length)}               sub="Won"              color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>No leads yet. Create your first lead.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} leads</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal && <Modal lead={modal.lead} isNew={modal.isNew} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
