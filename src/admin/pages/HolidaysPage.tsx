import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

type Holiday = { id: string; name: string; date: string; isRecurring: boolean; country?: { name: string; code: string } }

export function HolidaysPage() {
  const [rows, setRows] = useState<Holiday[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/holidays?pageSize=200').then(r => { setRows(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.country?.name.toLowerCase().includes(search.toLowerCase()))
  const tableRows = filtered.map(r => ({
    Name: r.name,
    Date: new Date(r.date).toLocaleDateString(),
    Country: r.country?.name ?? '—',
    Recurring: <Badge color={r.isRecurring ? 'blue' : 'gray'}>{r.isRecurring ? 'Yes' : 'No'}</Badge>,
  }))

  return (
    <AdminLayout title="Public Holidays">
      <SearchInput value={search} onChange={setSearch} placeholder="Search holidays..." />
      <Table columns={['Name', 'Date', 'Country', 'Recurring']} rows={tableRows} loading={loading} />
    </AdminLayout>
  )
}
