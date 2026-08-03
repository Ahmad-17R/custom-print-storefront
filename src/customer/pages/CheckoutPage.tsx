import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']

const PAYMENT_METHODS = [
  { id: 'card',             label: 'Credit / Debit Card',  icon: '💳' },
  { id: 'apple_pay',        label: 'Apple Pay',            icon: '🍎' },
  { id: 'google_pay',       label: 'Google Pay',           icon: 'G' },
  { id: 'bank_transfer',    label: 'Bank Transfer',        icon: '🏦' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery',     icon: '💵' },
]

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '11px 14px', border: '1.5px solid #E2E8F0',
  borderRadius: 8, fontSize: 14, fontFamily: 'system-ui',
  color: '#0F172A', outline: 'none', backgroundColor: 'white',
}

const STEPS = [
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment',  label: 'Payment' },
  { id: 'review',   label: 'Review' },
]

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total: subtotal, clearCart } = useCart()
  const [step, setStep] = useState<'delivery' | 'payment' | 'review'>('delivery')
  const [placing, setPlacing] = useState(false)

  const [address, setAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', emirate: 'Dubai', notes: '',
  })
  const [payment, setPayment] = useState('card')

  const vat   = Math.round(subtotal * 0.05)
  const total = subtotal + vat

  const handlePlaceOrder = async () => {
    setPlacing(true)
    await new Promise(r => setTimeout(r, 1200))
    clearCart()
    const orderNum = `MPW-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`
    navigate(`/orders/${orderNum}/confirmation`)
  }

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const deliveryValid = address.fullName && address.phone && address.line1 && address.city

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
            <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
          </svg>
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 16, color: '#0F172A' }}>myprintingworld</span>
        </Link>
        <Link to="/cart" style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', textDecoration: 'none' }}>← Back to cart</Link>
      </div>

      {/* Progress */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '16px 24px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: i <= stepIdx ? '#1D4ED8' : '#E2E8F0',
                  fontSize: 12, fontWeight: 700, color: i <= stepIdx ? 'white' : '#94A3B8', fontFamily: 'system-ui',
                }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: i === stepIdx ? 700 : 400, color: i <= stepIdx ? '#0F172A' : '#94A3B8', fontFamily: 'system-ui' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 48, height: 1, backgroundColor: i < stepIdx ? '#1D4ED8' : '#E2E8F0', margin: '0 12px' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Main */}
        <div>
          {step === 'delivery' && (
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 18, color: '#0F172A', margin: '0 0 20px' }}>Delivery Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Full Name *</label>
                    <input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Phone *</label>
                    <input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="+971 50 000 0000" style={inp} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Address Line 1 *</label>
                  <input value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} placeholder="Building name, floor, apartment" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Address Line 2</label>
                  <input value={address.line2} onChange={e => setAddress(p => ({ ...p, line2: e.target.value }))} placeholder="Street, area (optional)" style={inp} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>City *</label>
                    <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Dubai Marina" style={inp} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Emirate *</label>
                    <select value={address.emirate} onChange={e => setAddress(p => ({ ...p, emirate: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                      {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1E293B', fontFamily: 'system-ui', marginBottom: 5 }}>Delivery Notes</label>
                  <textarea value={address.notes} onChange={e => setAddress(p => ({ ...p, notes: e.target.value }))} placeholder="Gate code, special instructions…" rows={2} style={{ ...inp, resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={() => setStep('payment')} disabled={!deliveryValid} style={{
                marginTop: 20, width: '100%', backgroundColor: '#1D4ED8', color: 'white',
                border: 'none', borderRadius: 8, padding: '13px', fontSize: 14, fontWeight: 700,
                fontFamily: 'system-ui', cursor: deliveryValid ? 'pointer' : 'not-allowed', opacity: deliveryValid ? 1 : 0.5,
              }}>
                Continue to Payment →
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 18, color: '#0F172A', margin: '0 0 20px' }}>Payment Method</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PAYMENT_METHODS.map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 10,
                    border: `2px solid ${payment === m.id ? '#1D4ED8' : '#E2E8F0'}`,
                    cursor: 'pointer', backgroundColor: payment === m.id ? '#EFF6FF' : 'white',
                  }}>
                    <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} style={{ accentColor: '#1D4ED8', width: 16, height: 16 }} />
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{m.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'system-ui' }}>{m.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('delivery')} style={{ flex: 1, backgroundColor: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('review')} style={{ flex: 2, backgroundColor: '#1D4ED8', color: 'white', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, fontFamily: 'system-ui', cursor: 'pointer' }}>Review Order →</button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>Delivery To</h2>
                  <button onClick={() => setStep('delivery')} style={{ fontSize: 12, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 600 }}>Edit</button>
                </div>
                <p style={{ fontSize: 14, color: '#334155', fontFamily: 'system-ui', lineHeight: 1.7, margin: '10px 0 0' }}>
                  {address.fullName} · {address.phone}<br/>
                  {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br/>
                  {address.city}, {address.emirate}, UAE
                </p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: 0 }}>Payment</h2>
                  <button onClick={() => setStep('payment')} style={{ fontSize: 12, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', fontWeight: 600 }}>Edit</button>
                </div>
                <p style={{ fontSize: 14, color: '#334155', fontFamily: 'system-ui', margin: '10px 0 0' }}>
                  {PAYMENT_METHODS.find(m => m.id === payment)?.icon} {PAYMENT_METHODS.find(m => m.id === payment)?.label}
                </p>
              </div>
              <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px' }}>
                <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 14px' }}>Items</h2>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: 'system-ui' }}>{item.name} × {item.qty}</div>
                      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', marginTop: 2 }}>{item.options.slice(0,3).join(' · ')}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>AED {item.unitPrice * item.qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('payment')} style={{ flex: 1, backgroundColor: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>← Back</button>
                <button onClick={handlePlaceOrder} disabled={placing} style={{
                  flex: 2, backgroundColor: placing ? '#64748B' : '#1D4ED8', color: 'white', border: 'none',
                  borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700, fontFamily: 'system-ui', cursor: placing ? 'not-allowed' : 'pointer',
                }}>
                  {placing ? 'Placing order…' : `Place Order · AED ${total}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '20px', position: 'sticky', top: 24 }}>
          <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', margin: '0 0 16px' }}>Order Summary</h3>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'system-ui', marginBottom: 10 }}>
              <span style={{ color: '#334155' }}>{item.name} × {item.qty}</span>
              <span style={{ fontWeight: 600, color: '#0F172A' }}>AED {item.unitPrice * item.qty}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 12, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'system-ui' }}>
              <span style={{ color: '#64748B' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>AED {subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'system-ui' }}>
              <span style={{ color: '#64748B' }}>VAT (5%)</span>
              <span style={{ fontWeight: 600 }}>AED {vat}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontFamily: 'system-ui' }}>
              <span style={{ color: '#64748B' }}>Delivery</span>
              <span style={{ fontWeight: 600, color: '#10B981' }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontFamily: "'Poppins', system-ui", fontWeight: 800, color: '#0F172A', marginTop: 6, paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
              <span>Total</span>
              <span>AED {total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
