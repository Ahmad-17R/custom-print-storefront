import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

export type ReqStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
export interface Material { id: string; name: string; unit: string }
interface LinkedPO { id: string; poNumber: string; status: string; totalAmount?: string; createdAt?: string; supplier?: { id: string; name: string } }
interface Requisition {
  id: string; status: ReqStatus; note: string | null; neededBy: string | null; createdAt: string; requestedBy: string
  _count: { items: number; rfqs: number; purchaseOrders: number }
  purchaseOrders: LinkedPO[]
}
export interface RequisitionDetail extends Omit<Requisition, '_count'> {
  items: { id: string; materialId: string; quantity: number; note: string | null; material: Material | null }[]
  ordered: { itemId: string; materialId: string; requested: number; ordered: number; remaining: number }[]
}

export const STATUS_LABEL: Record<ReqStatus, string> = { draft: 'Draft', pending_approval: 'Pending Approval', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' }
export const STATUS_COLOR: Record<ReqStatus, string> = { draft: '#64748B', pending_approval: '#1D4ED8', approved: '#10B981', rejected: '#EF4444', cancelled: '#94A3B8' }
const STATUSES: ReqStatus[] = ['draft', 'pending_approval', 'approved', 'rejected', 'cancelled']
const COLS = [
  { key: 'id', label: 'PR #', width: 110 }, { key: 'items', label: 'Lines', width: 60 },
  { key: 'pos', label: 'Purchase Orders', width: 170 }, { key: 'status', label: 'Status', width: 140 },
  { key: 'by', label: 'Requested By', width: 130 }, { key: 'note', label: 'Note' },
  { key: 'neededBy', label: 'Needed By', width: 100 }, { key: 'actions', label: '', width: 210 },
]

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>
export const prNo = (id: string) => `PR-${id.slice(0, 8).toUpperCase()}`

// ── New / edit requisition ────────────────────────────────────────────────────
export function RequisitionModal({ materials, companyId, editing, onClose, onSaved }: {
  materials: Material[]; companyId: string; editing: RequisitionDetail | null; onClose: () => void; onSaved: () => void
}) {
  const [neededBy, setNeededBy] = useState(editing?.neededBy?.slice(0, 10) ?? '')
  const [note, setNote]         = useState(editing?.note ?? '')
  const [lines, setLines]       = useState(editing
    ? editing.items.map(i => ({ materialId: i.materialId, quantity: String(i.quantity), note: i.note ?? '' }))
    : [{ materialId: '', quantity: '1', note: '' }])
  const [err, setErr]       = useState('')
  const [saving, setSaving] = useState(false)

  const setLine = (i: number, k: string, v: string) => setLines(p => p.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const used = lines.map(l => l.materialId).filter(Boolean)

  const save = async (submit: boolean) => {
    const items = lines.filter(l => l.materialId && Number(l.quantity) > 0).map(l => ({ materialId: l.materialId, quantity: Number(l.quantity), note: l.note || null }))
    if (!items.length) return setErr('Add at least one material with a quantity')
    setSaving(true); setErr('')
    try {
      let id = editing?.id
      if (editing) await api.patch(`/purchase-requisitions/${editing.id}`, { neededBy: neededBy || null, note, items })
      else id = (await api.post<{ id: string }>('/purchase-requisitions', { companyId, neededBy: neededBy || null, note, items })).id
      if (submit && id) await api.post(`/purchase-requisitions/${id}/submit`, {})
      onSaved(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 640, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: DARK }}>{editing ? `Edit ${prNo(editing.id)}` : 'New Purchase Requisition'}</h2>
        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>Request materials to be bought. Once approved, it can be turned into one or more purchase orders.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
          <label>{lbl('Needed By')}<input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)} style={inp} /></label>
          <label>{lbl('Note / Reason')}<input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Restock for Ramadan orders" style={inp} /></label>
        </div>
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1.5fr 28px', gap: 8, marginBottom: 8 }}>
            {['Material', 'Qty', 'Line note', ''].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</span>)}
          </div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 1.5fr 28px', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <select value={l.materialId} onChange={e => setLine(i, 'materialId', e.target.value)} style={inp}>
                <option value="">— select —</option>
                {materials.filter(m => !used.includes(m.id) || m.id === l.materialId).map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              <input type="number" min={0} step="any" value={l.quantity} onChange={e => setLine(i, 'quantity', e.target.value)} style={inp} />
              <input value={l.note} onChange={e => setLine(i, 'note', e.target.value)} placeholder="optional" style={inp} />
              <button onClick={() => setLines(p => p.filter((_, idx) => idx !== i))} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontSize: 18, cursor: 'pointer', padding: 0 }}>×</button>
            </div>
          ))}
          {lines.length < materials.length && (
            <button onClick={() => setLines(p => [...p, { materialId: '', quantity: '1', note: '' }])} style={{ marginTop: 4, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>+ Add Line</button>
          )}
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save Draft'} variant="secondary" onClick={() => save(false)} />
          <Btn label={saving ? 'Saving…' : 'Save & Submit for Approval'} onClick={() => save(true)} />
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RequisitionsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Requisition[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [companyId, setCompanyId] = useState('')
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<ReqStatus | 'all'>('all')
  const [modal, setModal] = useState<{ editing: RequisitionDetail | null } | null>(null)
  const [detail, setDetail] = useState<RequisitionDetail | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, m, co] = await Promise.all([
        api.get<{ data: Requisition[] }>('/purchase-requisitions?pageSize=200'),
        api.get<{ data: Material[] }>('/materials?pageSize=500'),
        api.get<{ data: { id: string }[] }>('/companies?pageSize=1'),
      ])
      setData(r.data); setMaterials(m.data); if (co.data[0]) setCompanyId(co.data[0].id)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openDetail = async (id: string) => setDetail(await api.get<RequisitionDetail>(`/purchase-requisitions/${id}`))

  const act = async (id: string, action: 'submit' | 'approve' | 'reject' | 'cancel', label: string) => {
    if (!window.confirm(`${label} ${prNo(id)}?`)) return
    setBusy(id)
    try { await api.post(`/purchase-requisitions/${id}/${action}`, {}); await load(); if (detail?.id === id) openDetail(id) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(null) }
  }

  const createPO = (id: string) => navigate(`/admin/purchase-orders?fromRequisition=${id}`)

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) &&
    ((r.note ?? '').toLowerCase().includes(q.toLowerCase()) || prNo(r.id).toLowerCase().includes(q.toLowerCase()) ||
     r.requestedBy.toLowerCase().includes(q.toLowerCase()) || r.purchaseOrders.some(p => p.poNumber.toLowerCase().includes(q.toLowerCase()))))

  const b: React.CSSProperties = { fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }
  const rows = filtered.map(r => ({
    id: <span style={{ fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12, color: '#1D4ED8', cursor: 'pointer' }} onClick={() => openDetail(r.id)}>{prNo(r.id)}</span>,
    items: r._count.items,
    pos: r.purchaseOrders.length ? <span style={{ fontSize: 12 }}>{r.purchaseOrders.map(p => p.poNumber).join(', ')}</span> : <span style={{ color: '#CBD5E1' }}>—</span>,
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    by: <span style={{ fontSize: 12 }}>{r.requestedBy}</span>,
    note: r.note ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    neededBy: r.neededBy ? r.neededBy.slice(0, 10) : '—',
    actions: (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={() => openDetail(r.id)} style={b}>View</button>
        {r.status === 'draft' && <button disabled={busy === r.id} onClick={() => act(r.id, 'submit', 'Submit for approval')} style={{ ...b, color: '#1D4ED8', borderColor: '#BFDBFE' }}>Submit</button>}
        {r.status === 'pending_approval' && <>
          <button disabled={busy === r.id} onClick={() => act(r.id, 'approve', 'Approve')} style={{ ...b, color: '#10B981', borderColor: '#A7F3D0' }}>Approve</button>
          <button disabled={busy === r.id} onClick={() => act(r.id, 'reject', 'Reject')} style={{ ...b, color: '#EF4444', borderColor: '#FECACA' }}>Reject</button>
        </>}
        {r.status === 'approved' && <button onClick={() => createPO(r.id)} style={{ ...b, color: '#fff', background: '#1D4ED8', borderColor: '#1D4ED8' }}>Create PO</button>}
      </div>
    ),
  }))

  const editDraft = async (id: string) => setModal({ editing: await api.get<RequisitionDetail>(`/purchase-requisitions/${id}`) })

  return (
    <AdminLayout title="Purchase Requisitions" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search PR, PO, note…" /><Btn label="+ New Requisition" onClick={() => setModal({ editing: null })} /></div>}>
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#14532D', fontFamily: FONT }}>
        <strong>Flow:</strong> Draft → Submit → Approve → <strong>Create PO</strong> (one or more POs, up to the requested quantities). Each PO stays linked to its requisition.
      </div>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)} sub="All PRs" />
        <StatCard label="Pending Approval" value={String(data.filter(r => r.status === 'pending_approval').length)} sub="Awaiting review" color="#1D4ED8" />
        <StatCard label="Approved" value={String(data.filter(r => r.status === 'approved').length)} sub="Ready to order" color="#10B981" />
        <StatCard label="Linked POs" value={String(data.reduce((s, r) => s + r._count.purchaseOrders, 0))} sub="Raised from PRs" color="#7C3AED" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No purchase requisitions yet. <div style={{ marginTop: 16 }}><Btn label="+ New Requisition" onClick={() => setModal({ editing: null })} /></div></div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} requisitions</div><Table columns={COLS} rows={rows} /></>}

      {modal && <RequisitionModal materials={materials} companyId={companyId} editing={modal.editing} onClose={() => setModal(null)} onSaved={load} />}

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setDetail(null)}>
          <div style={{ background: '#fff', width: 500, maxWidth: '100vw', overflowY: 'auto', padding: 28, fontFamily: FONT }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>{prNo(detail.id)}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>By {detail.requestedBy} · {detail.createdAt.slice(0, 10)}{detail.neededBy ? ` · needed by ${detail.neededBy.slice(0, 10)}` : ''}</div>
              </div>
              <button onClick={() => setDetail(null)} style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
            </div>
            <Badge label={STATUS_LABEL[detail.status]} color={STATUS_COLOR[detail.status]} />
            {detail.note && <div style={{ fontSize: 13, color: '#64748B', marginTop: 10 }}>{detail.note}</div>}

            <div style={{ fontWeight: 700, fontSize: 13, color: DARK, margin: '18px 0 8px' }}>Materials (requested / on POs / left)</div>
            {detail.items.length === 0 && <div style={{ fontSize: 13, color: '#64748B', background: '#F8FAFC', borderRadius: 8, padding: '8px 12px' }}>Described request (no material lines): <b>{detail.note ?? '—'}</b> — choose the materials when creating the PO.</div>}
            {detail.items.map(item => {
              const o = detail.ordered.find(x => x.itemId === item.id)
              const pct = o ? Math.min(100, Math.round((o.ordered / o.requested) * 100)) : 0
              return (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: DARK }}>
                    <span>{item.material?.name ?? 'Unknown material'}</span>
                    <span>{o?.requested ?? item.quantity} {item.material?.unit}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>On POs {o?.ordered ?? 0} · left to order <b>{o?.remaining ?? item.quantity}</b>{item.note ? ` · ${item.note}` : ''}</div>
                  <div style={{ background: '#E2E8F0', borderRadius: 4, height: 6 }}><div style={{ background: pct >= 100 ? '#10B981' : '#1D4ED8', borderRadius: 4, height: 6, width: `${pct}%` }} /></div>
                </div>
              )
            })}

            <div style={{ fontWeight: 700, fontSize: 13, color: DARK, margin: '18px 0 8px' }}>Linked Purchase Orders</div>
            {detail.purchaseOrders.length === 0 ? <div style={{ fontSize: 13, color: '#94A3B8' }}>None yet</div>
              : detail.purchaseOrders.map(po => (
                <div key={po.id} style={{ border: '1px solid #F1F5F9', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span><b>{po.poNumber}</b> · {po.supplier?.name}</span>
                  <span>AED {Number(po.totalAmount ?? 0).toFixed(2)} · <span style={{ color: '#64748B' }}>{po.status.replace(/_/g, ' ')}</span></span>
                </div>
              ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              {detail.status === 'draft' && <Btn label="Edit" variant="secondary" onClick={() => { setDetail(null); editDraft(detail.id) }} />}
              {detail.status === 'draft' && <Btn label="Submit for Approval" onClick={() => act(detail.id, 'submit', 'Submit for approval')} />}
              {detail.status === 'pending_approval' && <Btn label="Approve" onClick={() => act(detail.id, 'approve', 'Approve')} />}
              {detail.status === 'pending_approval' && <Btn label="Reject" variant="danger" onClick={() => act(detail.id, 'reject', 'Reject')} />}
              {detail.status === 'approved' && detail.ordered.some(o => o.remaining > 0) && <Btn label="Create PO from this requisition" onClick={() => createPO(detail.id)} />}
              {!['cancelled', 'rejected'].includes(detail.status) && detail.purchaseOrders.every(p => p.status === 'cancelled') && (
                <Btn label="Cancel Requisition" variant="secondary" onClick={() => act(detail.id, 'cancel', 'Cancel')} />
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
