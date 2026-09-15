import { useMemo, useState } from 'react'
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

interface CapturedZone { id: string; label: string; width: number; height: number }
interface CapturedDesign { productType: string; label: string; zones: CapturedZone[]; shots: Record<string, string> }

export function DesignReviewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const product = params.get('product') ?? 'business_card'

  // The editor stashes the rendered sides here before navigating.
  const design = useMemo<CapturedDesign | null>(() => {
    try { const d = JSON.parse(sessionStorage.getItem('inkora_design') || 'null'); return d && d.productType === product ? d : null } catch { return null }
  }, [product])

  const zones = design?.zones ?? [{ id: 'front', label: 'Front', width: 90, height: 54 }, { id: 'back', label: 'Back', width: 90, height: 54 }]
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? 'front')
  const zone = zones.find(z => z.id === zoneId) ?? zones[0]
  const shot = design?.shots?.[zoneId] ?? null
  const [approved, setApprove] = useState(false)

  const editHref = `/editor?product=${product}`
  const close = () => navigate(editHref)
  const cont  = () => {
    if (!approved) return
    const info = productInfo(product)
    const image = design?.shots?.[zones[0]?.id] ?? ''  // front thumbnail for the cart
    addItem({ id: `${info.slug}::design::${Date.now()}`, slug: info.slug, name: info.name, image, options: [`Custom design (${design?.label ?? 'editor'})`], qty: 1, unitPrice: info.price })
    navigate('/cart')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: '#fff', display: 'flex', fontFamily: FONT }}>
      {/* ── Left: the customer's actual design ── */}
      <div style={{ flex: 1, background: '#F4F4F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, minWidth: 0 }}>
        <div style={{ maxWidth: 'min(72vw, 560px)', maxHeight: '62vh', width: `min(72vw, 560px, ${zone.height ? (62 * zone.width / zone.height) : 100}vh)` }}>
          <div style={{ width: '100%', aspectRatio: `${zone.width} / ${zone.height}`, background: '#fff', boxShadow: '0 12px 44px rgba(0,0,0,0.16)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
            {shot
              ? <img src={shot} alt={`Your design ${zone.label}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>Your design ({zone.label})</div>}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#94A3B8' }}>{zone.width} × {zone.height} mm</div>
        </div>

        {/* Side toggle */}
        {zones.length > 1 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
            {zones.map(z => (
              <button key={z.id} onClick={() => setZoneId(z.id)}
                style={{ padding: '10px 26px', borderRadius: 8, fontFamily: FONT, fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#111827', border: `1.5px solid ${zoneId === z.id ? '#111827' : '#E2E8F0'}` }}>
                {z.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: review panel ── */}
      <div style={{ width: 560, maxWidth: '46vw', display: 'flex', flexDirection: 'column', padding: '48px 56px 32px', position: 'relative', boxSizing: 'border-box' }}>
        <button onClick={close} aria-label="Close" style={{ position: 'absolute', top: 24, right: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#111827', padding: 6 }}>
          <X size={26} />
        </button>

        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#111827', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Review your design</h1>
        <p style={{ fontSize: 16, color: '#374151', margin: '0 0 28px' }}>Double-check the following details before you continue.</p>
        {!design && <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 8, padding: '10px 12px', fontSize: 13, marginBottom: 20 }}>We couldn't load your design preview — go back and open the editor again if the sides look blank.</div>}

        <ul style={{ listStyle: 'disc', paddingLeft: 22, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <li style={{ fontSize: 16, color: '#111827' }}>Text is clear and easy to read</li>
          <li style={{ fontSize: 16, color: '#111827' }}>Information is spelled correctly</li>
          <li style={{ fontSize: 16, color: '#111827' }}>Images are sharp with no blurring</li>
        </ul>

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
