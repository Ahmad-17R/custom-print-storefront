import React, { useEffect, useState } from 'react'
import { AdminLayout, Btn, StatCard, StatGrid, Table } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

interface Branch   { id: string; name: string }
interface Register { id: string; name: string; isActive: boolean; createdAt: string; branch: Branch; _count: { sessions: number } }

function RegisterModal({ branches, initial, onClose, onSave }: { branches: Branch[]; initial?: Register; onClose: () => void; onSave: () => void }) {
  const [name,     setName]    = useState(initial?.name ?? '')
  const [branchId, setBranch]  = useState(initial?.branch.id ?? branches[0]?.id ?? '')
  const [err,      setErr]     = useState('')
  const [saving,   setSaving]  = useState(false)

  const save = async () => {
    if (!name.trim())  return setErr('Name is required')
    if (!branchId)     return setErr('Branch is required')
    setSaving(true)
    try {
      if (initial) await api.patch(`/pos/registers/${initial.id}`, { name })
      else         await api.post('/pos/registers', { branchId, name })
      onSave(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{initial ? 'Edit Register' : 'New Register'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <label>{lbl('Register Name *')}<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Counter 1, Front Desk" style={inp} /></label>
          {!initial && (
            <label>{lbl('Branch *')}
              <select value={branchId} onChange={e => setBranch(e.target.value)} style={inp}>
                <option value="">— select branch —</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          )}
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : initial ? 'Save' : 'Create'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

export function PosRegistersPage() {
  const [registers, setReg]    = useState<Register[]>([])
  const [branches,  setBranches] = useState<Branch[]>([])
  const [loading,   setLoad]   = useState(true)
  const [showNew,   setNew]    = useState(false)
  const [editing,   setEdit]   = useState<Register | null>(null)

  const load = async () => {
    setLoad(true)
    try {
      const [r, b] = await Promise.all([
        api.get<{ data: Register[] }>('/pos/registers?pageSize=200'),
        api.get<{ data: Branch[] }>('/branches?pageSize=100'),
      ])
      setReg(r.data); setBranches(b.data)
    } finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const toggle = async (r: Register) => {
    await api.patch(`/pos/registers/${r.id}`, { isActive: !r.isActive })
    load()
  }

  const COLS = [
    { key: 'name',     label: 'Register',  width: 200 },
    { key: 'branch',   label: 'Branch',    width: 180 },
    { key: 'sessions', label: 'Sessions',  width: 100 },
    { key: 'status',   label: 'Status',    width: 100 },
    { key: 'actions',  label: '',          width: 140 },
  ]

  const rows = registers.map(r => ({
    name:     <span style={{ fontWeight: 600, color: DARK }}>{r.name}</span>,
    branch:   r.branch.name,
    sessions: r._count.sessions,
    status:   <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 999, background: r.isActive ? '#D1FAE5' : '#F1F5F9', color: r.isActive ? '#065F46' : '#94A3B8' }}>{r.isActive ? 'Active' : 'Inactive'}</span>,
    actions:  <div style={{ display: 'flex', gap: 6 }}>
                <Btn label="Edit" variant="secondary" onClick={() => setEdit(r)} />
                <Btn label={r.isActive ? 'Disable' : 'Enable'} variant={r.isActive ? 'danger' : 'secondary'} onClick={() => toggle(r)} />
              </div>,
  }))

  return (
    <AdminLayout title="POS Registers" actions={<Btn label="+ New Register" onClick={() => setNew(true)} />}>
      <StatGrid>
        <StatCard label="Total Registers" value={String(registers.length)}                           sub="All terminals" />
        <StatCard label="Active"          value={String(registers.filter(r => r.isActive).length)}   sub="Ready to use"  color="#10B981" />
        <StatCard label="Branches"        value={String(new Set(registers.map(r => r.branch.id)).size)} sub="Covered"    color="#8B5CF6" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : registers.length === 0
          ? <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🖥️</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No registers yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Add a register for each physical POS terminal.</div>
              <Btn label="+ New Register" onClick={() => setNew(true)} />
            </div>
          : <Table columns={COLS} rows={rows} />
      }

      {(showNew || editing) && (
        <RegisterModal branches={branches} initial={editing ?? undefined} onClose={() => { setNew(false); setEdit(null) }} onSave={load} />
      )}
    </AdminLayout>
  )
}
