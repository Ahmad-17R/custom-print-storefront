import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse { id: string; name: string; city: string | null }
interface Department {
  id: string; name: string; isActive: boolean; createdAt: string
  warehouseId?: string | null
  warehouse?: { id: string; name: string; city: string | null } | null
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function Modal({ dept, warehouses, onClose, onSaved }: {
  dept: Department | null; warehouses: Warehouse[]
  onClose: () => void; onSaved: () => void
}) {
  const [name, setName]             = useState(dept?.name ?? '')
  const [warehouseId, setWarehouse] = useState(dept?.warehouse?.id ?? '')
  const [isActive, setActive]       = useState(dept?.isActive ?? true)
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true)
    try {
      const body = { name: name.trim(), isActive, warehouseId: warehouseId || null }
      if (dept) await api.patch(`/departments/${dept.id}`, body)
      else      await api.post('/departments', body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 440, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{dept ? 'Edit Department' : 'New Department'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label><div>{lbl('Department Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production" /></label>
          <label>
            <div>{lbl('Warehouse / Branch (location of this department)')}</div>
            <select style={inp} value={warehouseId} onChange={e => setWarehouse(e.target.value)}>
              <option value="">— not assigned —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{w.city ? ` — ${w.city}` : ''}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
            <span style={{ fontSize: 13 }}>Active</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : dept ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DepartmentsPage() {
  const [data, setData]             = useState<Department[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState<Department | null | 'new'>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [depts, whs] = await Promise.all([
        api.get<{ data: Department[] }>('/departments?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100&isActive=true'),
      ])
      setData(depts.data)
      setWarehouses(whs.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const COLS = [
    { key: 'name',      label: 'Department',       width: 240 },
    { key: 'warehouse', label: 'Warehouse/Branch',  width: 220 },
    { key: 'status',    label: 'Status',            width: 100 },
    { key: 'created',   label: 'Created',           width: 110 },
    { key: 'actions',   label: '',                  width: 70  },
  ]

  const rows = filtered.map(r => ({
    name:      r.name,
    warehouse: r.warehouse ? `${r.warehouse.name}${r.warehouse.city ? ` — ${r.warehouse.city}` : ''}` : '—',
    status:    <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#EF4444'} />,
    created:   r.createdAt.slice(0, 10),
    actions:   <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Departments" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search departments…" />
        <Btn label="+ New Department" onClick={() => setModal('new')} />
      </div>
    }>
      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} departments</div>
            <Table columns={COLS} rows={rows} />
          </>
      }
      {modal !== null && (
        <Modal
          dept={modal === 'new' ? null : modal as Department}
          warehouses={warehouses}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
