import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Country { id: string; name: string }
interface FiscalPeriod {
  id: string; name: string; startDate: string; endDate: string; status: string; isClosed: boolean; createdAt: string
  country?: { id: string; name: string }
  _count: { journals: number; budgets: number }
}

function Modal({ item, countries, onClose, onSaved }: { item: Partial<FiscalPeriod> | null; countries: Country[]; onClose: () => void; onSaved: () => void }) {
  const [countryId, setCountry] = useState(item?.country?.id ?? countries[0]?.id ?? '')
  const [name, setName]         = useState(item?.name ?? '')
  const [startDate, setStart]   = useState(item?.startDate ? item.startDate.slice(0, 10) : '')
  const [endDate, setEnd]       = useState(item?.endDate ? item.endDate.slice(0, 10) : '')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/fiscal-periods/${item.id}`, { name })
      else          await api.post('/fiscal-periods', { countryId, name, startDate, endDate })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 440, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Fiscal Period' : 'New Fiscal Period'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <label>{lbl('Country *')}<select style={inp} value={countryId} onChange={e => setCountry(e.target.value)}>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
          <label>{lbl('Period Name *')}<input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FY 2026 Q1" /></label>
          {!item?.id && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>{lbl('Start Date *')}<input type="date" style={inp} value={startDate} onChange={e => setStart(e.target.value)} /></label>
              <label>{lbl('End Date *')}<input type="date" style={inp} value={endDate} onChange={e => setEnd(e.target.value)} /></label>
            </div>
          )}
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
  { key: 'name', label: 'Period Name' }, { key: 'country', label: 'Country', width: 150 },
  { key: 'startDate', label: 'Start', width: 110 }, { key: 'endDate', label: 'End', width: 110 },
  { key: 'journals', label: 'Journals', width: 90 }, { key: 'status', label: 'Status', width: 100 },
  { key: 'actions', label: '', width: 180 },
]

export function FiscalPeriodsPage() {
  const [data, setData]         = useState<FiscalPeriod[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Partial<FiscalPeriod> | null>(null)
  const [acting, setActing]     = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        api.get<{ data: FiscalPeriod[] }>('/fiscal-periods?pageSize=200'),
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
      ])
      setData(r.data); setCountries(c.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggleClose = async (p: FiscalPeriod) => {
    setActing(p.id)
    try {
      await api.patch(`/fiscal-periods/${p.id}`, { status: p.isClosed ? 'open' : 'closed' })
      load()
    } catch (e: any) { alert(e?.message ?? 'Error') }
    finally { setActing(null) }
  }

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || (r.country?.name ?? '').toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    name: r.name,
    country: r.country?.name ?? '—',
    startDate: r.startDate.slice(0, 10),
    endDate: r.endDate.slice(0, 10),
    journals: r._count.journals,
    status: <Badge label={r.isClosed ? 'Closed' : 'Open'} color={r.isClosed ? '#64748B' : '#10B981'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button disabled={acting === r.id} onClick={() => toggleClose(r)}
          style={{ ...btnS, border: `1px solid ${r.isClosed ? '#BBF7D0' : '#FEF3C7'}`, background: r.isClosed ? '#F0FDF4' : '#FFFBEB', color: r.isClosed ? '#15803D' : '#92400E', opacity: acting === r.id ? 0.6 : 1 }}>
          {r.isClosed ? 'Reopen' : 'Close'}
        </button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Fiscal Periods" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search period…" /><Btn label="+ New Period" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Periods" value={String(data.length)} sub="All fiscal periods" />
        <StatCard label="Open" value={String(data.filter(r => !r.isClosed).length)} sub="Open periods" color="#10B981" />
        <StatCard label="Closed" value={String(data.filter(r => r.isClosed).length)} sub="Closed periods" color="#64748B" />
        <StatCard label="Journal Entries" value={String(data.reduce((s, r) => s + r._count.journals, 0))} sub="Total entries" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} countries={countries} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
