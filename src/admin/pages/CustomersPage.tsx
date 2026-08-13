import { useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Customer { id: string; name: string; email: string; phone: string; company: string; orders: number; spent: number; emirate: string; active: boolean }

const SEED: Customer[] = [
  { id: 'CUS-001', name: 'Ahmed Al Mansouri',  email: 'ahmed@alnoor.ae',       phone: '+971 50 111 2233', company: 'Al Noor Trading LLC',  orders: 12, spent: 8400,  emirate: 'Dubai',    active: true  },
  { id: 'CUS-002', name: 'Sara Khalid',        email: 'sara@falcon.ae',        phone: '+971 55 222 3344', company: 'Falcon Real Estate',   orders: 7,  spent: 4200,  emirate: 'Abu Dhabi',active: true  },
  { id: 'CUS-003', name: 'Mohammed Rashid',    email: 'moh@gulfventures.ae',   phone: '+971 52 333 4455', company: 'Gulf Ventures',        orders: 4,  spent: 1980,  emirate: 'Sharjah',  active: true  },
  { id: 'CUS-004', name: 'Priya Nair',         email: 'priya@horizon.ae',      phone: '+971 56 444 5566', company: 'Horizon Consulting',   orders: 2,  spent: 650,   emirate: 'Dubai',    active: true  },
  { id: 'CUS-005', name: 'Liu Wei',            email: 'liu@dubaifl.ae',        phone: '+971 50 555 6677', company: 'Dubai Flavours',       orders: 9,  spent: 6300,  emirate: 'Dubai',    active: true  },
  { id: 'CUS-006', name: 'Mehmet Yilmaz',      email: 'mehmet@apexevents.ae',  phone: '+971 54 666 7788', company: 'Apex Events',          orders: 3,  spent: 3200,  emirate: 'Ajman',    active: true  },
  { id: 'CUS-007', name: 'Raj Patel',          email: 'raj@techhub.ae',        phone: '+971 55 777 8899', company: 'TechHub DXB',          orders: 6,  spent: 9800,  emirate: 'Dubai',    active: true  },
  { id: 'CUS-008', name: 'Fatima Al Zaabi',    email: 'fatima@pearh.ae',       phone: '+971 50 888 9900', company: 'Pearl Hospitality',    orders: 15, spent: 24000, emirate: 'Abu Dhabi',active: true  },
  { id: 'CUS-009', name: 'Hassan Qureshi',     email: 'hassan@desertrose.ae',  phone: '+971 52 999 0011', company: 'Desert Rose Café',     orders: 5,  spent: 2200,  emirate: 'Dubai',    active: false },
  { id: 'CUS-010', name: 'Elena Popescu',      email: 'elena@skyline.ae',      phone: '+971 56 000 1122', company: 'SkyLine Properties',   orders: 1,  spent: 245,   emirate: 'Dubai',    active: true  },
]

const COLS = [
  { key: 'id',      label: 'ID',      width: 90 },
  { key: 'name',    label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email',   label: 'Email' },
  { key: 'phone',   label: 'Phone',   width: 150 },
  { key: 'emirate', label: 'Emirate', width: 110 },
  { key: 'orders',  label: 'Orders',  width: 80 },
  { key: 'spent',   label: 'Total Spent', width: 120 },
  { key: 'active',  label: 'Status',  width: 100 },
]

export function CustomersPage() {
  const [q, setQ]       = useState('')
  const [em, setEm]     = useState('All')

  const emirates = ['All', ...Array.from(new Set(SEED.map(c => c.emirate)))]

  const filtered = SEED.filter(c =>
    (em === 'All' || c.emirate === em) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) ||
     c.company.toLowerCase().includes(q.toLowerCase()) ||
     c.email.toLowerCase().includes(q.toLowerCase()))
  )

  const totalRevenue = SEED.reduce((s, c) => s + c.spent, 0)
  const activeCount  = SEED.filter(c => c.active).length

  const rows = filtered.map(c => ({
    ...c,
    spent:  `AED ${c.spent.toLocaleString()}`,
    active: <Badge label={c.active ? 'Active' : 'Inactive'} color={c.active ? '#10B981' : '#64748B'} />,
  }))

  return (
    <AdminLayout
      title="Customers"
      actions={<SearchInput value={q} onChange={setQ} placeholder="Search customers…" />}>

      <StatGrid>
        <StatCard label="Total Customers" value={String(SEED.length)}              sub="Registered accounts"  />
        <StatCard label="Active"          value={String(activeCount)}              sub="With recent orders"   color="#10B981" />
        <StatCard label="Total Revenue"   value={`AED ${totalRevenue.toLocaleString()}`} sub="Lifetime value" color="#10B981" />
        <StatCard label="Avg. Order Value" value={`AED ${Math.round(totalRevenue / SEED.reduce((s,c)=>s+c.orders,0))}`} sub="Per order" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {emirates.map(e => (
          <button key={e} onClick={() => setEm(e)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: em === e ? DARK : '#fff', color: em === e ? '#fff' : '#64748B' }}>
            {e}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} customers</div>
      <Table columns={COLS} rows={rows} />
    </AdminLayout>
  )
}
