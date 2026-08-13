import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Category { id: string; name: string; parentId: string | null; isActive: boolean; createdAt: string }

const COLS = [
  { key: 'name',      label: 'Category Name' },
  { key: 'parent',    label: 'Parent',   width: 160 },
  { key: 'isActive',  label: 'Status',   width: 100 },
  { key: 'createdAt', label: 'Created',  width: 120 },
  { key: 'actions',   label: '',         width: 120 },
]

function Modal({ cat, all, onClose, onSave }: { cat: Partial<Category> | null; all: Category[]; onClose: () => void; onSave: () => void }) {
  const [name, setName]     = useState(cat?.name ?? '')
  const [parentId, setParentId] = useState(cat?.parentId ?? '')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')
  if (cat === null) return null

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setLoading(true)
    try {
      const body = { name, parentId: parentId || null }
      if (cat.id) await api.patch(`/categories/${cat.id}`, body)
      else        await api.post('/categories', body)
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, fontFamily: FONT, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" as const }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{cat.id ? 'Edit Category' : 'New Category'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Category Name *</span>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Parent Category</span>
          <select value={parentId} onChange={e => setParentId(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
            <option value="">— None (top-level) —</option>
            {all.filter(c => c.id !== cat.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
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

export function CategoriesPage() {
  const [data, setData]   = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]         = useState('')
  const [modal, setModal] = useState<Partial<Category> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Category[] }>('/categories?pageSize=200')
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const remove = async (c: Category) => {
    if (!window.confirm(`Permanently delete "${c.name}"? This cannot be undone.`)) return
    try { await api.delete(`/categories/${c.id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const toggleStatus = async (c: Category) => {
    try { await api.patch(`/categories/${c.id}`, { isActive: !c.isActive }); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Update failed') }
  }

  const filtered = data.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
  const parentMap = Object.fromEntries(data.map(c => [c.id, c.name]))

  const btnBase: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(c => ({
    ...c,
    parent:    c.parentId ? parentMap[c.parentId] ?? '—' : <span style={{ color: '#94A3B8' }}>Top-level</span>,
    isActive:  <Badge label={c.isActive ? 'Enabled' : 'Disabled'} color={c.isActive ? '#10B981' : '#64748B'} />,
    createdAt: c.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {c.isActive
          ? <button onClick={() => setModal(c)} style={{ ...btnBase, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
          : <button onClick={() => toggleStatus(c)} style={{ ...btnBase, border: '1px solid #D1FAE5', background: '#ECFDF5', color: '#059669' }}>Enable</button>
        }
        {c.isActive && (
          <button onClick={() => toggleStatus(c)} style={{ ...btnBase, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#EA580C' }}>Disable</button>
        )}
        <button onClick={() => remove(c)} style={{ ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Categories" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search categories…" /><Btn label="+ New Category" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total"    value={String(data.length)}                        sub="All categories" />
        <StatCard label="Enabled"  value={String(data.filter(c=>c.isActive).length)}  sub="Enabled" color="#10B981" />
        <StatCard label="Children" value={String(data.filter(c=>c.parentId).length)}  sub="Sub-categories" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal cat={modal} all={data} onClose={() => setModal(null)} onSave={load} />}
    </AdminLayout>
  )
}
