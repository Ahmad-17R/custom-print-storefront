import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// DB enum: material | job_worker | both
type SupplierType = 'material' | 'job_worker' | 'both'
const TYPE_LABELS: Record<SupplierType, string> = { material: 'Material', job_worker: 'Job Worker', both: 'Both' }
interface Supplier { id: string; name: string; type: SupplierType; email?: string; phone?: string; contactPerson?: string; isActive: boolean; createdAt: string }

const TYPES: SupplierType[] = ['material', 'job_worker', 'both']
const COLS = [
  { key: 'name',          label: 'Supplier Name' },
  { key: 'type',          label: 'Type',    width: 120 },
  { key: 'contactPerson', label: 'Contact', width: 150 },
  { key: 'email',         label: 'Email',   width: 200 },
  { key: 'phone',         label: 'Phone',   width: 140 },
  { key: 'isActive',      label: 'Status',  width: 100 },
  { key: 'actions',       label: '',        width: 80  },
]

const typeColor: Record<SupplierType, string> = { material: '#1D4ED8', job_worker: '#8B5CF6', both: '#10B981' }

function Modal({ sup, companyId, onClose, onSave }: { sup: Partial<Supplier> | null; companyId: string; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: sup?.name ?? '', type: sup?.type ?? 'material' as SupplierType, email: sup?.email ?? '', phone: sup?.phone ?? '', contactPerson: sup?.contactPerson ?? '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  if (sup === null) return null
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return setErr('Name is required')
    setLoading(true)
    try {
      const body = { ...form, companyId, email: form.email || undefined, phone: form.phone || undefined, contactPerson: form.contactPerson || undefined }
      if (sup.id) await api.patch(`/suppliers/${sup.id}`, body)
      else        await api.post('/suppliers', body)
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, fontFamily: FONT, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" as const }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{sup.id ? 'Edit Supplier' : 'New Supplier'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([['name','Supplier Name'],['contactPerson','Contact Person'],['email','Email'],['phone','Phone']] as [string,string][]).map(([k,label]) => (
            <label key={k} style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{label}{k==='name'?' *':(k==='email'||k==='phone')?' (optional)':''}</span>
              <input value={form[k as keyof typeof form]} onChange={e => f(k, e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
            </label>
          ))}
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Type</span>
            <select value={form.type} onChange={e => f('type', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </label>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save Supplier'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function SuppliersPage() {
  const [data, setData]         = useState<Supplier[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [type, setType]         = useState<SupplierType | 'All'>('All')
  const [modal, setModal]       = useState<Partial<Supplier> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [sr, co] = await Promise.all([
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=100'),
        api.get<{ data: { id: string }[] }>('/companies?pageSize=1'),
      ])
      setData(sr.data)
      if (co.data[0]) setCompanyId(co.data[0].id)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(s =>
    (type === 'All' || s.type === type) &&
    (s.name.toLowerCase().includes(q.toLowerCase()) || (s.contactPerson ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(s => ({
    ...s,
    contactPerson: s.contactPerson ?? '—',
    email: s.email ?? '—',
    phone: s.phone ?? '—',
    type:     <Badge label={TYPE_LABELS[s.type] ?? s.type} color={typeColor[s.type]} />,
    isActive: <Badge label={s.isActive ? 'Active' : 'Inactive'} color={s.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(s)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
        <button onClick={async () => {
          if (!window.confirm(`Delete "${s.name}"?`)) return
          try { await api.delete(`/suppliers/${s.id}`); load() }
          catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
        }} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Suppliers" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search suppliers…" /><Btn label="+ New Supplier" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total"        value={String(data.length)}                              sub="All suppliers" />
        <StatCard label="Material"   value={String(data.filter(s=>s.type==='material').length)}  sub="" color="#1D4ED8" />
        <StatCard label="Job Worker" value={String(data.filter(s=>s.type==='job_worker').length)} sub="" color="#8B5CF6" />
        <StatCard label="Both"       value={String(data.filter(s=>s.type==='both').length)}       sub="" color="#10B981" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['All',...TYPES] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: type===t ? DARK : '#fff', color: type===t ? '#fff' : '#64748B' }}>{t === 'All' ? 'All' : TYPE_LABELS[t as SupplierType]}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal sup={modal} companyId={companyId} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
