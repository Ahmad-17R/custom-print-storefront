import { ReactNode, useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

type Sub = { id: string; customerId: string; status: string; startDate: string; endDate: string | null; renewsAt: string | null; plan?: { name: string; price: number; billingCycle: string } }

const statusColor: Record<string, string> = { active: 'green', paused: 'yellow', cancelled: 'red', expired: 'gray' }

export function SubscriptionsPage() {
  const [rows, setRows] = useState<Sub[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/subscriptions?pageSize=200').then(r => { setRows(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const statuses = ['all', 'active', 'paused', 'cancelled', 'expired']
  const filtered = rows
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => r.plan?.name.toLowerCase().includes(search.toLowerCase()) || r.customerId.includes(search))

  const tableRows: Record<string, ReactNode>[] = filtered.map(r => ({
    Plan: r.plan?.name ?? '—',
    'Customer ID': r.customerId,
    Price: r.plan ? `AED ${r.plan.price.toFixed(2)} / ${r.plan.billingCycle}` : '—',
    Status: <Badge color={statusColor[r.status] ?? 'gray'}>{r.status}</Badge>,
    'Start Date': new Date(r.startDate).toLocaleDateString(),
    'Renews At': r.renewsAt ? new Date(r.renewsAt).toLocaleDateString() : '—',
  }))

  return (
    <AdminLayout title="Subscriptions">
      <SearchInput value={search} onChange={setSearch} placeholder="Search subscriptions..." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '4px 14px', borderRadius: 20, cursor: 'pointer', fontWeight: filter === s ? 600 : 400, background: filter === s ? '#0F172A' : 'transparent', color: filter === s ? '#fff' : 'inherit', border: '1px solid #E2E8F0' }}>{s}</button>
        ))}
      </div>
      <Table columns={['Plan', 'Customer ID', 'Price', 'Status', 'Start Date', 'Renews At']} rows={tableRows} loading={loading} />
    </AdminLayout>
  )
}
