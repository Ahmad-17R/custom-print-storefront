import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface DeductionRule { id: string; name: string; type: string; amount: string | null; percent: string | null; isActive: boolean; createdAt: string }

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

function Modal({ rule, onClose, onSaved }: { rule: DeductionRule | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState(rule?.name ?? '')
  const [type, setType]       = useState(rule?.type ?? 'fixed')
  const [amount, setAmount]   = useState(rule?.amount ? String(Number(rule.amount)) : '')
  const [percent, setPercent] = useState(rule?.percent ? String(Number(rule.percent)) : '')
  const [isActive, setActive] = useState(rule?.isActive ?? true)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('Name is required'); return }
    if (type === 'fixed'      && !amount)  { setErr('Amount is required for fixed type'); return }
    if (type === 'percentage' && !percent) { setErr('Percent is required for percentage type'); return }
    setSaving(true)
    try {
      const body = {
        name: name.trim(), type, isActive,
        amount:  type === 'fixed'      ? Number(amount)  : null,
        percent: type === 'percentage' ? Number(percent) : null,
      }
      if (rule) await api.patch(`/deduction-rules/${rule.id}`, body)
      else      await api.post('/deduction-rules', body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 400, padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{rule ? 'Edit Deduction Rule' : 'New Deduction Rule'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label><div>{lbl('Rule Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Social Insurance" /></label>
          <label>
            <div>{lbl('Type *')}</div>
            <select style={inp} value={type} onChange={e => { setType(e.target.value); setAmount(''); setPercent('') }}>
              <option value="fixed">Fixed Amount (AED)</option>
              <option value="percentage">Percentage of Salary (%)</option>
            </select>
          </label>
          {type === 'fixed'      && <label><div>{lbl('Amount (AED) *')}</div><input type="number" min={0} step="0.01" style={inp} value={amount}  onChange={e => setAmount(e.target.value)}  placeholder="0.00" /></label>}
          {type === 'percentage' && <label><div>{lbl('Percent (%) *')}</div><input type="number" min={0} max={100} step="0.01" style={inp} value={percent} onChange={e => setPercent(e.target.value)} placeholder="5.00" /></label>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
            <span style={{ fontSize: 13 }}>Active (applied in payroll generation)</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : rule ? 'Save' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DeductionRulesPage() {
  const [rows, setRows]     = useState<DeductionRule[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState<DeductionRule | null | 'new'>(null)

  const load = () => {
    setLoading(true)
    api.get<{ data: DeductionRule[] }>('/deduction-rules?pageSize=200').then(r => setRows(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const COLS = [
    { key: 'name',    label: 'Rule Name', width: 220 },
    { key: 'type',    label: 'Type',      width: 130 },
    { key: 'value',   label: 'Value',     width: 130 },
    { key: 'status',  label: 'Status',    width: 100 },
    { key: 'created', label: 'Created',   width: 110 },
    { key: 'actions', label: '',          width: 70  },
  ]

  const tableRows = filtered.map(r => ({
    name:    r.name,
    type:    r.type === 'fixed' ? 'Fixed Amount' : 'Percentage',
    value:   r.type === 'fixed' ? `AED ${Number(r.amount).toFixed(2)}` : `${Number(r.percent).toFixed(2)}%`,
    status:  <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#EF4444'} />,
    created: r.createdAt.slice(0, 10),
    actions: <button onClick={e => { e.stopPropagation(); setModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Deduction Rules" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search rules…" />
        <Btn label="+ New Rule" onClick={() => setModal('new')} />
      </div>
    }>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={tableRows} />}
      {modal !== null && <Modal rule={modal === 'new' ? null : modal as DeductionRule} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
