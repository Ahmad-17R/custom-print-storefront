import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

type Plan = { id: string; name: string; description: string | null; price: number; billingCycle: string; isActive: boolean; _count?: { subscriptions: number } }

export function PlansPage() {
  const [rows, setRows] = useState<Plan[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/plans?pageSize=200').then(r => { setRows(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  const tableRows = filtered.map(r => ({
    Name: r.name,
    Price: `AED ${r.price.toFixed(2)}`,
    Cycle: <Badge color="blue">{r.billingCycle}</Badge>,
    Subscribers: r._count?.subscriptions ?? 0,
    Status: <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
  }))

  return (
    <AdminLayout title="Subscription Plans">
      <SearchInput value={search} onChange={setSearch} placeholder="Search plans..." />
      <Table columns={['Name', 'Price', 'Cycle', 'Subscribers', 'Status']} rows={tableRows} loading={loading} />
    </AdminLayout>
  )
}
