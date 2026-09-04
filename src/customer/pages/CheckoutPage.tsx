import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart, type CartItem } from '../../context/CartContext'
import { createCustomerOrder, fetchCatalogProduct, uploadCustomerFile, type CatalogProduct } from '../../lib/api'
import {
  configuredPrice, initialSelections, mapCatalogFields, missingRequiredFields,
  optionDisplayLabel, type ConfigField, type ConfigSelection, type ConfigSelections,
} from '../lib/productConfigurator'

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah']
const STEPS = [
  { id: 'details', label: 'Product Details' }, { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' }, { id: 'review', label: 'Review' },
] as const
type Step = typeof STEPS[number]['id']
interface UploadedFile { token: string; originalName: string; mimeType: string; size: number }
interface CheckoutLine {
  cart: CartItem; product: CatalogProduct; fields: ConfigField[]; selections: ConfigSelections
  fieldUploads: Record<string, UploadedFile>; artwork: UploadedFile[]
}

const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontFamily: 'system-ui', color: '#0F172A', outline: 'none', background: '#fff' }
const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }
const asValues = (value: ConfigSelection | undefined) => Array.isArray(value) ? value : value ? [value] : []

function DialogFrame({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div role="dialog" aria-modal="true" aria-label="Checkout" className="storefront-order-flow" style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15, 23, 42, .68)', padding: 18, display: 'grid', placeItems: 'center' }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div style={{ width: 'min(1080px, 100%)', maxHeight: 'calc(100vh - 36px)', overflow: 'auto', background: '#F8FAFC', borderRadius: 18, boxShadow: '0 30px 90px rgba(15, 23, 42, .35)', position: 'relative' }}>
      {children}
    </div>
  </div>
}

function CheckoutField({ field, value, onChange, onUpload, uploading }: {
  field: ConfigField; value: ConfigSelection | undefined; onChange: (value: ConfigSelection) => void
  onUpload: (file: File) => void; uploading: boolean
}) {
  const selected = asValues(value)
  let control
  if (field.type === 'dropdown') {
    control = <select value={selected[0] ?? ''} onChange={event => onChange(event.target.value)} style={inputStyle}>
      <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}…`}</option>
      {field.options.map(option => <option key={option.id} value={option.value}>{optionDisplayLabel(option)}</option>)}
    </select>
  } else if (field.type === 'radio') {
    control = <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{field.options.map(option => {
      const active = selected[0] === option.value
      return <button type="button" key={option.id} onClick={() => onChange(option.value)} style={{ padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${active ? '#1D4ED8' : '#E2E8F0'}`, background: active ? '#EFF6FF' : '#fff', color: active ? '#1D4ED8' : '#475569', cursor: 'pointer', fontWeight: active ? 700 : 500 }}>{optionDisplayLabel(option)}</button>
    })}</div>
  } else if (field.type === 'checkbox') {
    const options = field.options.length ? field.options : [{ id: `${field.id}:yes`, label: 'Yes', value: 'yes', priceModifier: 0, isDefault: false }]
    control = <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{options.map(option => {
      const checked = selected.includes(option.value)
      return <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer' }}><input type="checkbox" checked={checked} onChange={() => onChange(checked ? selected.filter(item => item !== option.value) : [...selected, option.value])} />{optionDisplayLabel(option)}</label>
    })}</div>
  } else if (field.type === 'textarea') {
    control = <textarea rows={3} value={selected[0] ?? ''} onChange={event => onChange(event.target.value)} placeholder={field.placeholder} style={{ ...inputStyle, resize: 'vertical' }} />
  } else if (field.type === 'file_upload') {
    control = <label style={{ display: 'block', border: '1.5px dashed #94A3B8', borderRadius: 10, padding: 14, cursor: uploading ? 'wait' : 'pointer', color: '#475569', background: '#F8FAFC' }}>{uploading ? 'Uploading…' : selected[0] ? `Uploaded: ${selected[0]}` : 'Choose file (PDF, image, AI, EPS or ZIP)'}<input type="file" hidden disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.ai,.eps,.zip" onChange={event => { const file = event.target.files?.[0]; if (file) onUpload(file); event.target.value = '' }} /></label>
  } else {
    control = <input type={field.type === 'number' ? 'number' : field.type === 'color_picker' ? 'color' : 'text'} value={selected[0] ?? ''} onChange={event => onChange(event.target.value)} placeholder={field.placeholder} style={inputStyle} />
  }
  return <div><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 7 }}>{field.label}{field.isRequired && <span style={{ color: '#DC2626' }}> *</span>}</label>{control}{field.helpText && <div style={{ fontSize: 12, color: '#64748B', marginTop: 5 }}>{field.helpText}</div>}</div>
}

export function CheckoutDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { session, user, loading: authLoading } = useAuth()
  const { items, clearCart } = useCart()
  const [lines, setLines] = useState<CheckoutLine[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('details')
  const [placing, setPlacing] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')
  const [error, setError] = useState('')
  const retryKey = useRef(crypto.randomUUID())
  const [saveAddress, setSaveAddress] = useState(true)
  const [address, setAddress] = useState({ fullName: String(user?.user_metadata?.full_name ?? ''), phone: '', line1: '', line2: '', city: '', emirate: 'Dubai', notes: '' })
  const [payment, setPayment] = useState<'bank_transfer' | 'cash_on_delivery'>('cash_on_delivery')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !placing) onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape) }
  }, [onClose, placing])

  useEffect(() => {
    if (!items.length) { setLoading(false); return }
    let cancelled = false
    Promise.all(items.map(async cart => {
      const product = await fetchCatalogProduct(cart.slug)
      const selectedIds = new Set((cart.selections ?? []).map(selection => selection.fieldId))
      const fields = mapCatalogFields(product).filter(field => field.askAtCheckout || field.isRequired && !selectedIds.has(field.id))
      return { cart: { ...cart, productId: product.id }, product, fields, selections: initialSelections(fields), fieldUploads: {}, artwork: [] } satisfies CheckoutLine
    })).then(result => { if (!cancelled) setLines(result) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load checkout products') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [items])

  useEffect(() => {
    if (user?.user_metadata?.full_name) setAddress(previous => ({ ...previous, fullName: previous.fullName || String(user.user_metadata.full_name) }))
  }, [user])

  const estimatedTotal = useMemo(() => lines.reduce((sum, line) => {
    const productSelections = Object.fromEntries((line.cart.selections ?? []).map(selection => [selection.fieldId, selection.value]))
    return sum + configuredPrice(Number(line.product.basePrice), mapCatalogFields(line.product), { ...productSelections, ...line.selections }) * line.cart.qty
  }, 0), [lines])
  const vat = Math.round((estimatedTotal * 5 / 105) * 100) / 100
  const net = Math.round((estimatedTotal - vat) * 100) / 100
  const stepIndex = STEPS.findIndex(candidate => candidate.id === step)

  const patchLine = (lineId: string, patch: Partial<CheckoutLine>) => setLines(previous => previous.map(line => line.cart.id === lineId ? { ...line, ...patch } : line))
  const setSelection = (line: CheckoutLine, fieldId: string, value: ConfigSelection) => patchLine(line.cart.id, { selections: { ...line.selections, [fieldId]: value } })
  const upload = async (line: CheckoutLine, file: File, field?: ConfigField) => {
    if (!session?.access_token) return
    const key = `${line.cart.id}:${field?.id ?? 'artwork'}`
    setUploadingKey(key); setError('')
    try {
      const result = await uploadCustomerFile(file, session.access_token)
      if (field) patchLine(line.cart.id, { selections: { ...line.selections, [field.id]: result.originalName }, fieldUploads: { ...line.fieldUploads, [field.id]: result } })
      else patchLine(line.cart.id, { artwork: [...line.artwork, result] })
    } catch (err) { setError(err instanceof Error ? err.message : 'Upload failed') }
    finally { setUploadingKey('') }
  }
  const validateDetails = () => {
    for (const line of lines) {
      const missing = missingRequiredFields(line.fields, line.selections)
      if (missing.length) { setError(`${line.product.name}: complete ${missing.map(field => field.label).join(', ')}`); return false }
      for (const field of line.fields.filter(candidate => candidate.type === 'file_upload' && candidate.isRequired)) {
        if (!line.fieldUploads[field.id]) { setError(`${line.product.name}: upload ${field.label}`); return false }
      }
      if (line.artwork.length === 0) { setError(`${line.product.name}: upload at least one artwork/design file`); return false }
    }
    setError(''); return true
  }
  const placeOrder = async () => {
    if (!session?.access_token || !validateDetails()) return
    setPlacing(true); setError('')
    try {
      const order = await createCustomerOrder({
        idempotencyKey: retryKey.current, paymentMethod: payment, saveAddress,
        delivery: { ...address, country: 'UAE' },
        items: lines.map(line => ({
          productId: line.product.id, quantity: line.cart.qty, note: line.cart.note,
          selections: [
            ...(line.cart.selections ?? []),
            ...line.fields.flatMap(field => {
              const value = line.selections[field.id]
              if (Array.isArray(value) ? value.length === 0 : !value) return []
              return [{ fieldId: field.id, value, ...(line.fieldUploads[field.id] ? { attachmentToken: line.fieldUploads[field.id].token } : {}) }]
            }),
          ],
          attachments: line.artwork.map(file => ({ token: file.token, kind: 'artwork' })),
        })),
      }, session.access_token)
      clearCart(); navigate(`/orders/${order.id}/confirmation`, { replace: true })
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not place order') }
    finally { setPlacing(false) }
  }

  if (authLoading || loading) return <DialogFrame onClose={onClose}><div style={{ minHeight: 300, display: 'grid', placeItems: 'center', color: '#64748B' }}>Preparing checkout…</div></DialogFrame>
  if (!session) return <DialogFrame onClose={onClose}><div style={{ minHeight: 360, display: 'grid', placeItems: 'center', padding: 24 }}><div style={{ ...cardStyle, width: 420, maxWidth: '100%', textAlign: 'center' }}><h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Sign in to checkout</h1><p style={{ color: '#64748B', fontSize: 14 }}>Your cart is saved. Sign in so your order and artwork stay private.</p><Link to="/login" state={{ from: '/cart?checkout=1' }} style={{ display: 'inline-block', background: '#1D4ED8', color: '#fff', textDecoration: 'none', borderRadius: 9, padding: '11px 22px', fontWeight: 700 }}>Sign in</Link></div></div></DialogFrame>
  if (!items.length) return <DialogFrame onClose={onClose}><div style={{ minHeight: 300, display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><h2>Your cart is empty</h2><Link to="/catalog">Browse products</Link></div></div></DialogFrame>

  const deliveryValid = address.fullName.trim().length >= 2 && address.phone.trim().length >= 6 && address.line1.trim().length >= 3 && address.city.trim().length >= 2
  const linePrice = (line: CheckoutLine) => configuredPrice(Number(line.product.basePrice), mapCatalogFields(line.product), { ...Object.fromEntries((line.cart.selections ?? []).map(selection => [selection.fieldId, selection.value])), ...line.selections }) * line.cart.qty

  return <DialogFrame onClose={onClose}><div style={{ background: '#F8FAFC', minHeight: 600, fontFamily: 'system-ui' }}>
    <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 54px 16px 20px', position: 'sticky', top: 0, zIndex: 3 }}><button type="button" aria-label="Close checkout" onClick={onClose} disabled={placing} style={{ position: 'absolute', right: 16, top: 14, width: 34, height: 34, borderRadius: '50%', border: '1px solid #E2E8F0', background: '#fff', color: '#334155', fontSize: 20, cursor: 'pointer' }}>×</button><div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{STEPS.map((candidate, index) => <div key={candidate.id} style={{ display: 'flex', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 27, height: 27, display: 'grid', placeItems: 'center', borderRadius: '50%', background: index <= stepIndex ? '#1D4ED8' : '#E2E8F0', color: index <= stepIndex ? '#fff' : '#64748B', fontSize: 12, fontWeight: 700 }}>{index < stepIndex ? '✓' : index + 1}</span><span style={{ fontSize: 12, fontWeight: index === stepIndex ? 700 : 500, color: index <= stepIndex ? '#0F172A' : '#94A3B8' }}>{candidate.label}</span></div>{index < STEPS.length - 1 && <span style={{ width: 32, height: 1, background: index < stepIndex ? '#1D4ED8' : '#E2E8F0', margin: '0 9px' }} />}</div>)}</div></div>
    <div className="stor-checkout-layout" style={{ maxWidth: 1040, margin: '0 auto', padding: '30px 22px' }}>
      <main>
        {error && <div style={{ padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, color: '#B91C1C', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {step === 'details' && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {lines.map(line => <section key={line.cart.id} style={cardStyle}><div style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 14, marginBottom: 16 }}><img src={line.cart.image} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover' }} /><div><h2 style={{ margin: 0, fontSize: 16 }}>{line.product.name}</h2><span style={{ fontSize: 12, color: '#64748B' }}>Product-specific order information</span></div></div>{line.fields.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>{line.fields.map(field => <CheckoutField key={field.id} field={field} value={line.selections[field.id]} onChange={value => setSelection(line, field.id, value)} uploading={uploadingKey === `${line.cart.id}:${field.id}`} onUpload={file => upload(line, file, field)} />)}</div>}<div><label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>Artwork / design files *</label><label style={{ display: 'block', border: '1.5px dashed #94A3B8', borderRadius: 10, padding: 14, cursor: uploadingKey ? 'wait' : 'pointer', background: '#F8FAFC', color: '#475569' }}>+ Upload artwork (PDF, image, AI, EPS or ZIP)<input hidden type="file" disabled={Boolean(uploadingKey)} accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.ai,.eps,.zip" onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) upload(line, file); event.target.value = '' }} /></label>{line.artwork.map(file => <div key={file.token} style={{ fontSize: 12, color: '#047857', marginTop: 6 }}>✓ {file.originalName}</div>)}</div></section>)}
          <button onClick={() => validateDetails() && setStep('delivery')} style={{ border: 0, borderRadius: 10, padding: 13, background: '#1D4ED8', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Continue to Delivery →</button>
        </div>}
        {step === 'delivery' && <section style={cardStyle}><h2 style={{ margin: '0 0 18px', fontSize: 18 }}>Delivery Details</h2><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><input style={inputStyle} placeholder="Full name *" value={address.fullName} onChange={event => setAddress({ ...address, fullName: event.target.value })} /><input style={inputStyle} placeholder="Phone *" value={address.phone} onChange={event => setAddress({ ...address, phone: event.target.value })} /><input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Address line 1 *" value={address.line1} onChange={event => setAddress({ ...address, line1: event.target.value })} /><input style={{ ...inputStyle, gridColumn: '1 / -1' }} placeholder="Address line 2" value={address.line2} onChange={event => setAddress({ ...address, line2: event.target.value })} /><input style={inputStyle} placeholder="City / area *" value={address.city} onChange={event => setAddress({ ...address, city: event.target.value })} /><select style={inputStyle} value={address.emirate} onChange={event => setAddress({ ...address, emirate: event.target.value })}>{EMIRATES.map(emirate => <option key={emirate}>{emirate}</option>)}</select><textarea style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} rows={3} placeholder="Delivery notes" value={address.notes} onChange={event => setAddress({ ...address, notes: event.target.value })} /></div><label style={{ display: 'flex', gap: 8, marginTop: 14, fontSize: 13, color: '#475569' }}><input type="checkbox" checked={saveAddress} onChange={event => setSaveAddress(event.target.checked)} /> Save this address to my account</label><div style={{ display: 'flex', gap: 9, marginTop: 18 }}><button onClick={() => setStep('details')} style={{ flex: 1, padding: 12, borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff' }}>← Back</button><button disabled={!deliveryValid} onClick={() => setStep('payment')} style={{ flex: 2, padding: 12, borderRadius: 9, border: 0, background: '#1D4ED8', color: '#fff', fontWeight: 700, opacity: deliveryValid ? 1 : .5 }}>Continue to Payment →</button></div></section>}
        {step === 'payment' && <section style={cardStyle}><h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Payment Method</h2><p style={{ color: '#64748B', fontSize: 13, margin: '0 0 16px' }}>Online card and wallet payments will appear after a secure payment provider is connected.</p>{([{ id: 'cash_on_delivery', label: 'Cash on Delivery', help: 'Pay when your order is delivered.' }, { id: 'bank_transfer', label: 'Bank Transfer', help: 'Your order stays pending until the transfer is confirmed.' }] as const).map(method => <label key={method.id} style={{ display: 'flex', gap: 11, padding: 14, border: `2px solid ${payment === method.id ? '#1D4ED8' : '#E2E8F0'}`, borderRadius: 10, marginBottom: 10, cursor: 'pointer', background: payment === method.id ? '#EFF6FF' : '#fff' }}><input type="radio" checked={payment === method.id} onChange={() => setPayment(method.id)} /><span><strong>{method.label}</strong><small style={{ display: 'block', color: '#64748B', marginTop: 3 }}>{method.help}</small></span></label>)}<div style={{ display: 'flex', gap: 9, marginTop: 18 }}><button onClick={() => setStep('delivery')} style={{ flex: 1, padding: 12, borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff' }}>← Back</button><button onClick={() => setStep('review')} style={{ flex: 2, padding: 12, borderRadius: 9, border: 0, background: '#1D4ED8', color: '#fff', fontWeight: 700 }}>Review Order →</button></div></section>}
        {step === 'review' && <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><section style={cardStyle}><h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Delivery</h2><div style={{ fontSize: 14, lineHeight: 1.6 }}>{address.fullName} · {address.phone}<br />{address.line1}{address.line2 && `, ${address.line2}`}<br />{address.city}, {address.emirate}, UAE</div></section><section style={cardStyle}><h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Items and specifications</h2>{lines.map(line => <div key={line.cart.id} style={{ padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}><strong>{line.product.name} × {line.cart.qty}</strong>{[...(line.cart.selections ?? []), ...line.fields.map(field => ({ fieldId: field.id, value: line.selections[field.id] }))].map(selection => { const field = mapCatalogFields(line.product).find(candidate => candidate.id === selection.fieldId); return field && selection.value ? <div key={selection.fieldId} style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{field.label}: {asValues(selection.value).map(value => field.options.find(option => option.value === value)?.label ?? value).join(', ')}</div> : null })}<div style={{ fontSize: 12, color: '#047857', marginTop: 4 }}>{line.artwork.length} artwork file{line.artwork.length === 1 ? '' : 's'} attached</div></div>)}</section><div style={{ display: 'flex', gap: 9 }}><button onClick={() => setStep('payment')} style={{ flex: 1, padding: 12, borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff' }}>← Back</button><button disabled={placing} onClick={placeOrder} style={{ flex: 2, padding: 13, borderRadius: 9, border: 0, background: placing ? '#64748B' : '#1D4ED8', color: '#fff', fontWeight: 700 }}>{placing ? 'Placing order…' : `Place Order · AED ${estimatedTotal.toFixed(2)}`}</button></div></div>}
      </main>
      <aside style={{ ...cardStyle, height: 'fit-content', position: 'sticky', top: 24 }}><h3 style={{ margin: '0 0 14px', fontSize: 16 }}>Order Summary</h3>{lines.map(line => <div key={line.cart.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 9 }}><span>{line.product.name} × {line.cart.qty}</span><strong>AED {linePrice(line).toFixed(2)}</strong></div>)}<div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 11, marginTop: 10, display: 'grid', gap: 7, fontSize: 13 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Net amount</span><span>AED {net.toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VAT included (5%)</span><span>AED {vat.toFixed(2)}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}><span>Total</span><span>AED {estimatedTotal.toFixed(2)}</span></div></div></aside>
    </div>
  </div></DialogFrame>
}

export function CheckoutPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/cart?checkout=1', { replace: true }) }, [navigate])
  return null
}
