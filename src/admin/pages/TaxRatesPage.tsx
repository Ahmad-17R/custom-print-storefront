import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Country { id: string; name: string }
interface TaxRate {
  id: string; name: string; rate: string; isDefault: boolean; isActive: boolean; createdAt: string
  country?: { id: string; name: string }
}

function Modal({ item, countries, onClose, onSaved }: { item: Partial<TaxRate> | null; countries: Country[]; onClose: () => void; onSaved: () => void }) {
  const [countryId, setCountry] = useState(item?.country?.id ?? countries[0]?.id ?? '')
  const [name, setName]         = useState(item?.name ?? '')
  const [rate, setRate]         = useState(item?.rate ? String(Number(item.rate)) : '')
  const [isActive, setActive]   = useState(item?.isActive ?? true)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const body = { countryId, name, rate: Number(rate), isActive }
      if (item?.id) await api.patch(`/tax-rates/${item.id}`, { name, rate: Number(rate), isActive })
      else          await api.post('/tax-rates', body)
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 420, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Tax Rate' : 'New Tax Rate'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <label>{lbl('Country *')}<select style={inp} value={countryId} onChange={e => setCountry(e.target.value)}>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
          <label>{lbl('Tax Name *')}<input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VAT 5%" /></label>
          <label>{lbl('Rate (%) *')}<input type="number" step="0.01" min="0" max="100" style={inp} value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 5" /></label>
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
  { key: 'name', label: 'Tax Name' }, { key: 'rate', label: 'Rate', width: 90 },
  { key: 'country', label: 'Country', width: 150 }, { key: 'isDefault', label: 'Default', width: 90 },
  { key: 'status', label: 'Status', width: 90 }, { key: 'actions', label: '', width: 130 },
]

export function TaxRatesPage() {
  const [data, setData]         = useState<TaxRate[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Partial<TaxRate> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        api.get<{ data: TaxRate[] }>('/tax-rates?pageSize=200'),
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
      ])
      setData(r.data); setCountries(c.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete tax rate "${name}"?`)) return
    try { await api.delete(`/tax-rates/${id}`); load() }
    catch (e: any) { alert(e?.message ?? 'Delete failed') }
  }

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || (r.country?.name ?? '').toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    name: r.name,
    rate: `${Number(r.rate).toFixed(2)}%`,
    country: r.country?.name ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>All</span>,
    isDefault: r.isDefault ? <Badge label="Default" color="#8B5CF6" /> : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => del(r.id, r.name)} style={{ ...btnS, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Tax Rates" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search tax name…" /><Btn label="+ Add Tax Rate" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Rates" value={String(data.length)} sub="All tax rates" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Active rates" color="#10B981" />
        <StatCard label="Default Rate" value={data.find(r => r.isDefault)?.name ?? 'None'} sub="Default tax rate" color="#8B5CF6" />
        <StatCard label="Countries" value={String(new Set(data.filter(r => r.country).map(r => r.country?.id)).size)} sub="Unique countries" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} countries={countries} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
