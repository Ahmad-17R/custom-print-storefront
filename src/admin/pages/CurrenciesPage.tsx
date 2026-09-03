import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Currency { id: string; code: string; name: string; symbol: string; isActive: boolean; _count?: { exchangeRates: number } }

function Modal({ item, onClose, onSaved }: { item: Partial<Currency> | null; onClose: () => void; onSaved: () => void }) {
  const [code, setCode]       = useState(item?.code ?? '')
  const [name, setName]       = useState(item?.name ?? '')
  const [symbol, setSymbol]   = useState(item?.symbol ?? '')
  const [isActive, setActive] = useState(item?.isActive ?? true)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/currencies/${item.id}`, { name, symbol, isActive })
      else          await api.post('/currencies', { code, name, symbol, isActive })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 400, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Currency' : 'Add Currency'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <label>{lbl('Currency Code *')}<input style={inp} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. USD" maxLength={3} /></label>}
          <label>{lbl('Currency Name *')}<input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. US Dollar" /></label>
          <label>{lbl('Symbol *')}<input style={inp} value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. $" /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} /> Active
          </label>
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
  { key: 'code', label: 'Code', width: 80 }, { key: 'name', label: 'Name' },
  { key: 'symbol', label: 'Symbol', width: 80 }, { key: 'rates', label: 'Exchange Rates', width: 130 },
  { key: 'status', label: 'Status', width: 90 }, { key: 'actions', label: '', width: 130 },
]

export function CurrenciesPage() {
  const [data, setData]     = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]           = useState('')
  const [modal, setModal]   = useState<Partial<Currency> | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: Currency[] }>('/currencies?pageSize=200'); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r =>
    r.code.toLowerCase().includes(q.toLowerCase()) ||
    r.name.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => ({
    code: <code style={{ fontSize: 13, fontWeight: 700 }}>{r.code}</code>,
    name: r.name,
    symbol: <span style={{ fontSize: 15, fontWeight: 600 }}>{r.symbol}</span>,
    rates: r._count?.exchangeRates ?? 0,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Currencies" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search currency…" /><Btn label="+ Add Currency" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Currencies" value={String(data.length)} sub="All currencies" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Active currencies" color="#10B981" />
        <StatCard label="Inactive" value={String(data.filter(r => !r.isActive).length)} sub="Inactive currencies" color="#64748B" />
        <StatCard label="Base Currency" value="AED" sub="System base currency" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
