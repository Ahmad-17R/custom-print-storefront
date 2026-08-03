import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

export function CartPage() {
  const { items, removeItem, updateQty, total } = useCart()

  const vat      = Math.round(total * 0.05)
  const grandTotal = total + vat

  if (items.length === 0) {
    return (
      <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 6h3l5 14h12l4-14" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="14" cy="26" r="2" fill="#94A3B8"/>
            <circle cx="22" cy="26" r="2" fill="#94A3B8"/>
          </svg>
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui", margin: 0 }}>Your cart is empty</p>
        <p style={{ fontSize: 14, color: '#64748B', fontFamily: 'system-ui', margin: 0 }}>Add some products to get started</p>
        <Link to="/catalog" style={{ fontSize: 14, color: '#1D4ED8', fontFamily: 'system-ui', textDecoration: 'none', fontWeight: 700, padding: '10px 24px', backgroundColor: '#EFF6FF', borderRadius: 8 }}>
          Browse Products →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 28, color: '#0F172A', margin: '0 0 28px', letterSpacing: '-0.02em' }}>
          Your Cart <span style={{ fontSize: 18, fontWeight: 600, color: '#64748B' }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
        </h1>

        <div className="stor-cart-layout">
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => (
              <div key={item.id} style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Product image */}
                <img src={item.image} alt={item.name}
                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui', margin: '0 0 5px' }}>{item.name}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {item.options.slice(0, 4).map(o => (
                          <span key={o} style={{ fontSize: 11, backgroundColor: '#EFF6FF', color: '#1D4ED8', borderRadius: 4, padding: '2px 7px', fontFamily: 'system-ui', fontWeight: 600 }}>{o}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EF4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#CBD5E1'}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M6 4V2h4v2M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4H5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Qty stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid #E2E8F0', borderRadius: 7, overflow: 'hidden' }}>
                      <button onClick={() => item.qty > 1 ? updateQty(item.id, item.qty - 1) : removeItem(item.id)}
                        style={{ width: 32, height: 32, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 16, color: '#0F172A', fontWeight: 700 }}>−</button>
                      <span style={{ padding: '0 14px', fontSize: 14, fontWeight: 700, fontFamily: 'system-ui', color: '#0F172A' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)}
                        style={{ width: 32, height: 32, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 16, color: '#0F172A', fontWeight: 700 }}>+</button>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>
                      AED {item.unitPrice * item.qty}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <Link to="/catalog" style={{ fontSize: 13, color: '#1D4ED8', fontFamily: 'system-ui', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 0' }}>
              + Add more products
            </Link>
          </div>

          {/* Summary */}
          <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '24px', position: 'sticky', top: 80 }}>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 17, color: '#0F172A', margin: '0 0 20px' }}>Order Summary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'system-ui' }}>
                  <span style={{ color: '#334155' }}>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>AED {item.unitPrice * item.qty}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui' }}>
                <span style={{ color: '#64748B' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>AED {total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui' }}>
                <span style={{ color: '#64748B' }}>VAT (5%)</span>
                <span style={{ fontWeight: 600 }}>AED {vat}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: 'system-ui' }}>
                <span style={{ color: '#64748B' }}>Delivery</span>
                <span style={{ fontWeight: 600, color: '#10B981' }}>Free</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontFamily: "'Poppins', system-ui", fontWeight: 800, color: '#0F172A', marginBottom: 20, paddingTop: 14, borderTop: '1px solid #F1F5F9' }}>
              <span>Total</span>
              <span>AED {grandTotal}</span>
            </div>

            <Link to="/checkout" style={{
              display: 'block', textAlign: 'center',
              backgroundColor: '#1D4ED8', color: 'white',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 15, fontWeight: 700, fontFamily: 'system-ui',
              textDecoration: 'none',
            }}>
              Proceed to Checkout →
            </Link>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {['Visa', 'MC', 'Apple Pay', 'Cash'].map(m => (
                <span key={m} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', fontFamily: 'system-ui', border: '1px solid #E2E8F0', borderRadius: 4, padding: '2px 6px' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
