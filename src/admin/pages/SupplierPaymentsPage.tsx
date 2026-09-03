import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Supplier { id: string; name: string }
interface SupplierPayment {
  id: string; supplierId: string; poId: string | null; amount: string; method: string
  paidDate: string; reference: string | null; notes: string | null; createdAt: string
  supplier?: { id: string; name: string }
}

const METHODS = ['bank_transfer', 'cash', 'card', 'cheque', 'online']
const METHOD_COLOR: Record<string, string> = { bank_transfer: '#8B5CF6', cash: '#10B981', card: '#1D4ED8', cheque: '#F59E0B', online: '#06B6D4' }

function Modal({ item, suppliers, onClose, onSaved }: { item: Partial<SupplierPayment> | null; suppliers: Supplier[]; onClose: () => void; onSaved: () => void }) {
  const [supplierId, setSupp] = useState(item?.supplierId ?? suppliers[0]?.id ?? '')
  const [amount, setAmount]   = useState(item?.amount ? String(Number(item.amount)) : '')
  const [method, setMethod]   = useState(item?.method ?? 'bank_transfer')
  const [paidDate, setDate]   = useState(item?.paidDate ? item.paidDate.slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [reference, setRef]   = useState(item?.reference ?? '')
  const [notes, setNotes]     = useState(item?.notes ?? '')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/supplier-payments/${item.id}`, { reference: reference || null, notes: notes || null })
      else          await api.post('/supplier-payments', { supplierId, amount: Number(amount), method, paidDate, reference: reference || null, notes: notes || null })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 460, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Payment' : 'Record Supplier Payment'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <>
            <label>{lbl('Supplier *')}<select style={inp} value={supplierId} onChange={e => setSupp(e.target.value)}>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>{lbl('Amount (AED) *')}<input type="number" min="0" step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></label>
              <label>{lbl('Method *')}<select style={inp} value={method} onChange={e => setMethod(e.target.value)}>
                {METHODS.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select></label>
              <label>{lbl('Payment Date *')}<input type="date" style={inp} value={paidDate} onChange={e => setDate(e.target.value)} /></label>
              <label>{lbl('Reference #')}<input style={inp} value={reference} onChange={e => setRef(e.target.value)} placeholder="e.g. TXN-001" /></label>
            </div>
          </>}
          {item?.id && <label>{lbl('Reference #')}<input style={inp} value={reference} onChange={e => setRef(e.target.value)} /></label>}
          <label>{lbl('Notes')}<textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const COLS = [
  { key: 'supplier', label: 'Supplier', width: 180 }, { key: 'amount', label: 'Amount', width: 130 },
  { key: 'method', label: 'Method', width: 120 }, { key: 'paidDate', label: 'Date', width: 110 },
  { key: 'reference', label: 'Reference', width: 130 }, { key: 'actions', label: '', width: 110 },
]

export function SupplierPaymentsPage() {
  const [data, setData]         = useState<SupplierPayment[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Partial<SupplierPayment> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([
        api.get<{ data: SupplierPayment[] }>('/supplier-payments?pageSize=200'),
        api.get<{ data: Supplier[] }>('/suppliers?pageSize=500'),
      ])
      setData(r.data); setSuppliers(s.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm('Delete this payment?')) return
    try { await api.delete(`/supplier-payments/${id}`); load() }
    catch (e: any) { alert(e?.message ?? 'Delete failed') }
  }

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r =>
    (r.supplier?.name ?? r.supplierId).toLowerCase().includes(q.toLowerCase()) ||
    (r.reference ?? '').toLowerCase().includes(q.toLowerCase())
  )
  const totalThisMonth = data.filter(r => r.paidDate.slice(0, 7) === new Date().toISOString().slice(0, 7)).reduce((s, r) => s + Number(r.amount), 0)

  const rows = filtered.map(r => ({
    supplier: r.supplier?.name ?? r.supplierId,
    amount: <strong>AED {Number(r.amount).toLocaleString()}</strong>,
    method: <Badge label={r.method.replace(/_/g, ' ')} color={METHOD_COLOR[r.method] ?? '#64748B'} />,
    paidDate: r.paidDate.slice(0, 10),
    reference: r.reference ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => del(r.id)} style={{ ...btnS, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Supplier Payments" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search supplier, reference…" /><Btn label="+ Record Payment" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Payments" value={String(data.length)} sub="All payments made" />
        <StatCard label="This Month" value={`AED ${totalThisMonth.toLocaleString()}`} sub="Paid this month" color="#EF4444" />
        <StatCard label="Total Paid" value={`AED ${data.reduce((s, r) => s + Number(r.amount), 0).toLocaleString()}`} sub="All time" color="#1D4ED8" />
        <StatCard label="Suppliers" value={String(new Set(data.map(r => r.supplierId)).size)} sub="Unique suppliers paid" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} suppliers={suppliers} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
