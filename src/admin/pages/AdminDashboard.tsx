import { useState } from 'react'
import { Link } from 'react-router-dom'

const STATS = [
  { label: 'Active Products', value: '24', change: '+3 this month', up: true },
  { label: 'Pending Orders', value: '18', change: '4 need attention', up: false },
  { label: 'Low Stock Items', value: '7', change: 'Reorder needed', up: false },
  { label: 'Revenue (Jul)', value: 'AED 48,200', change: '+12% vs last month', up: true },
]

const RECENT_ORDERS = [
  { id: 'ORD-1042', customer: 'Al Noor Trading LLC', product: 'Business Cards × 1000', status: 'In Production', statusColor: '#1D4ED8', date: 'Jul 23' },
  { id: 'ORD-1041', customer: 'Falcon Real Estate', product: 'Letterhead × 500', status: 'Artwork Review', statusColor: '#F59E0B', date: 'Jul 22' },
  { id: 'ORD-1040', customer: 'Gulf Ventures', product: 'Roll-Up Banner × 2', status: 'Delivered', statusColor: '#10B981', date: 'Jul 21' },
  { id: 'ORD-1039', customer: 'Horizon Consulting', product: 'Brochures × 250', status: 'Pending Payment', statusColor: '#EF4444', date: 'Jul 20' },
  { id: 'ORD-1038', customer: 'Dubai Flavours', product: 'Packaging Boxes × 500', status: 'In Production', statusColor: '#1D4ED8', date: 'Jul 19' },
]

const SVG_ICONS = {
  box:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  factory:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V10l6-4v4l6-4v4l6-4v14H2z"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  clipboard:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  users:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  settings: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  dashboard:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  orders:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
}

const QUICK_LINKS = [
  { label: 'Manage Products',  href: '/admin/products',        icon: 'box' },
  { label: 'Suppliers',        href: '/admin/suppliers',       icon: 'factory' },
  { label: 'Inventory',        href: '/admin/stock',           icon: 'chart' },
  { label: 'Purchase Orders',  href: '/admin/purchase-orders', icon: 'clipboard' },
  { label: 'Users & Roles',    href: '/admin/users',           icon: 'users' },
  { label: 'Settings',         href: '/admin/settings',        icon: 'settings' },
]

function Sidebar() {
  const [active, setActive] = useState('dashboard')
  const nav = [
    { id: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
    { id: 'products',     label: 'Products',     icon: 'box' },
    { id: 'orders',       label: 'Orders',       icon: 'orders' },
    { id: 'inventory',    label: 'Inventory',    icon: 'chart' },
    { id: 'procurement',  label: 'Procurement',  icon: 'clipboard' },
    { id: 'suppliers',    label: 'Suppliers',    icon: 'factory' },
    { id: 'users',        label: 'Users',        icon: 'users' },
  ]
  return (
    <div style={{ width: 220, backgroundColor: '#0F172A', minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1E293B' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
            <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
          </svg>
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 16, color: '#F8FAFC' }}>myprintingworld</span>
          <span style={{ fontSize: 9, fontWeight: 700, backgroundColor: '#1D4ED8', color: 'white', borderRadius: 4, padding: '1px 5px', fontFamily: 'system-ui' }}>ADMIN</span>
        </Link>
      </div>
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: active === item.id ? '#1E293B' : 'transparent',
            color: active === item.id ? '#F8FAFC' : '#64748B',
            fontSize: 14, fontFamily: 'system-ui', fontWeight: active === item.id ? 600 : 400,
            marginBottom: 2, textAlign: 'left',
            transition: 'all 0.15s ease',
          }}>
            <span style={{ opacity: 0.9, flexShrink: 0 }}>{SVG_ICONS[item.icon as keyof typeof SVG_ICONS]}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'system-ui' }}>A</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', fontFamily: 'system-ui' }}>Ahmad</div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'system-ui' }}>Super Admin</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'system-ui', margin: 0 }}>Wednesday, 23 July 2026</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ padding: '8px 16px', backgroundColor: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>
              + New Order
            </button>
          </div>
        </div>

        <div style={{ padding: '28px' }}>
          {/* Stats */}
          <div className="stor-admin-stats" style={{ marginBottom: 28 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.up ? '#10B981' : '#F59E0B', fontFamily: 'system-ui', fontWeight: 500 }}>
                  {s.up ? '↑' : '→'} {s.change}
                </div>
              </div>
            ))}
          </div>

          <div className="stor-admin-main-grid" style={{ gap: 20 }}>
            {/* Recent orders */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>Recent Orders</h2>
                <button style={{ fontSize: 12, color: '#1D4ED8', fontFamily: 'system-ui', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View all</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    {['Order', 'Customer', 'Product', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map((o, i) => (
                    <tr key={o.id} style={{ borderTop: '1px solid #F1F5F9', backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1D4ED8', fontFamily: 'system-ui' }}>{o.id}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#0F172A', fontFamily: 'system-ui' }}>{o.customer}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B', fontFamily: 'system-ui' }}>{o.product}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: o.statusColor, backgroundColor: o.statusColor + '15', borderRadius: 20, padding: '3px 10px', fontFamily: 'system-ui' }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick links */}
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 16px' }}>Quick Access</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {QUICK_LINKS.map(l => (
                  <Link key={l.href} to={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8,
                    textDecoration: 'none', color: '#334155',
                    fontSize: 14, fontFamily: 'system-ui', fontWeight: 500,
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F1F5F9'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <span style={{ color: '#1D4ED8' }}>{SVG_ICONS[l.icon as keyof typeof SVG_ICONS]}</span>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
