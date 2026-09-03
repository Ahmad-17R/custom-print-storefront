import React, { useEffect, useState } from 'react'
import { AdminLayout, Btn, SearchInput, StatCard, StatGrid, Table } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Customer {
  id: string; name: string; phone: string | null; email: string | null
  company: string | null; notes: string | null; tags: string[]
  isActive: boolean; createdAt: string
  _count: { sales: number; noteLog: number }
}
interface Note { id: string; content: string; createdAt: string }
interface Sale { id: string; saleNumber: string; status: string; totalAmount: number; advancePaid: number; createdAt: string; _count: { items: number } }
interface CustomerDetail extends Customer { noteLog: Note[]; sales: Sale[] }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

const STATUS_COLOR: Record<string, string> = {
  pending: '#94A3B8', confirmed: '#3B82F6', in_production: '#F59E0B',
  ready_for_pickup: '#8B5CF6', completed: '#10B981', cancelled: '#EF4444',
}

// ── New / Edit Customer Modal ─────────────────────────────────────────────────
function CustomerModal({ initial, onClose, onSave }: { initial?: Customer; onClose: () => void; onSave: () => void }) {
  const [name,    setName]    = useState(initial?.name    ?? '')
  const [phone,   setPhone]   = useState(initial?.phone   ?? '')
  const [email,   setEmail]   = useState(initial?.email   ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [notes,   setNotes]   = useState(initial?.notes   ?? '')
  const [tag,     setTag]     = useState('')
  const [tags,    setTags]    = useState<string[]>(initial?.tags ?? [])
  const [err,     setErr]     = useState('')
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setSaving(true)
    try {
      if (initial) {
        await api.patch(`/walk-in-customers/${initial.id}`, { name, phone: phone || null, email: email || null, company: company || null, notes: notes || null, tags })
      } else {
        await api.post('/walk-in-customers', { name, phone: phone || null, email: email || null, company: company || null, notes: notes || null, tags })
      }
      onSave(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{initial ? 'Edit Customer' : 'New Walk-in Customer'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <label style={{ gridColumn: '1/-1' }}>{lbl('Full Name *')}<input value={name} onChange={e => setName(e.target.value)} style={inp} /></label>
          <label>{lbl('Phone')}<input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="+971 …" /></label>
          <label>{lbl('Email')}<input value={email} onChange={e => setEmail(e.target.value)} style={inp} /></label>
          <label style={{ gridColumn: '1/-1' }}>{lbl('Company / Business')}<input value={company} onChange={e => setCompany(e.target.value)} style={inp} /></label>
          <label style={{ gridColumn: '1/-1' }}>{lbl('Notes')}<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} /></label>
        </div>
        <div style={{ marginBottom: 14 }}>
          {lbl('Tags')}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {tags.map(t => (
              <span key={t} style={{ fontSize: 12, background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 }}>
                {t} <button onClick={() => setTags(prev => prev.filter(x => x !== t))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#93C5FD', fontWeight: 700, padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && tag.trim()) { setTags(p => [...p, tag.trim()]); setTag('') } }} placeholder="Type tag + Enter" style={{ ...inp, flex: 1 }} />
            <Btn label="Add" onClick={() => { if (tag.trim()) { setTags(p => [...p, tag.trim()]); setTag('') } }} variant="secondary" />
          </div>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Customer'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Customer Detail Drawer ────────────────────────────────────────────────────
function DetailDrawer({ customer, onClose, onEdit, onRefresh }: { customer: Customer; onClose: () => void; onEdit: () => void; onRefresh: () => void }) {
  const [detail,  setDetail]  = useState<CustomerDetail | null>(null)
  const [note,    setNote]    = useState('')
  const [addNote, setAddNote] = useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    api.get<CustomerDetail>(`/walk-in-customers/${customer.id}`).then(setDetail)
  }, [customer.id])

  const postNote = async () => {
    if (!note.trim()) return
    setSaving(true)
    try {
      await api.post(`/walk-in-customers/${customer.id}/notes`, { content: note })
      setNote(''); setAddNote(false)
      const d = await api.get<CustomerDetail>(`/walk-in-customers/${customer.id}`)
      setDetail(d)
    } finally { setSaving(false) }
  }

  const fmt = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const totalSpend = detail?.sales.filter(s => s.status !== 'cancelled').reduce((a, s) => a + Number(s.totalAmount), 0) ?? 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: 480, background: '#fff', overflowY: 'auto', padding: 28, fontFamily: FONT }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>{customer.name}</div>
            {customer.phone   && <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>📞 {customer.phone}</div>}
            {customer.email   && <div style={{ fontSize: 13, color: '#64748B' }}>✉️ {customer.email}</div>}
            {customer.company && <div style={{ fontSize: 13, color: '#64748B' }}>🏢 {customer.company}</div>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn label="Edit" variant="secondary" onClick={onEdit} />
            <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
          </div>
        </div>

        {customer.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {customer.tags.map(t => <span key={t} style={{ fontSize: 12, background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: 999 }}>{t}</span>)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Orders', value: String(customer._count.sales) },
            { label: 'Total Spend',  value: `AED ${fmt(totalSpend)}` },
            { label: 'Since',        value: customer.createdAt.slice(0, 10) },
          ].map(s => (
            <div key={s.label} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {customer.notes && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
            {customer.notes}
          </div>
        )}

        {/* Sales history */}
        <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 10 }}>Orders</div>
        {!detail ? <div style={{ fontSize: 13, color: '#94A3B8' }}>Loading…</div> : detail.sales.length === 0
          ? <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>No orders yet</div>
          : detail.sales.map(s => (
            <div key={s.id} style={{ border: '1px solid #F1F5F9', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{s.saleNumber}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{s._count.items} item{s._count.items !== 1 ? 's' : ''} · {s.createdAt.slice(0, 10)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>AED {fmt(Number(s.totalAmount))}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: (STATUS_COLOR[s.status] ?? '#94A3B8') + '20', color: STATUS_COLOR[s.status] ?? '#94A3B8' }}>
                  {s.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))
        }

        {/* Notes log */}
        <div style={{ fontWeight: 700, fontSize: 13, color: DARK, margin: '20px 0 10px' }}>Interaction Notes</div>
        {!addNote
          ? <button onClick={() => setAddNote(true)} style={{ marginBottom: 12, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>+ Add Note</button>
          : (
            <div style={{ marginBottom: 12 }}>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Interaction note…" style={{ ...inp, marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn label={saving ? 'Saving…' : 'Save Note'} onClick={postNote} />
                <Btn label="Cancel" variant="secondary" onClick={() => { setAddNote(false); setNote('') }} />
              </div>
            </div>
          )
        }
        {detail?.noteLog.map(n => (
          <div key={n.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: DARK }}>{n.content}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function WalkInCustomersPage() {
  const [data,    setData]    = useState<Customer[]>([])
  const [loading, setLoad]    = useState(true)
  const [q,       setQ]       = useState('')
  const [showNew, setNew]     = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [viewing, setViewing] = useState<Customer | null>(null)

  const load = async () => {
    setLoad(true)
    try { setData((await api.get<{ data: Customer[] }>('/walk-in-customers?pageSize=200')).data) }
    finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    (c.phone   ?? '').includes(q) ||
    (c.email   ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const thisMonth = new Date().toISOString().slice(0, 7)

  const COLS = [
    { key: 'name',    label: 'Name',    width: 180 },
    { key: 'phone',   label: 'Phone',   width: 130 },
    { key: 'company', label: 'Company', width: 150 },
    { key: 'tags',    label: 'Tags' },
    { key: 'orders',  label: 'Orders',  width: 80 },
    { key: 'since',   label: 'Since',   width: 100 },
  ]

  const rows = filtered.map(c => ({
    name:    <span style={{ fontWeight: 600, color: DARK, cursor: 'pointer' }} onClick={() => setViewing(c)}>{c.name}</span>,
    phone:   c.phone ?? <span style={{ color: '#CBD5E1' }}>—</span>,
    company: c.company ?? <span style={{ color: '#CBD5E1' }}>—</span>,
    tags:    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
               {c.tags.map(t => <span key={t} style={{ fontSize: 11, background: '#EFF6FF', color: '#3B82F6', padding: '1px 7px', borderRadius: 999 }}>{t}</span>)}
             </div>,
    orders:  c._count.sales,
    since:   c.createdAt.slice(0, 10),
  }))

  return (
    <AdminLayout
      title="Customers"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, company…" />
          <Btn label="+ New Customer" onClick={() => setNew(true)} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Customers" value={String(data.length)}                                                     sub="All walk-in customers" />
        <StatCard label="New This Month"  value={String(data.filter(c => c.createdAt.slice(0, 7) === thisMonth).length)}  sub="Added this month"  color="#8B5CF6" />
        <StatCard label="With Tags"       value={String(data.filter(c => c.tags.length > 0).length)}                      sub="Tagged customers"  color="#F59E0B" />
        <StatCard label="Active"          value={String(data.filter(c => c.isActive).length)}                             sub="Active customers"  color="#10B981" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👤</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No customers yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Add your first walk-in customer to get started.</div>
              <Btn label="+ New Customer" onClick={() => setNew(true)} />
            </div>
          )
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} customers</div><Table columns={COLS} rows={rows} onRowClick={i => setViewing(filtered[i])} /></>
      }

      {(showNew || editing) && (
        <CustomerModal
          initial={editing ?? undefined}
          onClose={() => { setNew(false); setEditing(null) }}
          onSave={() => { load(); if (viewing && editing?.id === viewing.id) setViewing(null) }}
        />
      )}
      {viewing && !editing && (
        <DetailDrawer
          customer={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing) }}
          onRefresh={load}
        />
      )}
    </AdminLayout>
  )
}
