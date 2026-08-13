import { useNavigate } from 'react-router-dom'
import { AdminLayout, Badge, Table } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// SVG icon components
const Icon = {
  Box: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Grid: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Tag: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Bookmark: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Truck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  ClipboardList: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  BookOpen: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
}

const STATS = [
  { label: 'Active Products', value: '24',         sub: '+3 this month',      color: '#10B981', bg: '#F0FDF4', iconColor: '#10B981', Icon: Icon.Box },
  { label: 'Pending Orders',  value: '18',         sub: '4 need attention',   color: '#EF4444', bg: '#FEF2F2', iconColor: '#EF4444', Icon: Icon.Clock },
  { label: 'Low Stock Items', value: '7',          sub: 'Reorder needed',     color: '#F59E0B', bg: '#FFFBEB', iconColor: '#F59E0B', Icon: Icon.AlertTriangle },
  { label: 'Revenue (Aug)',   value: 'AED 48,200', sub: '+12% vs last month', color: '#1D4ED8', bg: '#EFF6FF', iconColor: '#1D4ED8', Icon: Icon.TrendingUp },
]

const ORDER_COLS = [
  { key: 'id',       label: 'Order ID',  width: 100 },
  { key: 'customer', label: 'Customer' },
  { key: 'product',  label: 'Product' },
  { key: 'status',   label: 'Status',    width: 130 },
  { key: 'date',     label: 'Date',      width: 70 },
]

const statusColor: Record<string, string> = {
  'In Production':   '#1D4ED8',
  'Artwork Review':  '#F59E0B',
  'Delivered':       '#10B981',
  'Pending Payment': '#EF4444',
}

const ORDER_ROWS = [
  { id: 'ORD-1042', customer: 'Al Noor Trading LLC', product: 'Business Cards × 1000', status: 'In Production',   date: 'Aug 11' },
  { id: 'ORD-1041', customer: 'Falcon Real Estate',   product: 'Letterhead × 500',      status: 'Artwork Review',  date: 'Aug 10' },
  { id: 'ORD-1040', customer: 'Gulf Ventures',        product: 'Roll-Up Banner × 2',    status: 'Delivered',       date: 'Aug 9'  },
  { id: 'ORD-1039', customer: 'Horizon Consulting',   product: 'Brochures × 250',       status: 'Pending Payment', date: 'Aug 8'  },
  { id: 'ORD-1038', customer: 'Dubai Flavours',       product: 'Packaging Boxes × 500', status: 'In Production',   date: 'Aug 7'  },
].map(r => ({ ...r, status: <Badge label={r.status} color={statusColor[r.status] ?? '#64748B'} /> }))

const QUICK_GROUPS = [
  {
    label: 'Catalog',
    links: [
      { label: 'Products',   href: '/admin/products',   Icon: Icon.Box },
      { label: 'Categories', href: '/admin/categories', Icon: Icon.Grid },
      { label: 'Brands',     href: '/admin/brands',     Icon: Icon.Bookmark },
    ],
  },
  {
    label: 'Procurement',
    links: [
      { label: 'Suppliers',       href: '/admin/suppliers',       Icon: Icon.Truck },
      { label: 'Purchase Orders', href: '/admin/purchase-orders', Icon: Icon.ClipboardList },
      { label: 'Stock Levels',    href: '/admin/stock',           Icon: Icon.BarChart },
    ],
  },
  {
    label: 'HR & Finance',
    links: [
      { label: 'Employees',          href: '/admin/employees',         Icon: Icon.User },
      { label: 'Payroll',            href: '/admin/payroll',           Icon: Icon.CreditCard },
      { label: 'Chart of Accounts',  href: '/admin/chart-of-accounts', Icon: Icon.BookOpen },
    ],
  },
  {
    label: 'System',
    links: [
      { label: 'Users & Roles', href: '/admin/users',    Icon: Icon.Shield },
      { label: 'Settings',      href: '/admin/settings', Icon: Icon.Settings },
    ],
  },
]

export function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <AdminLayout title="Dashboard">

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT }}>{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.iconColor }}>
                <s.Icon />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: DARK, fontFamily: FONT, lineHeight: 1.1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: s.color, fontFamily: FONT }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Main two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Recent Orders */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: DARK, fontFamily: FONT }}>Recent Orders</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT, color: '#1D4ED8', fontWeight: 500 }}
            >View all →</button>
          </div>
          <Table columns={ORDER_COLS} rows={ORDER_ROWS} onRowClick={() => navigate('/admin/orders')} />
        </div>

        {/* Quick Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {QUICK_GROUPS.map(group => (
            <div key={group.label} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: FONT }}>
                {group.label}
              </div>
              {group.links.map((link, i) => (
                <div
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  style={{
                    padding: '10px 16px',
                    fontSize: 13,
                    cursor: 'pointer',
                    borderBottom: i < group.links.length - 1 ? '1px solid #F8FAFC' : 'none',
                    color: DARK,
                    fontFamily: FONT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                >
                  <span style={{ color: '#64748B', display: 'flex' }}><link.Icon /></span>
                  <span style={{ flex: 1 }}>{link.label}</span>
                  <span style={{ color: '#CBD5E1', display: 'flex' }}><Icon.ChevronRight /></span>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </AdminLayout>
  )
}
