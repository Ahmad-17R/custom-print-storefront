import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

type PortalUser = { id: string; customerId: string; email: string; isActive: boolean; lastLoginAt: string | null; createdAt: string }

export function PortalUsersPage() {
  const [rows, setRows] = useState<PortalUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portal-users?pageSize=200').then(r => { setRows(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => r.email.toLowerCase().includes(search.toLowerCase()) || r.customerId.includes(search))
  const tableRows = filtered.map(r => ({
    Email: r.email,
    'Customer ID': r.customerId,
    Status: <Badge color={r.isActive ? 'green' : 'gray'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    'Last Login': r.lastLoginAt ? new Date(r.lastLoginAt).toLocaleDateString() : 'Never',
    Created: new Date(r.createdAt).toLocaleDateString(),
  }))

  return (
    <AdminLayout title="Portal Users">
      <SearchInput value={search} onChange={setSearch} placeholder="Search by email or customer..." />
      <Table columns={['Email', 'Customer ID', 'Status', 'Last Login', 'Created']} rows={tableRows} loading={loading} />
    </AdminLayout>
  )
}
