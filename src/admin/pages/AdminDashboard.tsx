import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Badge, Table } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// ── Pending Approvals inbox (owner/HR/purchasing) ───────────────────────────────
interface ApprovalItem { kind: 'Leave' | 'Advance' | 'Requisition'; id: string; who: string; detail: string; when: string; base: string }
const KIND_COLOR: Record<string, string> = { Leave: '#8B5CF6', Advance: '#F59E0B', Requisition: '#1D4ED8' }
const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

// ── Owner permission toggles (global settings) ──────────────────────────────────
const OWNER_TOGGLES = [
  { key: 'allowEmployeeDiscount', label: 'Allow employees to give discounts', desc: 'Shows a discount field on the walk-in New Sale form for staff. You can always give discounts.' },
  { key: 'walkInGlobalSales',     label: 'Show all walk-in sales to every employee', desc: 'When off, each employee sees only the sales they created. You always see all sales.' },
]
function OwnerToggles() {
  const { user } = useAuth()
  const [values, setValues] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState('')
  useEffect(() => {
    if (!user?.isOwner) return
    api.get<{ settings: Record<string, string> }>('/settings')
      .then(r => setValues(Object.fromEntries(OWNER_TOGGLES.map(t => [t.key, r.settings?.[t.key] === 'true']))))
      .catch(() => setValues(Object.fromEntries(OWNER_TOGGLES.map(t => [t.key, false]))))
  }, [user])
  if (!user?.isOwner || !values) return null
  const toggle = async (key: string) => {
    const next = !values[key]
    setSaving(key); setValues(v => ({ ...v!, [key]: next }))
    try { await api.patch('/settings', { settings: { [key]: String(next) } }) }
    catch { setValues(v => ({ ...v!, [key]: !next })) }
    finally { setSaving('') }
  }
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, fontFamily: FONT }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: DARK }}>Owner Permissions</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OWNER_TOGGLES.map(t => (
          <label key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{t.desc}</div>
            </div>
            <button onClick={() => toggle(t.key)} disabled={saving === t.key} style={{ position: 'relative', width: 46, height: 26, borderRadius: 999, border: 'none', cursor: 'pointer', background: values[t.key] ? '#059669' : '#CBD5E1', transition: 'background .15s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: values[t.key] ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
            </button>
          </label>
        ))}
      </div>
    </div>
  )
}

function PendingApprovals() {
  const { can, user } = useAuth()
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const canApprove = user?.isOwner || can('leave') || can('advances') || can('purchase-requisitions')

  const load = async () => {
    setLoading(true)
    try {
      const [leave, adv, req] = await Promise.all([
        api.get<{ data: any[] }>('/leave?status=pending&pageSize=50').then(r => r.data).catch(() => []),
        api.get<{ data: any[] }>('/advances?status=pending&pageSize=50').then(r => r.data).catch(() => []),
        api.get<{ data: any[] }>('/purchase-requisitions?status=pending_approval&pageSize=50').then(r => r.data).catch(() => []),
      ])
      const rows: ApprovalItem[] = [
        ...leave.map(l => ({ kind: 'Leave' as const, id: l.id, who: l.employee?.name ?? '—', detail: `${l.leaveType} · ${l.days} day(s) · ${String(l.startDate).slice(0, 10)}→${String(l.endDate).slice(0, 10)}`, when: l.createdAt, base: '/leave' })),
        ...adv.map(a => ({ kind: 'Advance' as const, id: a.id, who: a.employee?.name ?? '—', detail: `${money(a.amount)}${a.reason ? ` · ${a.reason}` : ''}`, when: a.createdAt, base: '/advances' })),
        ...req.map(r => ({ kind: 'Requisition' as const, id: r.id, who: r.note ?? `${r._count?.items ?? 0} item(s)`, detail: `Needed by ${r.neededBy ? String(r.neededBy).slice(0, 10) : '—'}`, when: r.createdAt, base: '/purchase-requisitions' })),
      ].sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
      setItems(rows)
    } finally { setLoading(false) }
  }
  useEffect(() => { if (canApprove) load() }, [canApprove])

  if (!canApprove) return null

  const act = async (it: ApprovalItem, action: 'approve' | 'reject') => {
    setBusy(it.id)
    try { await api.post(`${it.base}/${it.id}/${action}`, {}); await load() }
    catch { /* keep list */ }
    finally { setBusy('') }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: DARK, fontFamily: FONT }}>
          Pending Approvals {items.length > 0 && <span style={{ marginLeft: 6, fontSize: 12, background: '#FEF2F2', color: '#DC2626', borderRadius: 999, padding: '2px 9px' }}>{items.length}</span>}
        </h2>
      </div>
      {loading ? <div style={{ padding: 30, color: '#94A3B8', fontFamily: FONT, fontSize: 13 }}>Loading…</div>
        : items.length === 0 ? <div style={{ padding: 30, color: '#94A3B8', fontFamily: FONT, fontSize: 13, textAlign: 'center' }}>Nothing awaiting approval. 🎉</div>
        : (
          <div>
            {items.map(it => (
              <div key={`${it.kind}-${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #F8FAFC', fontFamily: FONT }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: `${KIND_COLOR[it.kind]}18`, color: KIND_COLOR[it.kind], minWidth: 84, textAlign: 'center' }}>{it.kind}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.who}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{it.detail}</div>
                </div>
                <button disabled={busy === it.id} onClick={() => act(it, 'approve')} style={{ border: 'none', background: '#059669', color: '#fff', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{busy === it.id ? '…' : 'Approve'}</button>
                <button disabled={busy === it.id} onClick={() => act(it, 'reject')} style={{ border: '1px solid #FCA5A5', background: '#fff', color: '#DC2626', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Reject</button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

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

const ORDER_COLS = [
  { key: 'id',       label: 'Order ID',  width: 100 },
  { key: 'customer', label: 'Customer' },
  { key: 'product',  label: 'Product' },
  { key: 'status',   label: 'Status',    width: 130 },
  { key: 'date',     label: 'Date',      width: 70 },
]

const statusLabel: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', in_production: 'In Production',
  ready: 'Ready', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded',
}
const statusColor: Record<string, string> = {
  pending: '#F59E0B', confirmed: '#1D4ED8', in_production: '#8B5CF6',
  ready: '#10B981', delivered: '#10B981', cancelled: '#EF4444', refunded: '#EF4444',
}

interface DashboardOrder {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  createdAt: string
  contactName: string | null
  customer: { fullName: string | null; email: string }
  items: { productName: string; quantity: number }[]
}

interface DashboardSummary {
  activeProducts: number
  productsAddedThisMonth: number
  pendingOrders: number
  unpaidPendingOrders: number
  lowStockItems: number
  lowStockThreshold: number
  currentMonthRevenue: number
  previousMonthRevenue: number
  revenueChangePercent: number | null
  recentOrders: DashboardOrder[]
}

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
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.get<DashboardSummary>('/dashboard')
      .then(data => { if (!cancelled) setSummary(data) })
      .catch(() => { if (!cancelled) setError('Dashboard data could not be loaded.') })
    return () => { cancelled = true }
  }, [])

  const month = new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date())
  const revenueSub = summary?.revenueChangePercent == null
    ? (summary?.currentMonthRevenue ? 'No paid revenue last month' : 'No paid orders this month')
    : `${summary.revenueChangePercent >= 0 ? '+' : ''}${summary.revenueChangePercent}% vs last month`
  const stats = [
    { label: 'Active Products', value: summary ? String(summary.activeProducts) : '—', sub: summary ? `${summary.productsAddedThisMonth} added this month` : 'Loading…', color: '#10B981', bg: '#F0FDF4', iconColor: '#10B981', Icon: Icon.Box },
    { label: 'Pending Orders', value: summary ? String(summary.pendingOrders) : '—', sub: summary ? `${summary.unpaidPendingOrders} unpaid` : 'Loading…', color: '#EF4444', bg: '#FEF2F2', iconColor: '#EF4444', Icon: Icon.Clock },
    { label: 'Low Stock Items', value: summary ? String(summary.lowStockItems) : '—', sub: summary ? `At or below ${summary.lowStockThreshold} units` : 'Loading…', color: '#F59E0B', bg: '#FFFBEB', iconColor: '#F59E0B', Icon: Icon.AlertTriangle },
    { label: `Revenue (${month})`, value: summary ? `AED ${summary.currentMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', sub: summary ? revenueSub : 'Loading…', color: '#1D4ED8', bg: '#EFF6FF', iconColor: '#1D4ED8', Icon: Icon.TrendingUp },
  ]
  const orderRows = (summary?.recentOrders ?? []).map(order => {
    const first = order.items[0]
    const product = first
      ? `${first.productName} × ${first.quantity}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}`
      : 'No items'
    return {
      id: order.orderNumber,
      customer: order.contactName ?? order.customer.fullName ?? order.customer.email,
      product,
      status: <Badge label={statusLabel[order.status] ?? order.status} color={statusColor[order.status] ?? '#64748B'} />,
      date: new Date(order.createdAt).toLocaleDateString('en-AE', { month: 'short', day: 'numeric' }),
    }
  })

  return (
    <AdminLayout title="Dashboard">

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontFamily: FONT }}>{error}</div>}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
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

      {/* Owner permission toggles */}
      <OwnerToggles />

      {/* Pending approvals (leave / advances / requisitions) */}
      <PendingApprovals />

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
          <Table columns={ORDER_COLS} rows={orderRows} onRowClick={() => navigate('/admin/orders')} />
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
