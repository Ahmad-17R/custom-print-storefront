import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost'
type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Cold Call' | 'Exhibition' | 'Walk-in'

interface Lead {
  id: string; name: string; company: string; email: string; phone: string
  source: LeadSource; status: LeadStatus
  value: number; assignedTo: string; createdAt: string
}

const statusColor: Record<LeadStatus, string> = {
  'New':           '#64748B',
  'Contacted':     '#1D4ED8',
  'Qualified':     '#8B5CF6',
  'Proposal Sent': '#F59E0B',
  'Won':           '#10B981',
  'Lost':          '#EF4444',
}

const SEED: Lead[] = [
  { id: 'LD-0015', name: 'Khalid Al Rashid',    company: 'Al Rashid Group',       email: 'khalid@alrashid.ae',  phone: '+971 50 123 4567', source: 'Referral',     status: 'Proposal Sent', value: 15000, assignedTo: 'Sara Khalid',       createdAt: '2026-08-01' },
  { id: 'LD-0014', name: 'Jennifer Okafor',      company: 'Lagos Logistics DMCC',  email: 'j.okafor@lagos.ae',   phone: '+971 55 987 6543', source: 'Website',      status: 'Qualified',     value: 8500,  assignedTo: 'Ahmed Al Mansouri', createdAt: '2026-08-03' },
  { id: 'LD-0013', name: 'Tariq Mohammed',       company: 'Emirate Events LLC',    email: 'tariq@emirev.ae',     phone: '+971 52 456 7890', source: 'Exhibition',   status: 'Contacted',     value: 4200,  assignedTo: 'Sara Khalid',       createdAt: '2026-08-05' },
  { id: 'LD-0012', name: 'Anna Petrova',         company: 'Petrova Corp',          email: 'anna@petrova.ae',     phone: '+971 58 321 0987', source: 'Social Media', status: 'New',           value: 2000,  assignedTo: 'Sara Khalid',       createdAt: '2026-08-08' },
  { id: 'LD-0011', name: 'Omar Hassan',          company: 'Hassan Printing',       email: 'omar@hassanprint.ae', phone: '+971 50 654 3210', source: 'Walk-in',      status: 'Won',           value: 28000, assignedTo: 'Ahmed Al Mansouri', createdAt: '2026-07-20' },
  { id: 'LD-0010', name: 'Cheng Wei',            company: 'China Mart Dubai',      email: 'cheng@chinamart.ae',  phone: '+971 54 111 2222', source: 'Cold Call',    status: 'Lost',          value: 5500,  assignedTo: 'Ahmed Al Mansouri', createdAt: '2026-07-25' },
  { id: 'LD-0009', name: 'Nadia Karim',          company: 'Karim Fashion House',   email: 'nadia@karimfh.ae',    phone: '+971 56 777 8888', source: 'Referral',     status: 'Qualified',     value: 11000, assignedTo: 'Sara Khalid',       createdAt: '2026-07-28' },
]

const STATUSES: LeadStatus[] = ['New','Contacted','Qualified','Proposal Sent','Won','Lost']
const COLS = [
  { key: 'id',         label: 'Lead #',     width: 100 },
  { key: 'name',       label: 'Contact' },
  { key: 'company',    label: 'Company' },
  { key: 'source',     label: 'Source',     width: 130 },
  { key: 'value',      label: 'Est. Value', width: 120 },
  { key: 'status',     label: 'Status',     width: 140 },
  { key: 'assignedTo', label: 'Assigned',   width: 150 },
  { key: 'createdAt',  label: 'Created',    width: 100 },
  { key: 'actions',    label: '',           width: 80  },
]

function Modal({ lead, onClose, onSave }: { lead: Partial<Lead> | null; onClose: () => void; onSave: (l: Partial<Lead>) => void }) {
  const [form, setForm] = useState<Partial<Lead>>(lead ?? { name: '', company: '', email: '', phone: '', source: 'Website', status: 'New', value: 0, assignedTo: 'Sara Khalid', createdAt: new Date().toISOString().slice(0,10) })
  if (!lead) return null
  const f = <K extends keyof Lead>(k: K, v: Lead[K]) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, fontFamily: FONT, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit Lead' : 'New Lead'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([['name','Contact Name'],['company','Company'],['email','Email'],['phone','Phone']] as [keyof Lead, string][]).map(([k, label]) => (
            <label key={k as string} style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{label}</span>
              <input value={(form[k] as string) ?? ''} onChange={e => f(k, e.target.value as Lead[typeof k])} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
            </label>
          ))}
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Source</span>
            <select value={form.source ?? 'Website'} onChange={e => f('source', e.target.value as LeadSource)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {(['Website','Referral','Social Media','Cold Call','Exhibition','Walk-in'] as LeadSource[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Status</span>
            <select value={form.status ?? 'New'} onChange={e => f('status', e.target.value as LeadStatus)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Est. Value (AED)</span>
            <input type="number" value={form.value ?? 0} onChange={e => f('value', Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Assigned To</span>
            <select value={form.assignedTo ?? ''} onChange={e => f('assignedTo', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['Sara Khalid','Ahmed Al Mansouri','Elena Popescu'].map(a => <option key={a}>{a}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save Lead" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function LeadsPage() {
  const [data, setData]   = useState<Lead[]>(SEED)
  const [q, setQ]         = useState('')
  const [status, setStatus] = useState<LeadStatus | 'All'>('All')
  const [modal, setModal] = useState<Partial<Lead> | null>(null)

  const filtered = data.filter(l =>
    (status === 'All' || l.status === status) &&
    (l.name.toLowerCase().includes(q.toLowerCase()) || l.company.toLowerCase().includes(q.toLowerCase()))
  )

  const save = (form: Partial<Lead>) => {
    const n = data.length + 1
    if (form.id) setData(d => d.map(l => l.id === form.id ? { ...l, ...form } as Lead : l))
    else setData(d => [{ id: `LD-${String(n + 14).padStart(4,'0')}`, ...form } as Lead, ...d])
  }

  const wonValue = data.filter(l => l.status === 'Won').reduce((s,l) => s + l.value, 0)
  const pipeline = data.filter(l => !['Won','Lost'].includes(l.status)).reduce((s,l) => s + l.value, 0)

  const rows = filtered.map(l => ({
    ...l,
    value:  `AED ${l.value.toLocaleString()}`,
    status: <Badge label={l.status} color={statusColor[l.status]} />,
    actions: <button onClick={() => setModal(l)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Leads / CRM"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search leads…" /><Btn label="+ New Lead" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total Leads"    value={String(data.length)}                            sub="All leads" />
        <StatCard label="Pipeline Value" value={`AED ${pipeline.toLocaleString()}`}             sub="Active opportunities" color="#1D4ED8" />
        <StatCard label="Won"            value={`AED ${wonValue.toLocaleString()}`}             sub="Closed deals"         color="#10B981" />
        <StatCard label="Win Rate"       value={`${Math.round(data.filter(l=>l.status==='Won').length / data.length * 100)}%`} sub="Leads converted" color="#F59E0B" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All',...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status===s ? DARK : '#fff', color: status===s ? '#fff' : '#64748B' }}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} leads</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal lead={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
