import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']

const PAYMENT_ICONS: Record<string, React.ReactNode> = {
  card: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="4" width="18" height="12" rx="2" stroke="#1D4ED8" strokeWidth="1.5"/><path d="M1 8h18" stroke="#1D4ED8" strokeWidth="1.5"/><rect x="3" y="11" width="4" height="2" rx="1" fill="#1D4ED8"/></svg>
  ),
  apple_pay: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.5 5.5c-1 .1-2.1.8-2.7 1.6-.6.8-.9 1.8-.8 2.8 1 0 2.1-.7 2.7-1.5.7-.8.9-1.8.8-2.9z" fill="#0F172A"/><path d="M14.6 9.8c-1.5 0-2.1.9-3.1.9s-1.7-.9-3-.9c-1.4 0-2.9.8-3.8 2.1-1.6 2.8-.4 7 1.1 9.3.8 1.1 1.7 2.4 2.9 2.3 1.1 0 1.5-.7 2.9-.7s1.7.7 2.9.7 2-.3 2.9-1.4l-.2-.1c-.7-.5-1.7-1.5-1.7-3.4 0-2.2 1.5-3.1 1.6-3.2C17.4 13.9 16 12 14.6 9.8z" fill="#0F172A"/></svg>
  ),
  google_pay: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><text x="3" y="15" fontFamily="system-ui" fontWeight="700" fontSize="13" fill="#4285F4">G</text></svg>
  ),
  bank_transfer: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 17h16M10 3l8 5H2l8-5z" stroke="#1D4ED8" strokeWidth="1.5" strokeLinejoin="round"/><rect x="4" y="8" width="2" height="7" rx="1" fill="#1D4ED8"/><rect x="9" y="8" width="2" height="7" rx="1" fill="#1D4ED8"/><rect x="14" y="8" width="2" height="7" rx="1" fill="#1D4ED8"/></svg>
  ),
  cash_on_delivery: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="1" y="5" width="18" height="10" rx="2" stroke="#16A34A" strokeWidth="1.5"/><circle cx="10" cy="10" r="2.5" stroke="#16A34A" strokeWidth="1.5"/></svg>
  ),
}

const PAYMENT_METHODS = [
  { id: 'card',             label: 'Credit / Debit Card' },
  { id: 'apple_pay',        label: 'Apple Pay' },
  { id: 'google_pay',       label: 'Google Pay' },
  { id: 'bank_transfer',    label: 'Bank Transfer' },
  { id: 'cash_on_delivery', label: 'Cash on Delivery' },
]

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '12px 16px', border: '1.5px solid #E2E8F0',
  borderRadius: 12, fontSize: 14, fontFamily: "'Poppins', system-ui",
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

      <div className="stor-checkout-layout" style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Main */}
        <div>
          {step === 'delivery' && (
            <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 18, color: '#0F172A', margin: '0 0 20px' }}>Delivery Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="stor-form-2col" style={{ gap: 12 }}>
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
                <div className="stor-form-2col" style={{ gap: 12 }}>
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
                border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700,
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
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
                    border: `2px solid ${payment === m.id ? '#1D4ED8' : '#E2E8F0'}`,
                    cursor: 'pointer', backgroundColor: payment === m.id ? '#EFF6FF' : 'white',
                  }}>
                    <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} style={{ accentColor: '#1D4ED8', width: 16, height: 16 }} />
                    <span style={{ lineHeight: 1, display: 'flex' }}>{PAYMENT_ICONS[m.id]}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>{m.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep('delivery')} style={{ flex: 1, backgroundColor: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep('review')} style={{ flex: 2, backgroundColor: '#1D4ED8', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 700, fontFamily: 'system-ui', cursor: 'pointer' }}>Review Order →</button>
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
                <p style={{ fontSize: 14, color: '#334155', fontFamily: "'Poppins', system-ui", margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex' }}>{PAYMENT_ICONS[payment]}</span>
                  {PAYMENT_METHODS.find(m => m.id === payment)?.label}
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
                <button onClick={() => setStep('payment')} style={{ flex: 1, backgroundColor: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', cursor: 'pointer' }}>← Back</button>
                <button onClick={handlePlaceOrder} disabled={placing} style={{
                  flex: 2, backgroundColor: placing ? '#64748B' : '#1D4ED8', color: 'white', border: 'none',
                  borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, fontFamily: 'system-ui', cursor: placing ? 'not-allowed' : 'pointer',
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
