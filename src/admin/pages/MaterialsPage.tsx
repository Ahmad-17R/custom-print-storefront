import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Material {
  id: string; name: string; unit: string; description: string | null; isActive: boolean; createdAt: string
  _count: { stocks: number; movements: number }
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

const UNITS = ['pcs', 'sheets', 'rolls', 'kg', 'g', 'litre', 'ml', 'm', 'cm', 'box', 'ream']

function MaterialModal({ material, onClose, onSave }: { material: Partial<Material> | null; onClose: () => void; onSave: () => void }) {
  const [name,        setName]   = useState(material?.name        ?? '')
  const [unit,        setUnit]   = useState(material?.unit        ?? 'pcs')
  const [description, setDesc]   = useState(material?.description ?? '')
  const [loading,     setLoad]   = useState(false)
  const [err,         setErr]    = useState('')

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setLoad(true)
    try {
      if (material?.id) await api.patch(`/materials/${material.id}`, { name, unit, description })
      else              await api.post('/materials', { name, unit, description })
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoad(false) }
  }

  if (material === null) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{material.id ? 'Edit Material' : 'New Material'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          {lbl('Name *')}
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Business Card Paper 350gsm" style={inp} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          {lbl('Unit of Measure')}
          <select value={unit} onChange={e => setUnit(e.target.value)} style={inp}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            <option value="custom">other…</option>
          </select>
        </label>
        {unit === 'custom' && (
          <label style={{ display: 'block', marginBottom: 14 }}>
            {lbl('Custom Unit')}
            <input value={unit === 'custom' ? '' : unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. sqm" style={inp} />
          </label>
        )}
        <label style={{ display: 'block', marginBottom: 20 }}>
          {lbl('Description')}
          <input value={description ?? ''} onChange={e => setDesc(e.target.value)} placeholder="Optional notes" style={inp} />
        </label>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function MaterialsPage() {
  const [data,    setData]  = useState<Material[]>([])
  const [loading, setLoad]  = useState(true)
  const [q,       setQ]     = useState('')
  const [modal,   setModal] = useState<Partial<Material> | null>(null)

  const load = async () => {
    setLoad(true)
    try { setData((await api.get<{ data: Material[] }>('/materials?pageSize=500')).data) }
    finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Delete material "${name}"?`)) return
    try { await api.delete(`/materials/${id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const toggle = async (m: Material) => {
    await api.patch(`/materials/${m.id}`, { isActive: !m.isActive }); load()
  }

  const filtered = data.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    (m.description ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(m => ({
    name:   <span style={{ fontWeight: 600, color: DARK }}>{m.name}</span>,
    unit:   <code style={{ fontSize: 12, background: '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>{m.unit}</code>,
    desc:   m.description ?? <span style={{ color: '#CBD5E1' }}>—</span>,
    stock:  m._count.stocks,
    moves:  m._count.movements,
    status: (
      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: m.isActive ? '#D1FAE5' : '#F1F5F9', color: m.isActive ? '#065F46' : '#64748B', fontWeight: 600 }}>
        {m.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(m)}   style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => toggle(m)}     style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B' }}>{m.isActive ? 'Deactivate' : 'Activate'}</button>
        <button onClick={() => remove(m.id, m.name)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  const COLS = [
    { key: 'name',    label: 'Material Name' },
    { key: 'unit',    label: 'Unit',    width: 90  },
    { key: 'desc',    label: 'Description', width: 220 },
    { key: 'stock',   label: 'Warehouses',  width: 100 },
    { key: 'moves',   label: 'Movements',   width: 100 },
    { key: 'status',  label: 'Status',      width: 90  },
    { key: 'actions', label: '',            width: 200 },
  ]

  return (
    <AdminLayout
      title="Materials"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search materials…" />
          <Btn label="+ New Material" onClick={() => setModal({})} />
        </div>
      }
    >
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1E40AF', fontFamily: FONT }}>
        <strong>Materials</strong> are the raw supplies your print business buys — paper, card, vinyl, ink, etc. After creating a material here, go to <strong>Stock In</strong> to record how many units you bought and which warehouses received them.
      </div>

      <StatGrid>
        <StatCard label="Total Materials" value={String(data.length)}                                    sub="All materials" />
        <StatCard label="Active"          value={String(data.filter(m => m.isActive).length)}            sub="In use"          color="#10B981" />
        <StatCard label="With Stock"      value={String(data.filter(m => m._count.stocks > 0).length)}   sub="Have stock records" color="#1D4ED8" />
        <StatCard label="Inactive"        value={String(data.filter(m => !m.isActive).length)}           sub="Deactivated"    color="#F59E0B" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No materials yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Add the raw supplies your business uses — paper, card, ink, vinyl, etc.</div>
              <Btn label="+ New Material" onClick={() => setModal({})} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} materials</div><Table columns={COLS} rows={rows} /></>
      }

      {modal !== null && <MaterialModal material={modal} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
