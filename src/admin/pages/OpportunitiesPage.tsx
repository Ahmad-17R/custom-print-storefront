import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type OppStatus = 'open' | 'won' | 'lost' | 'on_hold'
interface Opportunity {
  id: string; title: string; value: string | null; status: OppStatus; expectedClose: string | null; notes: string | null; createdAt: string
  lead: { id: string; name: string }
}

const STATUS_LABEL: Record<OppStatus, string> = { open: 'Open', won: 'Won', lost: 'Lost', on_hold: 'On Hold' }
const STATUS_COLOR: Record<OppStatus, string> = { open: '#1D4ED8', won: '#10B981', lost: '#EF4444', on_hold: '#F59E0B' }
const STATUSES: OppStatus[] = ['open', 'won', 'lost', 'on_hold']
const COLS = [
  { key: 'title', label: 'Title' }, { key: 'lead', label: 'Lead', width: 160 },
  { key: 'value', label: 'Value', width: 120 }, { key: 'status', label: 'Status', width: 110 },
  { key: 'expectedClose', label: 'Expected Close', width: 130 },
]

export function OpportunitiesPage() {
  const [data, setData] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<OppStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Opportunity[] }>('/opportunities?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && (r.title.toLowerCase().includes(q.toLowerCase()) || r.lead.name.toLowerCase().includes(q.toLowerCase())))
  const totalValue = data.filter(r => r.status === 'open' && r.value).reduce((s, r) => s + Number(r.value), 0)
  const rows = filtered.map(r => ({
    title: r.title, lead: r.lead.name,
    value: r.value ? `AED ${Number(r.value).toLocaleString()}` : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    expectedClose: r.expectedClose ? r.expectedClose.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Opportunities" actions={<SearchInput value={q} onChange={setQ} placeholder="Search title, lead…" />}>
      <StatGrid>
        <StatCard label="Pipeline Value" value={`AED ${totalValue.toLocaleString()}`} sub="Open opportunities" color="#1D4ED8" />
        <StatCard label="Open" value={String(data.filter(r => r.status === 'open').length)} sub="Active" color="#8B5CF6" />
        <StatCard label="Won" value={String(data.filter(r => r.status === 'won').length)} sub="Closed won" color="#10B981" />
        <StatCard label="Lost" value={String(data.filter(r => r.status === 'lost').length)} sub="Closed lost" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No opportunities yet. Convert leads to create opportunities.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} opportunities</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
