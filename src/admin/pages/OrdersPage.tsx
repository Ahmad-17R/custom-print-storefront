import { useState } from 'react'

type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'

interface Order {
  id: string
  orderNumber: string
  customer: string
  date: string
  status: OrderStatus
  items: string[]
  total: number
  paymentMethod: string
}

const MOCK_ORDERS: Order[] = [
  { id: '1', orderNumber: 'MPW-20260803-4821', customer: 'Ahmad Hassan',      date: '3 Aug 2026',  status: 'confirmed',     items: ['Business Cards', 'Letterhead'], total: 362, paymentMethod: 'Card' },
  { id: '2', orderNumber: 'MPW-20260803-4820', customer: 'Sara Al Mansoori',  date: '3 Aug 2026',  status: 'pending',       items: ['Flyers (A5)'],                   total: 149, paymentMethod: 'Apple Pay' },
  { id: '3', orderNumber: 'MPW-20260802-4799', customer: 'James O\'Brien',    date: '2 Aug 2026',  status: 'in_production', items: ['Brochures', 'Envelopes'],         total: 528, paymentMethod: 'Bank Transfer' },
  { id: '4', orderNumber: 'MPW-20260801-4711', customer: 'Fatima Al Rashidi', date: '1 Aug 2026',  status: 'ready',         items: ['Business Cards'],                total: 87,  paymentMethod: 'Card' },
  { id: '5', orderNumber: 'MPW-20260730-4620', customer: 'Mohammed Khalil',   date: '30 Jul 2026', status: 'delivered',     items: ['Posters (A3)', 'Banners'],       total: 740, paymentMethod: 'Card' },
  { id: '6', orderNumber: 'MPW-20260729-4555', customer: 'Priya Nair',        date: '29 Jul 2026', status: 'cancelled',     items: ['Notebooks'],                     total: 320, paymentMethod: 'Card' },
]

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  pending:       { label: 'Pending',       bg: '#FEF9C3', color: '#CA8A04' },
  confirmed:     { label: 'Confirmed',     bg: '#DBEAFE', color: '#1D4ED8' },
  in_production: { label: 'In Production', bg: '#F0FDF4', color: '#16A34A' },
  ready:         { label: 'Ready',         bg: '#ECFDF5', color: '#059669' },
  delivered:     { label: 'Delivered',     bg: '#F0FDF4', color: '#166534' },
  cancelled:     { label: 'Cancelled',     bg: '#FEF2F2', color: '#DC2626' },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending:       'confirmed',
  confirmed:     'in_production',
  in_production: 'ready',
  ready:         'delivered',
}

const STATUS_TRANSITIONS: Record<OrderStatus, string> = {
  pending:       'Confirm Order',
  confirmed:     'Start Production',
  in_production: 'Mark Ready',
  ready:         'Mark Delivered',
  delivered:     '',
  cancelled:     '',
}

export function OrdersPage() {
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')

  const selected = orders.find(o => o.id === selectedId) ?? null

  const advance = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o
      const next = NEXT_STATUS[o.status]
      return next ? { ...o, status: next } : o
    }))
  }
  const cancel = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
    if (selectedId === id) setSelectedId(null)
  }

  const filtered = orders.filter(o => filterStatus === 'all' || o.status === filterStatus)

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'system-ui' }}>
      {/* Sidebar */}
      <div style={{ width: 220, backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
              <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
              <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
              <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
            </svg>
            <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 14, color: 'white' }}>Admin Panel</span>
          </div>
        </div>
        {[
          { label: 'Dashboard',  icon: '📊', href: '/admin' },
          { label: 'Orders',     icon: '📋', href: '/admin/orders', active: true },
          { label: 'Products',   icon: '🖨️', href: '/admin/products' },
          { label: 'Customers',  icon: '👥', href: '/admin/customers' },
          { label: 'Inventory',  icon: '📦', href: '/admin/stock' },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', textDecoration: 'none',
            backgroundColor: item.active ? '#1E293B' : 'transparent', color: item.active ? 'white' : '#94A3B8',
            fontSize: 13, fontWeight: item.active ? 600 : 400,
            borderLeft: item.active ? '3px solid #1D4ED8' : '3px solid transparent',
          }}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Orders list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 22, color: '#0F172A', margin: 0 }}>Orders</h1>
            <span style={{ fontSize: 13, color: '#64748B' }}>{orders.length} total orders</span>
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {(['all', 'pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '5px 12px', borderRadius: 20, border: '1.5px solid',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                borderColor: filterStatus === s ? '#1D4ED8' : '#E2E8F0',
                backgroundColor: filterStatus === s ? '#EFF6FF' : 'white',
                color: filterStatus === s ? '#1D4ED8' : '#64748B',
              }}>
                {s === 'all' ? 'All' : STATUS_META[s as OrderStatus].label}
                {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, i) => {
                  const meta = STATUS_META[order.status]
                  const isSelected = selectedId === order.id
                  return (
                    <tr key={order.id} onClick={() => setSelectedId(isSelected ? null : order.id)} style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                      backgroundColor: isSelected ? '#EFF6FF' : 'white',
                      cursor: 'pointer',
                    }}>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#1D4ED8', fontFamily: "'Poppins', system-ui", whiteSpace: 'nowrap' }}>{order.orderNumber}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{order.customer}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>{order.date}</td>
                      <td style={{ padding: '14px 16px', fontSize: 12, color: '#334155' }}>{order.items.join(', ')}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>AED {order.total}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 10px', backgroundColor: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#94A3B8', transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 320, backgroundColor: 'white', borderLeft: '1px solid #E2E8F0', overflow: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{selected.orderNumber}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{selected.date}</div>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, padding: 0 }}>×</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Status</div>
              <span style={{ fontSize: 13, fontWeight: 700, borderRadius: 20, padding: '4px 12px', backgroundColor: STATUS_META[selected.status].bg, color: STATUS_META[selected.status].color }}>
                {STATUS_META[selected.status].label}
              </span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Customer</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selected.customer}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Items</div>
              {selected.items.map(item => (
                <div key={item} style={{ fontSize: 13, color: '#334155', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>{item}</div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Payment</div>
              <div style={{ fontSize: 13, color: '#334155' }}>{selected.paymentMethod}</div>
            </div>

            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, fontFamily: "'Poppins', system-ui", color: '#0F172A' }}>
                <span>Total</span>
                <span>AED {selected.total}</span>
              </div>
            </div>

            {/* Action buttons */}
            {NEXT_STATUS[selected.status] && (
              <button onClick={() => advance(selected.id)} style={{
                width: '100%', backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 10,
              }}>
                {STATUS_TRANSITIONS[selected.status]}
              </button>
            )}
            {selected.status !== 'cancelled' && selected.status !== 'delivered' && (
              <button onClick={() => cancel(selected.id)} style={{
                width: '100%', backgroundColor: 'white', color: '#DC2626', border: '1.5px solid #FECACA',
                borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Cancel Order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
