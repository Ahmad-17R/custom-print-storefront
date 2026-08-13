import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminCountry } from '../context/AdminCountryContext'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const DARK  = '#0F172A'
const DARK2 = '#1E293B'
const BLUE  = '#1D4ED8'
const font  = "'Poppins', system-ui, sans-serif"

// ── Icons ─────────────────────────────────────────────────────────────────────
const IC: Record<string, React.ReactNode> = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  products:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  orders:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  inventory: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  purchase:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  sales:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  crm:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  pos:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  mfg:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V10l6-4v4l6-4v4l6-4v14H2z"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  hr:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  finance:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  projects:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  system:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  chevron:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  bell:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  user:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  home:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  globe:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  menu:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
}

// ── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'catalog', label: 'Catalog', icon: 'products',
    items: [
      { label: 'Products',    href: '/admin/products' },
      { label: 'Categories',  href: '/admin/categories' },
      { label: 'Brands',      href: '/admin/brands' },
    ],
  },
  {
    id: 'orders', label: 'Orders', icon: 'orders',
    items: [
      { label: 'All Orders',      href: '/admin/orders' },
      { label: 'Quotations',      href: '/admin/quotations' },
      { label: 'Sales Orders',    href: '/admin/sales-orders' },
      { label: 'Sales Invoices',  href: '/admin/sales-invoices' },
      { label: 'Delivery Notes',  href: '/admin/delivery-notes' },
      { label: 'Sales Returns',   href: '/admin/sales-returns' },
      { label: 'Credit Notes',    href: '/admin/credit-notes' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', icon: 'inventory',
    items: [
      { label: 'Stock Levels',    href: '/admin/stock' },
      { label: 'Warehouses',      href: '/admin/warehouses' },
      { label: 'Adjustments',     href: '/admin/stock-adjustments' },
      { label: 'Transfers',       href: '/admin/stock-transfers' },
      { label: 'Lots & Batches',  href: '/admin/lots' },
      { label: 'Serial Numbers',  href: '/admin/serials' },
    ],
  },
  {
    id: 'purchase', label: 'Procurement', icon: 'purchase',
    items: [
      { label: 'Suppliers',         href: '/admin/suppliers' },
      { label: 'Requisitions',      href: '/admin/requisitions' },
      { label: 'RFQs',              href: '/admin/rfqs' },
      { label: 'Purchase Orders',   href: '/admin/purchase-orders' },
      { label: 'Goods Receipts',    href: '/admin/goods-receipts' },
      { label: 'Purchase Returns',  href: '/admin/purchase-returns' },
    ],
  },
  {
    id: 'sales', label: 'Sales & CRM', icon: 'sales',
    items: [
      { label: 'Leads',         href: '/admin/leads' },
      { label: 'Opportunities', href: '/admin/opportunities' },
      { label: 'Price Lists',   href: '/admin/price-lists' },
      { label: 'Promotions',    href: '/admin/promotions' },
      { label: 'Commissions',   href: '/admin/commissions' },
    ],
  },
  {
    id: 'pos', label: 'Point of Sale', icon: 'pos',
    items: [
      { label: 'Registers',   href: '/admin/pos/registers' },
      { label: 'Sessions',    href: '/admin/pos/sessions' },
      { label: 'POS Orders',  href: '/admin/pos/orders' },
    ],
  },
  {
    id: 'mfg', label: 'Manufacturing', icon: 'mfg',
    items: [
      { label: 'Bills of Materials',      href: '/admin/bom' },
      { label: 'Manufacturing Orders',    href: '/admin/manufacturing-orders' },
      { label: 'Carriers & Routes',       href: '/admin/carriers' },
      { label: 'Shipments',               href: '/admin/shipments' },
    ],
  },
  {
    id: 'hr', label: 'HR & Payroll', icon: 'hr',
    items: [
      { label: 'Employees',      href: '/admin/employees' },
      { label: 'Attendance',     href: '/admin/attendance' },
      { label: 'Leave Requests', href: '/admin/leave' },
      { label: 'Payroll Runs',   href: '/admin/payroll' },
      { label: 'Applicants',     href: '/admin/applicants' },
      { label: 'Appraisals',     href: '/admin/appraisals' },
    ],
  },
  {
    id: 'finance', label: 'Finance', icon: 'finance',
    items: [
      { label: 'Chart of Accounts',  href: '/admin/accounts' },
      { label: 'Journal Entries',    href: '/admin/journals' },
      { label: 'Bank Accounts',      href: '/admin/bank-accounts' },
      { label: 'Tax Rates',          href: '/admin/tax-rates' },
      { label: 'Fiscal Periods',     href: '/admin/fiscal-periods' },
      { label: 'Budgets',            href: '/admin/budgets' },
      { label: 'Fixed Assets',       href: '/admin/assets' },
      { label: 'Expense Claims',     href: '/admin/expenses' },
    ],
  },
  {
    id: 'projects', label: 'Projects', icon: 'projects',
    items: [
      { label: 'Projects',  href: '/admin/projects' },
      { label: 'Tasks',     href: '/admin/tasks' },
    ],
  },
  {
    id: 'system', label: 'System', icon: 'system',
    items: [
      { label: 'Users & Roles',     href: '/admin/users' },
      { label: 'Audit Trail',       href: '/admin/audit' },
      { label: 'Webhooks',          href: '/admin/webhooks' },
      { label: 'Email Templates',   href: '/admin/email-templates' },
      { label: 'Notifications',     href: '/admin/notifications' },
      { label: 'Company Settings',  href: '/admin/settings' },
    ],
  },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, setCollapsed, onClose }: { collapsed: boolean; setCollapsed: (v: boolean) => void; onClose?: () => void }) {
  const { pathname } = useLocation()
  const activeGroup = NAV_GROUPS.find(g => g.items.some(i => pathname.startsWith(i.href)))?.id
  const [openGroups, setOpenGroups] = useState<string[]>(activeGroup ? [activeGroup] : ['catalog'])

  const toggle = (id: string) =>
    setOpenGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{
      width: collapsed ? 56 : 240,
      background: DARK,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'width 0.2s ease',
      overflowX: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 0' : '16px 16px', borderBottom: `1px solid ${DARK2}`, display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ flexShrink: 0, cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill={BLUE}/>
            <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
          </svg>
        </div>
        {!collapsed && <span style={{ fontFamily: font, fontWeight: 700, fontSize: 14, color: '#F8FAFC', whiteSpace: 'nowrap' }}>MyPrintingWorld</span>}
      </div>

      {/* Dashboard link */}
      <div style={{ padding: collapsed ? '8px 0' : '8px', borderBottom: `1px solid ${DARK2}` }}>
        <Link to="/admin" style={{ textDecoration: 'none' }} onClick={onClose}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            background: pathname === '/admin' ? DARK2 : 'transparent',
            color: pathname === '/admin' ? '#fff' : '#94A3B8',
          }}>
            {IC.dashboard}
            {!collapsed && <span style={{ fontSize: 13, fontFamily: font }}>Dashboard</span>}
          </div>
        </Link>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '8px 0' : '8px' }}>
        {NAV_GROUPS.map(group => {
          const isOpen = openGroups.includes(group.id)
          const isActive = group.items.some(i => pathname.startsWith(i.href))
          return (
            <div key={group.id} style={{ marginBottom: 2 }}>
              {/* Group header */}
              <div
                onClick={() => !collapsed && toggle(group.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '8px 0' : '8px 10px',
                  justifyContent: collapsed ? 'center' : 'space-between',
                  borderRadius: 8,
                  background: isActive ? DARK2 : 'transparent',
                  color: isActive ? '#fff' : '#94A3B8',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {IC[group.icon]}
                  {!collapsed && <span style={{ fontSize: 13, fontFamily: font, fontWeight: 500 }}>{group.label}</span>}
                </div>
                {!collapsed && (
                  <div style={{ transition: 'transform 0.15s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', opacity: 0.5 }}>
                    {IC.chevron}
                  </div>
                )}
              </div>

              {/* Items */}
              {!collapsed && isOpen && (
                <div style={{ paddingLeft: 12, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.items.map(item => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link key={item.href} to={item.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                        <div style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontFamily: font,
                          color: active ? '#fff' : '#64748B',
                          background: active ? BLUE : 'transparent',
                          borderLeft: active ? 'none' : '2px solid #1E293B',
                          paddingLeft: active ? 10 : 8,
                        }}>
                          {item.label}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom: back to storefront */}
      <div style={{ padding: collapsed ? '12px 0' : '12px 8px', borderTop: `1px solid ${DARK2}` }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '8px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 8,
            color: '#64748B',
            fontSize: 12,
            fontFamily: font,
          }}>
            {IC.home}
            {!collapsed && 'Back to Storefront'}
          </div>
        </Link>
      </div>
    </div>
  )
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function CountrySwitcher() {
  const { country, countries, setCountry } = useAdminCountry()
  const [open, setOpen] = useState(false)
  if (!country) return null
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: '1px solid #E2E8F0', borderRadius: 8, background: '#F8FAFC', cursor: 'pointer', fontFamily: font, fontSize: 12, fontWeight: 600, color: DARK }}>
        <span style={{ display: 'flex', color: '#64748B' }}>{IC.globe}</span>
        {country.name}
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>{IC.chevron}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', minWidth: 180, zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: font, textTransform: 'uppercase', letterSpacing: 1 }}>Switch Country</div>
          {countries.map(c => (
            <button key={c.id} onClick={() => { setCountry(c); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: c.id === country.id ? '#EFF6FF' : '#fff', cursor: 'pointer', fontFamily: font, fontSize: 13, color: c.id === country.id ? BLUE : DARK, fontWeight: c.id === country.id ? 600 : 400, textAlign: 'left' }}>
              <span style={{ fontSize: 13, background: '#F1F5F9', borderRadius: 4, padding: '1px 5px', fontWeight: 700, color: '#64748B' }}>{c.code}</span>
              {c.name}
              {c.id === country.id && <span style={{ marginLeft: 'auto', color: BLUE, fontSize: 10 }}>✓</span>}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #F1F5F9', padding: 8 }}>
            <Link to="/admin/countries" onClick={() => setOpen(false)} style={{ display: 'block', textAlign: 'center', fontSize: 12, color: BLUE, fontFamily: font, textDecoration: 'none', padding: '4px 0' }}>
              Manage countries →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function TopBar({ title, actions, onMenuClick }: { title: string; actions?: React.ReactNode; onMenuClick?: () => void }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  return (
    <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 0 16px', flexShrink: 0, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex', flexShrink: 0 }}>
            {IC.menu}
          </button>
        )}
        <h1 style={{ fontFamily: font, fontWeight: 700, fontSize: isMobile ? 15 : 18, color: DARK, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}>
        {!isMobile && actions}
        <CountrySwitcher />
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
          {IC.bell}
        </button>
        <div
          onClick={() => navigate('/admin')}
          style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
          {IC.user}
        </div>
      </div>
    </div>
  )
}

// ── Layout export ─────────────────────────────────────────────────────────────
export function AdminLayout({ title, actions, children }: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // close mobile drawer on route change
  const location = useLocation()
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC', fontFamily: font }}>
      {/* Mobile overlay backdrop */}
      {isMobile && mobileOpen && (
        <div
          ref={overlayRef}
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 400,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s ease',
        } : {
          position: 'relative',
        }),
        flexShrink: 0,
      }}>
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          setCollapsed={setCollapsed}
          onClose={isMobile ? () => setMobileOpen(false) : undefined}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title={title} actions={actions} onMenuClick={() => setMobileOpen(o => !o)} />
        {/* Mobile actions row */}
        {isMobile && actions && (
          <div style={{ padding: '8px 16px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
        <main style={{ flex: 1, padding: isMobile ? 12 : 24, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

// Inject once — responsive stat grid and table utilities
if (typeof document !== 'undefined' && !document.getElementById('admin-responsive-css')) {
  const s = document.createElement('style')
  s.id = 'admin-responsive-css'
  s.textContent = `
    .admin-stat-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); align-items: stretch; }
    .admin-stat-grid > * { display: flex; flex-direction: column; justify-content: center; }
    .admin-modal-box { width: 480px; max-width: calc(100vw - 32px); box-sizing: border-box; }
    @media (max-width: 480px) { .admin-modal-box { width: 100%; border-radius: 16px 16px 0 0; } }
  `
  document.head.appendChild(s)
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="admin-stat-grid" style={{ marginBottom: 20 }}>{children}</div>
}

export function StatCard({ label, value, sub, color = BLUE }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: DARK, fontFamily: font }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

export function Table({ columns, rows, onRowClick }: {
  columns: { key: string; label: string; width?: number }[]
  rows: Record<string, React.ReactNode>[]
  onRowClick?: (row: Record<string, React.ReactNode>) => void
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {columns.map(c => (
                <th key={c.key} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', width: c.width }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}
                onClick={() => onRowClick?.(row)}
                style={{ borderBottom: '1px solid #F1F5F9', cursor: onRowClick ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = '#F8FAFC' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
                {columns.map(c => (
                  <td key={c.key} style={{ padding: '12px 16px', fontSize: 13, color: DARK, verticalAlign: 'middle' }}>
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Badge({ label, color }: { label: string; color: string }) {
  const bg: Record<string, string> = {
    '#10B981': '#ECFDF5', '#EF4444': '#FEF2F2', '#F59E0B': '#FFFBEB',
    '#1D4ED8': '#EFF6FF', '#64748B': '#F1F5F9', '#8B5CF6': '#F5F3FF',
  }
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg[color] ?? '#F1F5F9', color }}>
      {label}
    </span>
  )
}

export function Btn({ label, onClick, variant = 'primary', icon }: { label: string; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; icon?: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: BLUE,      color: '#fff',    border: 'none' },
    secondary: { background: '#fff',    color: DARK,      border: '1px solid #E2E8F0' },
    danger:    { background: '#EF4444', color: '#fff',    border: 'none' },
  }
  return (
    <button onClick={onClick} style={{ ...styles[variant], padding: '8px 16px', borderRadius: 8, fontSize: 13, fontFamily: font, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}{label}
    </button>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ padding: '8px 12px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: font, outline: 'none', width: 220, color: DARK }}
      />
    </div>
  )
}
