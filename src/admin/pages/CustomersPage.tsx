import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { CustomerHistoryDrawer } from '../components/CustomerHistory'
import { allPhones } from '../components/PhoneList'

const FONT = "'Poppins', system-ui, sans-serif"

interface OnlineCustomer {
  id: string; email: string; fullName: string | null; phone: string | null; phones?: string[]
  companyName: string | null; isActive: boolean; createdAt: string
  _count: { orders: number; salesOrders: number; members?: number }
  group?: { id: string; name: string } | null
}

interface WalkInCustomer {
  id: string; name: string; phone: string | null; phones?: string[]; email: string | null
  company: string | null; createdAt: string
  _count?: { sales?: number }
}

interface UnifiedCustomer {
  id: string; name: string; email: string; company: string; phone: string
  orders: number; type: 'Online' | 'Walk-in'; isActive: boolean; joined: string
  groupId?: string | null; members?: number
}

const COLS = [
  { key: 'name',    label: 'Name' },
  { key: 'type',    label: 'Type',    width: 100 },
  { key: 'email',   label: 'Email',   width: 200 },
  { key: 'company', label: 'Company', width: 160 },
  { key: 'phone',   label: 'Phone',   width: 130 },
  { key: 'ctype',   label: 'Customer type', width: 150 },
  { key: 'orders',  label: 'Orders',  width: 80  },
  { key: 'joined',  label: 'Joined',  width: 110 },
]

export function CustomersPage() {
  const [data, setData]       = useState<UnifiedCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [typeFilter, setType] = useState<'all' | 'Online' | 'Walk-in'>('all')
  const [viewing, setViewing] = useState<UnifiedCustomer | null>(null)
  const [groups, setGroups]   = useState<{ id: string; name: string; isActive?: boolean }[]>([])
  useEffect(() => { api.get<{ data: { id: string; name: string; isActive?: boolean }[] } | { id: string; name: string; isActive?: boolean }[]>('/customer-groups').then(r => setGroups(Array.isArray(r) ? r : r.data)).catch(() => {}) }, [])
  // Online accounts get the same customer-type special rates as walk-in customers
  const setGroup = async (c: UnifiedCustomer, groupId: string) => {
    try { await api.patch(`/customers/${c.id}`, { groupId: groupId || null }); setData(d => d.map(x => x.id === c.id && x.type === c.type ? { ...x, groupId } : x)) }
    catch (e) { alert(e instanceof Error ? e.message : 'Could not save') }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [onlineRes, walkInRes] = await Promise.all([
        api.get<{ data: OnlineCustomer[] }>('/customers?pageSize=500').catch(() => ({ data: [] as OnlineCustomer[] })),
        api.get<{ data: WalkInCustomer[] }>('/walk-in-customers?pageSize=500').catch(() => ({ data: [] as WalkInCustomer[] })),
      ])

      const online: UnifiedCustomer[] = onlineRes.data.map(c => ({
        id: c.id, type: 'Online',
        name:    c.fullName ?? '—',
        email:   c.email ?? '—',
        company: c.companyName ?? '—',
        phone:   allPhones(c.phone, c.phones) || '—',
        orders:  c._count.orders + c._count.salesOrders,
        isActive: c.isActive,
        joined:  c.createdAt.slice(0, 10),
        groupId: c.group?.id ?? null,
        members: c._count.members ?? 0,
      }))

      const walkIn: UnifiedCustomer[] = walkInRes.data.map(c => ({
        id: c.id, type: 'Walk-in',
        name:    c.name ?? '—',
        email:   c.email ?? '—',
        company: c.company ?? '—',
        phone:   allPhones(c.phone, c.phones) || '—',
        orders:  c._count?.sales ?? 0,
        isActive: true,
        joined:  c.createdAt.slice(0, 10),
      }))

      setData([...online, ...walkIn].sort((a, b) => b.joined.localeCompare(a.joined)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(c =>
    (typeFilter === 'all' || c.type === typeFilter) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) ||
     c.email.toLowerCase().includes(q.toLowerCase()) ||
     c.company.toLowerCase().includes(q.toLowerCase()) ||
     c.phone.includes(q))
  )

  const rows = filtered.map(c => ({
    name:    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: '#1D4ED8', cursor: 'pointer' }}>{c.name}</span>,
    type:    <Badge label={c.type} color={c.type === 'Online' ? '#8B5CF6' : '#10B981'} />,
    email:   c.email !== '—' ? c.email : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    company: c.company !== '—' ? c.company : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    phone:   c.phone !== '—' ? c.phone : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    ctype:   c.type === 'Online'
      ? <div onClick={e => e.stopPropagation()}>
          <select value={c.groupId ?? ''} onChange={e => setGroup(c, e.target.value)} style={{ fontSize: 12, padding: '3px 6px', border: '1px solid #E2E8F0', borderRadius: 6, fontFamily: FONT, maxWidth: 140 }}>
            <option value="">Standard</option>
            {groups.filter(g => g.isActive !== false || g.id === c.groupId).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {!!c.members && <div style={{ fontSize: 10, color: '#7C3AED', marginTop: 2 }}>{c.members} authorised user{c.members === 1 ? '' : 's'}</div>}
        </div>
      : <span style={{ color: '#94A3B8', fontSize: 12 }}>set in Walk-in Customers</span>,
    orders:  c.orders,
    joined:  c.joined,
  }))

  const online  = data.filter(c => c.type === 'Online').length
  const walkIn  = data.filter(c => c.type === 'Walk-in').length
  const withOrders = data.filter(c => c.orders > 0).length

  return (
    <AdminLayout title="All Customers" actions={<SearchInput value={q} onChange={setQ} placeholder="Search name, email, company…" />}>
      <StatGrid>
        <StatCard label="Total"     value={String(data.length)} sub="All customers" />
        <StatCard label="Online"    value={String(online)}      sub="Storefront accounts" color="#8B5CF6" />
        <StatCard label="Walk-in"   value={String(walkIn)}      sub="Manual / counter"   color="#10B981" />
        <StatCard label="With Orders" value={String(withOrders)} sub="Have placed orders" color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'Online', 'Walk-in'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: typeFilter === t ? '#0F172A' : '#fff', color: typeFilter === t ? '#fff' : '#64748B' }}>
            {t === 'all' ? `All (${data.length})` : `${t} (${t === 'Online' ? online : walkIn})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : data.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No customers yet.</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} customers</div>
          <Table columns={COLS} rows={rows} onRowClick={row => setViewing(filtered[rows.findIndex(r => r === row)])} />
        </>
      )}
      {viewing && (
        <CustomerHistoryDrawer type={viewing.type === 'Online' ? 'online' : 'walk_in'} id={viewing.id} name={viewing.name} onClose={() => setViewing(null)} />
      )}
    </AdminLayout>
  )
}
