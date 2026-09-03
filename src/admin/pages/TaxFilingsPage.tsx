import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Country { id: string; name: string }
interface VatCalc { from: string; to: string; vatCollected: number; vatPaid: number; vatPayable: number }
interface TaxFiling {
  id: string; period: string; periodEnd: string; status: string; filedAt: string | null; notes: string | null; createdAt: string
  country?: { id: string; name: string }
}

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', submitted: 'Submitted', accepted: 'Accepted', rejected: 'Rejected' }
const STATUS_COLOR: Record<string, string> = { draft: '#64748B', submitted: '#F59E0B', accepted: '#10B981', rejected: '#EF4444' }

function Modal({ item, countries, onClose, onSaved }: { item: Partial<TaxFiling> | null; countries: Country[]; onClose: () => void; onSaved: () => void }) {
  const [countryId, setCountry] = useState(item?.country?.id ?? countries[0]?.id ?? '')
  const [period, setPeriod]     = useState(item?.period ?? '')
  const [periodEnd, setEnd]     = useState(item?.periodEnd ? item.periodEnd.slice(0, 10) : '')
  const [notes, setNotes]       = useState(item?.notes ?? '')
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/tax-filings/${item.id}`, { notes: notes || null })
      else          await api.post('/tax-filings', { countryId, period, periodEnd, notes: notes || null })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 440, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Tax Filing' : 'New Tax Filing'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <>
            <label>{lbl('Country *')}<select style={inp} value={countryId} onChange={e => setCountry(e.target.value)}>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>{lbl('Period *')}<input style={inp} value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Q3 2026" /></label>
            <label>{lbl('Period End Date *')}<input type="date" style={inp} value={periodEnd} onChange={e => setEnd(e.target.value)} /></label>
          </>}
          <label>{lbl('Notes')}<textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" /></label>
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
  { key: 'period', label: 'Period', width: 130 }, { key: 'country', label: 'Country', width: 160 },
  { key: 'periodEnd', label: 'Period End', width: 110 }, { key: 'status', label: 'Status', width: 110 },
  { key: 'filedAt', label: 'Filed At', width: 110 }, { key: 'actions', label: '', width: 200 },
]

export function TaxFilingsPage() {
  const [data, setData]         = useState<TaxFiling[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [statusFilter, setFilter] = useState('all')
  const [modal, setModal]       = useState<Partial<TaxFiling> | null>(null)
  const [acting, setActing]     = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 8) + '01'
  const [vatFrom, setVatFrom]   = useState(firstOfMonth)
  const [vatTo, setVatTo]       = useState(today)
  const [vatCalc, setVatCalc]   = useState<VatCalc | null>(null)
  const [vatLoading, setVatLoad] = useState(false)

  const calcVat = async () => {
    setVatLoad(true)
    try {
      const r = await api.get<VatCalc>(`/tax-filings/calculate?from=${vatFrom}&to=${vatTo}`)
      setVatCalc(r)
    } catch (e: any) { alert(e?.response?.data?.error || e?.message || 'Error') }
    finally { setVatLoad(false) }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        api.get<{ data: TaxFiling[] }>('/tax-filings?pageSize=200'),
        api.get<{ data: Country[] }>('/countries?pageSize=200'),
      ])
      setData(r.data); setCountries(c.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const submit = async (id: string) => {
    setActing(id)
    try { await api.post(`/tax-filings/${id}/submit`, {}); load() }
    catch (e: any) { alert(e?.message ?? 'Error') }
    finally { setActing(null) }
  }

  const STATUSES = ['all', 'draft', 'submitted', 'accepted', 'rejected']
  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (r.period.toLowerCase().includes(q.toLowerCase()) || (r.country?.name ?? '').toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(r => ({
    period: <strong>{r.period}</strong>,
    country: r.country?.name ?? '—',
    periodEnd: r.periodEnd.slice(0, 10),
    status: <Badge label={STATUS_LABEL[r.status] ?? r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    filedAt: r.filedAt ? r.filedAt.slice(0, 10) : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {r.status === 'draft' && <>
          <button disabled={acting === r.id} onClick={() => submit(r.id)} style={{ ...btnS, border: 'none', background: '#1D4ED8', color: '#fff', opacity: acting === r.id ? 0.6 : 1 }}>Submit</button>
          <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        </>}
      </div>
    ),
  }))

  return (
    <AdminLayout title="Tax Filings" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search period, country…" /><Btn label="+ New Filing" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Filings" value={String(data.length)} sub="All tax filings" />
        <StatCard label="Draft" value={String(data.filter(r => r.status === 'draft').length)} sub="Not yet submitted" color="#64748B" />
        <StatCard label="Submitted" value={String(data.filter(r => r.status === 'submitted').length)} sub="Awaiting acceptance" color="#F59E0B" />
        <StatCard label="Accepted" value={String(data.filter(r => r.status === 'accepted').length)} sub="Accepted filings" color="#10B981" />
      </StatGrid>
      {/* VAT Auto-Calculator */}
      <div style={{ marginBottom: 20, padding: '16px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#15803D', marginBottom: 12 }}>VAT Calculator — Auto from Journal Entries</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>From:</span>
            <input type="date" style={{ ...inp, width: 'auto' }} value={vatFrom} onChange={e => setVatFrom(e.target.value)} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#64748B', fontWeight: 600 }}>To:</span>
            <input type="date" style={{ ...inp, width: 'auto' }} value={vatTo} onChange={e => setVatTo(e.target.value)} />
          </label>
          <button onClick={calcVat} disabled={vatLoading} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#15803D', color: '#fff', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: vatLoading ? 0.6 : 1 }}>
            {vatLoading ? 'Calculating…' : 'Calculate VAT'}
          </button>
        </div>
        {vatCalc && (
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', minWidth: 160, border: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>VAT Collected (Output)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: DARK, fontVariantNumeric: 'tabular-nums' }}>AED {vatCalc.vatCollected.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>Charged to customers</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: '12px 20px', minWidth: 160, border: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>VAT Paid (Input)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: DARK, fontVariantNumeric: 'tabular-nums' }}>AED {vatCalc.vatPaid.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>Paid to suppliers</div>
            </div>
            <div style={{ background: vatCalc.vatPayable >= 0 ? '#fff' : '#FEF2F2', borderRadius: 10, padding: '12px 20px', minWidth: 160, border: `1px solid ${vatCalc.vatPayable >= 0 ? '#D1FAE5' : '#FECACA'}` }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Net VAT Payable to FTA</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: vatCalc.vatPayable >= 0 ? '#B45309' : '#15803D', fontVariantNumeric: 'tabular-nums' }}>AED {Math.abs(vatCalc.vatPayable).toLocaleString('en-AE', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{vatCalc.vatPayable >= 0 ? 'Amount to pay to FTA' : 'VAT refund due'}</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUSES.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} countries={countries} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
