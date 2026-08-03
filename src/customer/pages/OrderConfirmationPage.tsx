import { Link, useParams } from 'react-router-dom'

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const orderNumber = id ?? 'MPW-20260803-4821'

  return (
    <div className="stor-confirmation-wrap" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        {/* Success icon */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M8 18l7 7 13-13" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 28, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', fontFamily: 'system-ui', margin: '0 0 28px', lineHeight: 1.6 }}>
          Thank you for your order. We've received it and will begin production soon.
        </p>

        {/* Order number pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10, padding: '12px 20px', marginBottom: 32 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="1" width="12" height="14" rx="2" stroke="#1D4ED8" strokeWidth="1.5"/>
            <path d="M5 5h6M5 8h6M5 11h4" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#1D4ED8' }}>{orderNumber}</span>
        </div>

        {/* Summary card */}
        <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '24px', textAlign: 'left', marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 11, color: '#64748B', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order Details</h3>
          {[
            { label: 'Business Cards', desc: '500 cards · Soft Touch Lamination', price: 'AED 87' },
            { label: 'Letterhead × 2', desc: '250 sheets · 120 GSM Premium', price: 'AED 258' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'system-ui' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui', marginTop: 2 }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>{item.price}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, marginTop: 4 }}>
            <div style={{ fontSize: 13, fontFamily: 'system-ui', color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span>Subtotal: AED 345</span>
              <span>VAT (5%): AED 17</span>
              <span style={{ color: '#10B981' }}>Delivery: Free</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'system-ui', marginBottom: 2 }}>TOTAL</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>AED 362</div>
            </div>
          </div>
        </div>

        {/* Status timeline */}
        <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '20px 24px', textAlign: 'left', marginBottom: 28 }}>
          <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 11, color: '#64748B', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>What Happens Next</h3>
          {[
            { icon: '✅', label: 'Order Confirmed', done: true },
            { icon: '🖨️', label: 'In Production', done: false },
            { icon: '📦', label: 'Ready for Pickup / Delivery', done: false },
            { icon: '🚚', label: 'Delivered', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <span style={{ fontSize: 18, opacity: s.done ? 1 : 0.4 }}>{s.icon}</span>
              <span style={{ fontSize: 14, fontFamily: 'system-ui', color: s.done ? '#0F172A' : '#94A3B8', fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
              {s.done && <span style={{ fontSize: 11, backgroundColor: '#DCFCE7', color: '#16A34A', borderRadius: 20, padding: '2px 8px', fontFamily: 'system-ui', fontWeight: 600, marginLeft: 'auto' }}>Done</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/orders" style={{
            padding: '12px 24px', borderRadius: 8, border: '1.5px solid #E2E8F0',
            fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', color: '#334155', textDecoration: 'none',
          }}>
            View My Orders
          </Link>
          <Link to="/catalog" style={{
            padding: '12px 24px', borderRadius: 8, backgroundColor: '#1D4ED8',
            fontSize: 14, fontWeight: 700, fontFamily: 'system-ui', color: 'white', textDecoration: 'none',
          }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
