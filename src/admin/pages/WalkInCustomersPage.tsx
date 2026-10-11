import React, { useEffect, useState } from 'react'
import { AdminLayout, Btn, SearchInput, StatCard, StatGrid, Table } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { PhoneList, tidyPhones, allPhones } from '../components/PhoneList'
import { CustomerHistoryPanel, RecordDepositModal } from '../components/CustomerHistory'
import { StatementModal } from '../components/StatementModal'
import { TREATMENT_LABEL, type VatTreatment } from '../lib/tax'

interface CustomerType { id: string; name: string; discountPercent: string; isActive: boolean }

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Customer {
  id: string; name: string; phone: string | null; phones?: string[]; email: string | null
  company: string | null; trn: string | null; corporateTaxNumber: string | null; notes: string | null; tags: string[]
  isActive: boolean; createdAt: string
  _count: { sales: number; noteLog: number }
  groupId?: string | null; vatTreatment?: VatTreatment
  group?: { id: string; name: string; discountPercent: string } | null
}
interface Note { id: string; content: string; createdAt: string }
interface CustomerDetail extends Customer { noteLog: Note[] }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>

// ── New / Edit Customer Modal ─────────────────────────────────────────────────
function CustomerModal({ initial, onClose, onSave }: { initial?: Customer; onClose: () => void; onSave: () => void }) {
  const [name,    setName]    = useState(initial?.name    ?? '')
  const [phone,   setPhone]   = useState(initial?.phone   ?? '')
  const [phones,  setPhones]  = useState<string[]>(initial?.phones ?? [])
  const [trn,     setTrn]     = useState(initial?.trn ?? '')
  const [groupId, setGroupId] = useState(initial?.groupId ?? '')
  const [vatTreatment, setVatTreatment] = useState<VatTreatment>(initial?.vatTreatment ?? 'standard')
  const [types,   setTypes]   = useState<CustomerType[]>([])
  useEffect(() => { api.get<{ data: CustomerType[] }>('/customer-groups').then(r => setTypes(r.data)).catch(() => {}) }, [])
  const [email,   setEmail]   = useState(initial?.email   ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [corporateTaxNumber, setCorporateTaxNumber] = useState(initial?.corporateTaxNumber ?? '')
  const [notes,   setNotes]   = useState(initial?.notes   ?? '')
  const [tag,     setTag]     = useState('')
  const [tags,    setTags]    = useState<string[]>(initial?.tags ?? [])
  const [err,     setErr]     = useState('')
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setSaving(true)
    try {
      const body = { name, phone: phone || null, phones: tidyPhones(phones), email: email || null, company: company || null, trn: trn.trim() || null, corporateTaxNumber: corporateTaxNumber.trim() || null, notes: notes || null, tags, groupId: groupId || null, vatTreatment }
      if (initial) {
        await api.patch(`/walk-in-customers/${initial.id}`, body)
      } else {
        await api.post('/walk-in-customers', body)
      }
      onSave(); onClose()
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxWidth: '100%', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{initial ? 'Edit Customer' : 'New Walk-in Customer'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <label style={{ gridColumn: '1/-1' }}>{lbl('Full Name *')}<input value={name} onChange={e => setName(e.target.value)} style={inp} /></label>
          <label>{lbl('Phone')}<input value={phone} onChange={e => setPhone(e.target.value)} style={inp} placeholder="+971 …" /></label>
          <label>{lbl('Email')}<input value={email} onChange={e => setEmail(e.target.value)} style={inp} /></label>
          <div style={{ gridColumn: '1/-1' }}>{lbl('Other phone numbers')}<PhoneList phones={phones} onChange={setPhones} inputStyle={inp} /></div>
          <label style={{ gridColumn: '1/-1' }}>{lbl('Company / Business')}<input value={company} onChange={e => setCompany(e.target.value)} style={inp} /></label>
          <label>{lbl('TRN (Tax Reg. No.)')}<input value={trn} maxLength={15} onChange={e => setTrn(e.target.value)} style={inp} placeholder="15 characters" /></label>
          <label>{lbl('Corporate Tax No.')}<input value={corporateTaxNumber} onChange={e => setCorporateTaxNumber(e.target.value)} style={inp} /></label>
          <label>{lbl('Customer type / special rates')}
            <select value={groupId} onChange={e => setGroupId(e.target.value)} style={inp}>
              <option value="">Regular customer (catalogue prices)</option>
              {types.filter(t => t.isActive || t.id === groupId).map(t => <option key={t.id} value={t.id}>{t.name}{Number(t.discountPercent) > 0 ? ` — ${Number(t.discountPercent)}% off` : ''}</option>)}
            </select>
          </label>
          <label>{lbl('VAT treatment')}
            <select value={vatTreatment} onChange={e => setVatTreatment(e.target.value as VatTreatment)} style={inp}>
              {(Object.keys(TREATMENT_LABEL) as VatTreatment[]).map(t => <option key={t} value={t}>{TREATMENT_LABEL[t]}</option>)}
            </select>
          </label>
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
  const [depositOpen, setDepositOpen] = useState(false)
  const [statementOpen, setStatementOpen] = useState(false)
  const [historyKey,  setHistoryKey]  = useState(0)

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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ width: 520, maxWidth: '100vw', background: '#fff', overflowY: 'auto', padding: 28, fontFamily: FONT }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>{customer.name}</div>
            {allPhones(customer.phone, customer.phones) && <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>📞 {allPhones(customer.phone, customer.phones)}</div>}
            {customer.email   && <div style={{ fontSize: 13, color: '#64748B' }}>✉️ {customer.email}</div>}
            {customer.company && <div style={{ fontSize: 13, color: '#64748B' }}>🏢 {customer.company}</div>}
            {customer.trn && <div style={{ fontSize: 13, color: '#64748B' }}>TRN: {customer.trn}</div>}
            {customer.corporateTaxNumber && <div style={{ fontSize: 13, color: '#64748B' }}>Corporate Tax: {customer.corporateTaxNumber}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {customer.group && <span style={{ fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: 999 }}>{customer.group.name}{Number(customer.group.discountPercent) > 0 ? ` · ${Number(customer.group.discountPercent)}% off` : ''}</span>}
              {customer.vatTreatment && customer.vatTreatment !== 'standard' && <span style={{ fontSize: 11, fontWeight: 600, background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: 999 }}>{TREATMENT_LABEL[customer.vatTreatment]}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn label="Statement" variant="secondary" onClick={() => setStatementOpen(true)} />
            <Btn label="Edit" variant="secondary" onClick={onEdit} />
            <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8' }}>×</button>
          </div>
        </div>

        {customer.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {customer.tags.map(t => <span key={t} style={{ fontSize: 12, background: '#EFF6FF', color: '#3B82F6', padding: '2px 8px', borderRadius: 999 }}>{t}</span>)}
          </div>
        )}

        {customer.notes && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
            {customer.notes}
          </div>
        )}

        {/* Full history: walk-in + online orders, payments, balance, deposits, quotations */}
        <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 10 }}>Order History</div>
        <CustomerHistoryPanel walkInCustomerId={customer.id} reloadKey={historyKey} onRecordDeposit={() => setDepositOpen(true)} />

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
        {statementOpen && <StatementModal kind="customer" id={customer.id} name={customer.name} onClose={() => setStatementOpen(false)} />}
        {depositOpen && (
          <RecordDepositModal customerId={customer.id} customerName={customer.name} onClose={() => setDepositOpen(false)}
            onSaved={() => { setHistoryKey(k => k + 1); onRefresh() }} />
        )}
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
  const [deposit, setDeposit] = useState(false)

  const load = async () => {
    setLoad(true)
    try { setData((await api.get<{ data: Customer[] }>('/walk-in-customers?pageSize=200')).data) }
    finally { setLoad(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    allPhones(c.phone, c.phones).includes(q) ||
    (c.email   ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const thisMonth = new Date().toISOString().slice(0, 7)

  const COLS = [
    { key: 'name',    label: 'Name',    width: 180 },
    { key: 'phone',   label: 'Phone(s)', width: 170 },
    { key: 'company', label: 'Company', width: 150 },
    { key: 'type',    label: 'Type',    width: 140 },
    { key: 'tags',    label: 'Tags' },
    { key: 'orders',  label: 'Orders',  width: 80 },
    { key: 'since',   label: 'Since',   width: 100 },
  ]

  const rows = filtered.map(c => ({
    name:    <span style={{ fontWeight: 600, color: DARK, cursor: 'pointer' }} onClick={() => setViewing(c)}>{c.name}</span>,
    phone:   allPhones(c.phone, c.phones) || <span style={{ color: '#CBD5E1' }}>—</span>,
    company: c.company ?? <span style={{ color: '#CBD5E1' }}>—</span>,
    type:    <div style={{ fontSize: 12 }}>{c.group ? <span style={{ fontWeight: 600, color: '#047857' }}>{c.group.name}</span> : <span style={{ color: '#94A3B8' }}>Regular</span>}{c.vatTreatment && c.vatTreatment !== 'standard' && <div style={{ color: '#92400E' }}>{c.vatTreatment === 'exempt' ? 'VAT exempt' : 'Zero-rated'}</div>}</div>,
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
          <Btn label="+ Record Deposit" variant="secondary" onClick={() => setDeposit(true)} />
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
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} customers</div><Table columns={COLS} rows={rows} onRowClick={row => setViewing(filtered[rows.findIndex(r => r === row)])} /></>
      }

      {(showNew || editing) && (
        <CustomerModal
          initial={editing ?? undefined}
          onClose={() => { setNew(false); setEditing(null) }}
          onSave={() => { load(); if (viewing && editing?.id === viewing.id) setViewing(null) }}
        />
      )}
      {deposit && <RecordDepositModal onClose={() => setDeposit(false)} onSaved={load} />}
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
