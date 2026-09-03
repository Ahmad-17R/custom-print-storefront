import React, { useEffect, useState, useCallback } from 'react'
import { api, posVerify } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const BLUE = '#3B82F6'
const GREEN = '#10B981'

interface Product  { id: string; name: string; isActive: boolean; category?: { name: string } }
interface Session  { id: string; openedBy: string; openedAt: string; openingCash: number; register: { id: string; name: string } }

interface CartItem { productId: string; name: string; quantity: number; unitPrice: number; priceStr: string }

const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>
const fmt = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── POS Unlock → Open Session ─────────────────────────────────────────────────
// Operator signs in with their POS password; the counter is their assigned one.
function PosUnlock({ onOpened }: { onOpened: (s: Session) => void }) {
  const { user } = useAuth()
  const [step, setStep]       = useState<'unlock' | 'cash'>('unlock')
  const [posPass, setPosPass] = useState('')
  const [op, setOp]           = useState<{ name: string } | null>(null)
  const [register, setReg]    = useState<{ id: string; name: string } | null>(null)
  const [cashStr, setCashStr] = useState('')
  const [err, setErr]         = useState('')
  const [busy, setBusy]       = useState(false)

  const unlock = async () => {
    if (!posPass) return setErr('Enter your POS password')
    setBusy(true); setErr('')
    try {
      const r = await posVerify(posPass)
      setOp(r.operator); setReg(r.register); setStep('cash')
    } catch (e: any) { setErr(e.message ?? 'Unlock failed') }
    finally { setBusy(false) }
  }

  // No counter assigned → nothing to unlock
  if (user && !user.posRegisterId) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 440, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: DARK }}>No counter assigned</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>Ask the owner to assign you a POS cash counter.</div>
        </div>
      </div>
    )
  }

  const openSession = async () => {
    if (!register || !op) return
    setBusy(true); setErr('')
    try {
      const s = await api.post<Session>('/pos/sessions', { registerId: register.id, openedBy: op.name, openingCash: parseFloat(cashStr) || 0 })
      onOpened(s)
    } catch (e: any) { setErr(e.message ?? 'Error') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 40, width: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🖥️</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: DARK }}>{step === 'unlock' ? `Hi, ${user?.name ?? 'Operator'}` : 'Open Session'}</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {step === 'unlock' ? `Enter your POS password to open ${user?.posRegisterName ?? 'your counter'}` : `${register?.name} · operator ${op?.name}`}
          </div>
        </div>

        {step === 'unlock' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <label>{lbl('POS Password')}<input type="password" value={posPass} onChange={e => setPosPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && unlock()} placeholder="••••••" style={inp} autoFocus /></label>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534' }}>
              Counter <strong>{register?.name}</strong> unlocked for <strong>{op?.name}</strong>.
            </div>
            <label>{lbl('Opening Cash (AED)')}<input type="number" min={0} step="0.01" value={cashStr} onChange={e => setCashStr(e.target.value)} placeholder="0.00" style={inp} autoFocus /></label>
          </div>
        )}

        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button onClick={step === 'unlock' ? unlock : openSession} disabled={busy} style={{ width: '100%', background: BLUE, color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Please wait…' : step === 'unlock' ? 'Unlock Counter' : 'Open Session'}
        </button>
      </div>
    </div>
  )
}

// ── Close Session Modal ───────────────────────────────────────────────────────
function CloseSessionModal({ session, salesTotal, onClosed, onCancel }: { session: Session; salesTotal: number; onClosed: () => void; onCancel: () => void }) {
  const [closingCashStr, setCashStr] = useState('')
  const [note,        setNote]   = useState('')
  const [saving,      setSaving] = useState(false)
  const expected = Number(session.openingCash) + salesTotal
  const counted  = parseFloat(closingCashStr) || 0
  const diff     = counted - expected  // <0 short, >0 over

  const close = async () => {
    setSaving(true)
    try {
      await api.post(`/pos/sessions/${session.id}/close`, { closingCash: counted, note: note || undefined })
      onClosed()
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 420 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700, color: DARK }}>Close Session</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>Count your cash drawer and confirm to close this session.</p>
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#64748B' }}>Opening Cash</span><span style={{ fontWeight: 600 }}>AED {fmt(Number(session.openingCash))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#64748B' }}>Sales (Cash)</span><span style={{ fontWeight: 600, color: GREEN }}>AED {fmt(salesTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 4 }}>
            <span style={{ color: '#64748B' }}>Expected Drawer</span><span style={{ fontWeight: 700, color: DARK }}>AED {fmt(Number(session.openingCash) + salesTotal)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <label>{lbl('Count the drawer — Actual Closing Cash (AED)')}<input type="number" min={0} step="0.01" value={closingCashStr} onChange={e => setCashStr(e.target.value)} placeholder="0.00" style={inp} autoFocus /></label>
          {closingCashStr !== '' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: Math.abs(diff) < 0.005 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${Math.abs(diff) < 0.005 ? '#BBF7D0' : '#FECACA'}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: Math.abs(diff) < 0.005 ? '#166534' : '#B91C1C' }}>
                {Math.abs(diff) < 0.005 ? '✓ Drawer balances' : diff < 0 ? '⚠ Short' : '⚠ Over'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: Math.abs(diff) < 0.005 ? '#166534' : '#B91C1C' }}>
                {diff === 0 ? 'AED 0.00' : `${diff > 0 ? '+' : '−'} AED ${fmt(Math.abs(diff))}`}
              </span>
            </div>
          )}
          <label>{lbl('Note (optional — explain any difference)')}<input value={note} onChange={e => setNote(e.target.value)} style={inp} /></label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', border: '1px solid #E2E8F0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: FONT }}>Cancel</button>
          <button onClick={close} disabled={saving} style={{ flex: 1, padding: '10px 0', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
            {saving ? 'Closing…' : 'Close Session'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 17, color: DARK, marginBottom: 4 }}>Sale Complete</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>{order.orderNumber}</div>

        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
          {order.items.map((i: any) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>{i.productName} × {i.quantity}</span>
              <span>AED {fmt(Number(i.total))}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 8 }}>
            {Number(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                <span>Discount</span><span>- AED {fmt(Number(order.discount))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, color: DARK }}>
              <span>Total</span><span>AED {fmt(Number(order.total))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginTop: 4 }}>
              <span>Paid ({order.paymentMethod})</span><span>AED {fmt(Number(order.paidAmount))}</span>
            </div>
            {Number(order.change) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: GREEN, fontWeight: 600, marginTop: 4 }}>
                <span>Change</span><span>AED {fmt(Number(order.change))}</span>
              </div>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{ width: '100%', background: GREEN, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>
          New Sale
        </button>
      </div>
    </div>
  )
}

// ── Main Terminal ─────────────────────────────────────────────────────────────
export function PosTerminalPage() {
  const [session,     setSession]   = useState<Session | null>(null)
  const [products,    setProducts]  = useState<Product[]>([])
  const [cart,        setCart]      = useState<CartItem[]>([])
  const [search,      setSearch]    = useState('')
  const [catFilter,   setCat]       = useState('')
  const [customerName, setCust]     = useState('')
  const [payMethod,   setPay]       = useState('cash')
  const [paidAmount,  setPaid]      = useState('')
  const [discountStr, setDiscountStr] = useState('')
  const [closing,     setClosing]   = useState(false)
  const [receipt,     setReceipt]   = useState<any>(null)
  const [processing,  setProc]      = useState(false)
  const [sessionOrders, setSOrd]    = useState<any[]>([])
  const [tab,         setTab]       = useState<'sell' | 'orders'>('sell')

  useEffect(() => {
    api.get<{ data: Product[] }>('/products?pageSize=500&isActive=true&include=category').then(r => setProducts(r.data))
  }, [])

  const loadSessionOrders = useCallback(async (sid: string) => {
    const r = await api.get<{ data: any[] }>(`/pos/orders?sessionId=${sid}&pageSize=200`)
    setSOrd(r.data)
  }, [])

  const addToCart = (p: Product) => {
    setCart(prev => {
      const ex = prev.find(c => c.productId === p.id)
      if (ex) return prev.map(c => c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: 0, priceStr: '' }]
    })
  }

  const setQty      = (id: string, qty: number)    => qty <= 0 ? removeItem(id) : setCart(p => p.map(c => c.productId === id ? { ...c, quantity: qty } : c))
  const setPriceStr = (id: string, str: string)   => setCart(p => p.map(c => c.productId === id ? { ...c, priceStr: str, unitPrice: parseFloat(str) || 0 } : c))
  const removeItem = (id: string)              => setCart(p => p.filter(c => c.productId !== id))

  const discount = parseFloat(discountStr) || 0
  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const total    = Math.max(0, subtotal - discount)
  const paid     = parseFloat(paidAmount) || total
  const change   = Math.max(0, paid - total)

  const checkout = async () => {
    if (!session)                          return
    if (!cart.length)                      return
    if (cart.some(i => i.unitPrice <= 0)) return alert('Set a price for all items')
    setProc(true)
    try {
      const order = await api.post<any>('/pos/orders', {
        sessionId: session.id, customerName: customerName || undefined,
        paymentMethod: payMethod, paidAmount: paid, discount,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
      })
      setReceipt(order)
      setCart([]); setDiscountStr(''); setPaid(''); setCust(''); setPay('cash')
      loadSessionOrders(session.id)
    } finally { setProc(false) }
  }

  const categories = [...new Set(products.map(p => p.category?.name ?? ''))].sort()
  const filtered   = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (catFilter ? p.category?.name ?? '' === catFilter : true)
  )

  if (!session) return (
    <PosUnlock onOpened={s => { setSession(s); loadSessionOrders(s.id) }} />
  )

  const cashSales = sessionOrders.filter(o => o.status === 'completed' && o.paymentMethod === 'cash').reduce((s: number, o: any) => s + Number(o.total), 0)

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F1F5F9', fontFamily: FONT, overflow: 'hidden' }}>

      {/* ── Left: Product grid ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header bar */}
        <div style={{ background: DARK, color: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>🖥️ {session.register.name}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>Opened by {session.openedBy}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {['sell', 'orders'].map(t => (
              <button key={t} onClick={() => { setTab(t as any); if (t === 'orders') loadSessionOrders(session.id) }}
                style={{ padding: '5px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT, background: tab === t ? BLUE : 'rgba(255,255,255,0.1)', color: '#fff' }}>
                {t === 'sell' ? 'Sell' : `Orders (${sessionOrders.length})`}
              </button>
            ))}
            <button onClick={() => setClosing(true)} style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #EF4444', background: 'transparent', color: '#FCA5A5', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: FONT }}>
              Close Session
            </button>
          </div>
        </div>

        {tab === 'sell' ? (
          <>
            {/* Search + category filter */}
            <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                style={{ flex: 1, minWidth: 180, padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }} />
              <select value={catFilter} onChange={e => setCat(e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Product grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, alignContent: 'start' }}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = BLUE)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
                >
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{p.category?.name ?? ''}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DARK, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: BLUE, fontWeight: 600 }}>+ Add</div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>No products found</div>
              )}
            </div>
          </>
        ) : (
          /* Orders tab */
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {sessionOrders.length === 0
              ? <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontSize: 13 }}>No orders this session yet</div>
              : sessionOrders.map(o => (
                <div key={o.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 16px', marginBottom: 10, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: DARK }}>{o.orderNumber}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {o._count.items} item{o._count.items !== 1 ? 's' : ''} · {o.paymentMethod} · {new Date(o.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: DARK }}>AED {fmt(Number(o.total))}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: o.status === 'completed' ? '#D1FAE5' : o.status === 'voided' ? '#F1F5F9' : '#FEF2F2',
                      color:      o.status === 'completed' ? '#065F46' : o.status === 'voided' ? '#94A3B8' : '#DC2626' }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* ── Right: Cart + Checkout ────────────────────────────────── */}
      <div style={{ width: 340, background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>

        {/* Cart header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: DARK, marginBottom: 10 }}>Cart {cart.length > 0 && `(${cart.length})`}</div>
          <input value={customerName} onChange={e => setCust(e.target.value)} placeholder="Customer name (optional)"
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {cart.length === 0
            ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#CBD5E1', fontSize: 13 }}>Click a product to add it</div>
            : cart.map(item => (
              <div key={item.productId} style={{ marginBottom: 12, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: DARK }}>{item.name}</span>
                  <button onClick={() => removeItem(item.productId)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>QTY</span>
                    <input type="number" min={1} value={item.quantity} onChange={e => setQty(item.productId, Number(e.target.value))}
                      style={{ padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: FONT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>UNIT PRICE (AED)</span>
                    <input type="number" min={0} step="0.01" value={item.priceStr} onChange={e => setPriceStr(item.productId, e.target.value)}
                      placeholder="0.00"
                      style={{ padding: '5px 8px', border: item.unitPrice <= 0 ? '1px solid #FCA5A5' : '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: FONT, outline: 'none', width: '100%', boxSizing: 'border-box' }} />
                  </label>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'right' }}>
                  Subtotal: <strong>AED {fmt(item.quantity * item.unitPrice)}</strong>
                </div>
              </div>
            ))
          }
        </div>

        {/* Totals + Payment */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9' }}>
          {/* Discount row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>Discount (AED)</span>
            <input type="number" min={0} step="0.01" value={discountStr} onChange={e => setDiscountStr(e.target.value)} placeholder="0.00"
              style={{ flex: 1, minWidth: 0, width: 0, padding: '5px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: FONT, outline: 'none', textAlign: 'right', boxSizing: 'border-box' }} />
          </div>

          {/* Totals */}
          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B', marginBottom: 4 }}>
                <span>Subtotal</span><span>AED {fmt(subtotal)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#EF4444', marginBottom: 4 }}>
                <span>Discount</span><span>− AED {fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: DARK }}>
              <span>Total</span><span>AED {fmt(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['cash', 'card', 'bank_transfer'].map(m => (
              <button key={m} onClick={() => setPay(m)}
                style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `2px solid ${payMethod === m ? BLUE : '#E2E8F0'}`, background: payMethod === m ? '#EFF6FF' : '#fff', color: payMethod === m ? BLUE : '#64748B', fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                {m === 'bank_transfer' ? 'Transfer' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {payMethod === 'cash' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>Amount Received</span>
              <input type="number" min={0} step="0.01" value={paidAmount} onChange={e => setPaid(e.target.value)} placeholder={fmt(total)}
                style={{ flex: 1, padding: '6px 8px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, fontFamily: FONT, outline: 'none', textAlign: 'right' }} />
            </div>
          )}
          {payMethod === 'cash' && paid > total && (
            <div style={{ background: '#D1FAE5', borderRadius: 8, padding: '6px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: '#065F46' }}>
              <span>Change</span><span>AED {fmt(change)}</span>
            </div>
          )}

          <button onClick={checkout} disabled={processing || !cart.length}
            style={{ width: '100%', background: cart.length ? GREEN : '#E2E8F0', color: cart.length ? '#fff' : '#94A3B8', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 15, fontWeight: 700, fontFamily: FONT, cursor: cart.length ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
            {processing ? 'Processing…' : `Charge AED ${fmt(total)}`}
          </button>
        </div>
      </div>

      {closing && (
        <CloseSessionModal session={session} salesTotal={cashSales} onClosed={() => { setSession(null); setCart([]); setClosing(false) }} onCancel={() => setClosing(false)} />
      )}
      {receipt && <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />}
    </div>
  )
}
