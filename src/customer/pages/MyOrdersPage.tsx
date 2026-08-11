import { useState } from 'react'
import { Link } from 'react-router-dom'

type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled'

interface Order {
  id: string
  orderNumber: string
  date: string
  status: OrderStatus
  items: string[]
  total: number
}

const MOCK_ORDERS: Order[] = [
  { id: '1', orderNumber: 'MPW-20260803-4821', date: '3 Aug 2026', status: 'confirmed',     items: ['Business Cards', 'Letterhead'], total: 362 },
  { id: '2', orderNumber: 'MPW-20260729-3314', date: '29 Jul 2026', status: 'in_production', items: ['Flyers (A5)'],                   total: 149 },
  { id: '3', orderNumber: 'MPW-20260720-1192', date: '20 Jul 2026', status: 'delivered',     items: ['Brochures', 'Envelopes'],         total: 528 },
  { id: '4', orderNumber: 'MPW-20260715-0871', date: '15 Jul 2026', status: 'delivered',     items: ['Business Cards'],                total: 87  },
  { id: '5', orderNumber: 'MPW-20260710-0543', date: '10 Jul 2026', status: 'cancelled',     items: ['Posters (A3)'],                  total: 220 },
]

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  pending:       { label: 'Pending',       bg: '#FEF9C3', color: '#CA8A04' },
  confirmed:     { label: 'Confirmed',     bg: '#DBEAFE', color: '#1D4ED8' },
  in_production: { label: 'In Production', bg: '#F0FDF4', color: '#16A34A' },
  ready:         { label: 'Ready',         bg: '#F0FDF4', color: '#15803D' },
  delivered:     { label: 'Delivered',     bg: '#F0FDF4', color: '#166534' },
  cancelled:     { label: 'Cancelled',     bg: '#FEF2F2', color: '#DC2626' },
}

const FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all',         label: 'All Orders' },
  { id: 'active',      label: 'Active' },
  { id: 'delivered',   label: 'Delivered' },
  { id: 'cancelled',   label: 'Cancelled' },
]

const ACTIVE_STATUSES = new Set<OrderStatus>(['pending', 'confirmed', 'in_production', 'ready'])

export function MyOrdersPage() {
  const [filter, setFilter] = useState('all')

  const filtered = MOCK_ORDERS.filter(o => {
    if (filter === 'active')    return ACTIVE_STATUSES.has(o.status)
    if (filter === 'delivered') return o.status === 'delivered'
    if (filter === 'cancelled') return o.status === 'cancelled'
    return true
  })

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="stor-orders-wrap" style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 26, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>My Orders</h1>
          <Link to="/catalog" style={{ fontSize: 13, color: '#1D4ED8', fontFamily: "'Poppins', system-ui", textDecoration: 'none', fontWeight: 700, backgroundColor: '#EFF6FF', padding: '8px 16px', borderRadius: 12, border: '1px solid #BFDBFE' }}>+ New Order</Link>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, backgroundColor: 'white', padding: '6px', borderRadius: 10, border: '1px solid #E2E8F0', width: 'fit-content' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'system-ui',
              backgroundColor: filter === f.id ? '#1D4ED8' : 'transparent',
              color: filter === f.id ? 'white' : '#64748B',
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontFamily: 'system-ui' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 12, opacity: 0.4 }}>
              <rect x="8" y="4" width="32" height="40" rx="4" stroke="#64748B" strokeWidth="2.5"/>
              <path d="M16 16h16M16 24h16M16 32h10" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748B' }}>No orders found</p>
            <Link to="/catalog" style={{ fontSize: 13, color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>Browse products →</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => {
            const meta = STATUS_META[order.status]
            return (
              <div key={order.id} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>{order.orderNumber}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'system-ui', borderRadius: 20, padding: '3px 10px', backgroundColor: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', marginBottom: 8 }}>{order.date}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {order.items.map(item => (
                        <span key={item} style={{ fontSize: 12, color: '#334155', backgroundColor: '#F1F5F9', borderRadius: 5, padding: '3px 8px', fontFamily: 'system-ui' }}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui", marginBottom: 10 }}>AED {order.total}</div>
                    <Link to={`/orders/${order.orderNumber}`} style={{
                      fontSize: 12, fontWeight: 600, color: '#1D4ED8', fontFamily: 'system-ui',
                      textDecoration: 'none', border: '1.5px solid #BFDBFE', borderRadius: 12,
                      padding: '5px 12px', backgroundColor: '#EFF6FF',
                    }}>
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Progress bar for active orders */}
                {ACTIVE_STATUSES.has(order.status) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
                    <div style={{ display: 'flex', gap: 0 }}>
                      {(['pending', 'confirmed', 'in_production', 'ready', 'delivered'] as OrderStatus[]).map((s, i) => {
                        const statuses: OrderStatus[] = ['pending', 'confirmed', 'in_production', 'ready', 'delivered']
                        const currentIdx = statuses.indexOf(order.status)
                        const isActive   = i <= currentIdx
                        return (
                          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: '100%', height: 4, backgroundColor: isActive ? '#1D4ED8' : '#E2E8F0', borderRadius: i === 0 ? '4px 0 0 4px' : i === 4 ? '0 4px 4px 0' : 0 }} />
                            <span style={{ fontSize: 9, fontFamily: 'system-ui', color: isActive ? '#1D4ED8' : '#CBD5E1', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                              {s === 'in_production' ? 'Production' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
