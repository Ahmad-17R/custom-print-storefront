import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useCart } from '../../context/CartContext'

const FONT = "'Poppins', system-ui, sans-serif"

// Map an editor template key back to its storefront product for the cart line
const PRODUCT_INFO: Record<string, { slug: string; name: string; price: number }> = {
  business_card: { slug: 'business-cards', name: 'Business Cards', price: 49 },
  letterhead:    { slug: 'letterhead',     name: 'Letterhead',     price: 89 },
}
function productInfo(key: string) {
  if (key.startsWith('business_card')) return PRODUCT_INFO.business_card
  return PRODUCT_INFO[key] ?? PRODUCT_INFO.business_card
}

// Mockup art per side. Apparel products get a t-shirt; everything else a flat sheet.
const TSHIRT_FRONT = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80'
const TSHIRT_BACK  = 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=900&q=80'

const APPAREL = ['tshirt', 't_shirt', 't-shirt', 'clothing', 'apparel', 'shirt', 'hoodie', 'bag', 'tote']

export function DesignReviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const product = params.get('product') ?? 'business_card'
  const isApparel = APPAREL.some(k => product.toLowerCase().includes(k))

  const [side, setSide]       = useState<'front' | 'back'>('front')
  const [approved, setApprove] = useState(false)

  const editHref = `/editor?product=${product}`
  const close = () => navigate(editHref)
  // Approving the design auto-adds it to the cart, then opens the cart
  const cont  = () => {
    if (!approved) return
    const info = productInfo(product)
    addItem({ id: `${info.slug}::design::${Date.now()}`, slug: info.slug, name: info.name, image: '', options: ['Custom design (editor)'], qty: 1, unitPrice: info.price })
    navigate('/cart')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#fff', display: 'flex', fontFamily: FONT }}>
      {/* ── Left: product mockup ── */}
      <div style={{ flex: 1, background: '#F4F4F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, minWidth: 0 }}>
        <div style={{ position: 'relative', width: 'min(60vh, 520px)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isApparel ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={side === 'front' ? TSHIRT_FRONT : TSHIRT_BACK} alt="Product mockup" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {/* Print zone with the customer's design placeholder */}
              <div style={{ position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%,-50%)', width: '30%', aspectRatio: '4/3', border: '1px dashed #94A3B8', background: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#64748B', fontSize: 11, padding: 6 }}>
                Your design ({side})
              </div>
            </div>
          ) : (
            <div style={{ width: '82%', aspectRatio: '3/4', background: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', borderRadius: 4, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 18, border: '1.5px dashed #e2453f', borderRadius: 4 }} />
              <span style={{ color: '#64748B', fontSize: 13 }}>Your design ({side})</span>
            </div>
          )}
        </div>

        {/* Front / Back toggle */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {(['front', 'back'] as const).map(sd => (
            <button key={sd} onClick={() => setSide(sd)}
              style={{ padding: '10px 26px', borderRadius: 8, fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                background: '#fff', color: '#111827',
                border: `1.5px solid ${side === sd ? '#111827' : '#E2E8F0'}` }}>
              {sd === 'front' ? 'Front' : 'Back'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: review panel ── */}
      <div style={{ width: 560, maxWidth: '46vw', display: 'flex', flexDirection: 'column', padding: '48px 56px 32px', position: 'relative', boxSizing: 'border-box' }}>
        <button onClick={close} aria-label="Close" style={{ position: 'absolute', top: 24, right: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#111827', padding: 6 }}>
          <X size={26} />
        </button>

        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#111827', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Review your design</h1>
        <p style={{ fontSize: 16, color: '#374151', margin: '0 0 28px' }}>Double-check the following details before you continue.</p>

        <ul style={{ listStyle: 'disc', paddingLeft: 22, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <li style={{ fontSize: 16, color: '#111827' }}>Text is clear and easy to read</li>
          <li style={{ fontSize: 16, color: '#111827' }}>Information is spelled correctly</li>
          <li style={{ fontSize: 16, color: '#111827' }}>Images are sharp with no blurring</li>
        </ul>

        {/* Spacer pushes actions to the bottom */}
        <div style={{ flex: 1 }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
          <input type="checkbox" checked={approved} onChange={e => setApprove(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          <span style={{ fontSize: 15, color: '#111827' }}>I have reviewed and approve my design.</span>
        </label>

        <button onClick={cont} disabled={!approved}
          style={{ width: '100%', padding: '15px 0', borderRadius: 10, border: 'none', fontFamily: FONT, fontSize: 16, fontWeight: 700, marginBottom: 12,
            background: approved ? '#3FB6E6' : '#BFE6F5', color: '#fff', cursor: approved ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}>
          Continue
        </button>
        <button onClick={close}
          style={{ width: '100%', padding: '14px 0', borderRadius: 10, background: '#fff', color: '#111827', border: '1.5px solid #E2E8F0', fontFamily: FONT, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
          Edit my design
        </button>
      </div>
    </div>
  )
}
