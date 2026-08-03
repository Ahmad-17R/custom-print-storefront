import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEMPLATES } from '../../shared/components/product-editor/templates'

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('stor-visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '-30px' },
    )
    document.querySelectorAll('.stor-reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  })
}

const CARD_COLORS: Record<string, [string, string]> = {
  business_card:         ['#1D4ED8', '#2563EB'],
  business_card_rounded: ['#0369A1', '#0284C7'],
  business_card_square:  ['#7C3AED', '#8B5CF6'],
  business_card_circle:  ['#047857', '#059669'],
  business_card_oval:    ['#B45309', '#3B82F6'],
  letterhead:            ['#1D4ED8', '#2563EB'],
  pen:                   ['#374151', '#4B5563'],
}

const PRODUCT_IMAGES: Record<string, string> = {
  business_card:         'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=320&q=80&auto=format&fit=crop',
  business_card_rounded: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=500&h=320&q=80&auto=format&fit=crop',
  business_card_square:  'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500&h=320&q=80&auto=format&fit=crop',
  business_card_circle:  'https://images.unsplash.com/photo-1560472355-536de3962603?w=500&h=320&q=80&auto=format&fit=crop',
  business_card_oval:    'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=320&q=80&auto=format&fit=crop',
  letterhead:            'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&h=320&q=80&auto=format&fit=crop',
  pen:                   'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&h=320&q=80&auto=format&fit=crop',
}

// ── Promo Banner ──────────────────────────────────────────────────────────────
function PromoBanner() {
  const [visible, setVisible] = useState(true)
  const navigate = useNavigate()
  if (!visible) return null
  return (
    <div style={{
      backgroundColor: '#0F172A', color: 'white',
      padding: '10px 16px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, position: 'relative',
    }}>
      <span style={{ fontSize: 13, fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>
        🎉 <strong>Up to 30% off</strong> your first order — use code{' '}
        <span style={{
          backgroundColor: '#1D4ED8', borderRadius: 4, padding: '1px 7px',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
        }}>MPW30</span>
      </span>
      <button
        onClick={() => navigate('/catalog')}
        style={{
          backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.25)', borderRadius: 4,
          padding: '2px 10px', fontSize: 12, cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif', fontWeight: 500,
          marginLeft: 4, whiteSpace: 'nowrap',
        }}
      >
        Shop now
      </button>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px',
        }}
      >×</button>
    </div>
  )
}

// ── Category Tab Strip ────────────────────────────────────────────────────────
const CAT_TABS = [
  { label: 'Business Cards', key: 'business_card' },
  { label: 'Letterheads', key: 'letterhead' },
  { label: 'Rounded Cards', key: 'business_card_rounded' },
  { label: 'Circle Cards', key: 'business_card_circle' },
  { label: 'Square Cards', key: 'business_card_square' },
  { label: 'Custom Pens', key: 'pen' },
]

function CategoryTabStrip() {
  const navigate = useNavigate()
  const [active, setActive] = useState('business_card')
  return (
    <div style={{
      borderBottom: '1px solid #E8E8E8', backgroundColor: 'white',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch' as never,
    }}>
      <div style={{
        maxWidth: 1500, margin: '0 auto', padding: '0 32px',
        display: 'flex', gap: 0, minWidth: 'max-content',
      }}>
        {CAT_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActive(tab.key); navigate(`/editor?product=${tab.key}`) }}
            style={{
              backgroundColor: 'transparent', border: 'none',
              borderBottom: active === tab.key ? '2px solid #1D4ED8' : '2px solid transparent',
              color: active === tab.key ? '#1D4ED8' : '#1E293B',
              padding: '14px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function HeroBanner() {
  const navigate = useNavigate()
  return (
    <section style={{
      background: 'linear-gradient(135deg, #EFF6FF 55%, #DBEAFE)',
      borderBottom: '1px solid #BFDBFE',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '52px 32px 48px', display: 'flex', alignItems: 'center', gap: 48 }}>
        {/* Left copy */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            display: 'inline-block', backgroundColor: '#1D4ED8',
            color: 'white', borderRadius: 4, padding: '4px 12px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', marginBottom: 16,
            fontFamily: 'system-ui, sans-serif',
          }}>
            Semi-Annual Sale · Up to 30% off
          </div>
          <h1 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 800, fontSize: 'clamp(32px, 4.5vw, 54px)',
            lineHeight: 1.08, letterSpacing: '-0.03em', color: '#0F172A',
            margin: '0 0 16px',
          }}>
            Print that makes<br />
            <span style={{ color: '#1D4ED8' }}>your brand unforgettable</span>
          </h1>
          <p style={{
            fontSize: 16, color: '#475569', fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.6, margin: '0 0 28px', maxWidth: 440,
          }}>
            Design online. Premium 300 DPI print. Delivered across all 7 Emirates in 24–48 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/editor')}
              style={{
                backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                borderRadius: 8, padding: '14px 28px', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
              }}
            >
              Start designing free
            </button>
            <button
              onClick={() => navigate('/catalog')}
              style={{
                backgroundColor: 'white', color: '#0F172A',
                border: '1.5px solid #CBD5E1', borderRadius: 8,
                padding: '14px 24px', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, fontFamily: 'system-ui, sans-serif',
              }}
            >
              Browse all products
            </button>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: 36, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              { val: '10,000+', label: 'Orders' },
              { val: '300 DPI', label: 'Print quality' },
              { val: '24–48hr', label: 'Delivery' },
              { val: '4.9★', label: '2K+ reviews' },
            ].map(s => (
              <div key={s.val}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui, sans-serif" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'system-ui, sans-serif', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: real photo */}
        <div style={{ flex: '0 0 auto', position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&h=620&q=85&auto=format&fit=crop"
            alt="Premium custom business card printing"
            style={{
              width: 620, height: 460,
              objectFit: 'cover', borderRadius: 20,
              boxShadow: '0 28px 64px rgba(15,23,42,0.22)',
              display: 'block',
            }}
          />
          {/* Floating badge */}
          <div style={{
            position: 'absolute', bottom: -16, left: -20,
            backgroundColor: 'white', borderRadius: 12,
            padding: '12px 18px', boxShadow: '0 8px 24px rgba(15,23,42,0.14)',
            display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4 4 8-8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>Order ready</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'system-ui' }}>Delivered in 24hrs</div>
            </div>
          </div>
          {/* Rating badge */}
          <div style={{
            position: 'absolute', top: -14, right: -14,
            backgroundColor: '#1D4ED8', borderRadius: 10,
            padding: '10px 14px', boxShadow: '0 4px 16px rgba(29,78,216,0.35)',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: "'Poppins', system-ui", lineHeight: 1 }}>4.9★</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'system-ui', marginTop: 2 }}>2,000+ reviews</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Explore All Categories ────────────────────────────────────────────────────
const EXPLORE_CATS = [
  { key: 'business_card',         label: 'Business Cards',     from: 49,  image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'letterhead',            label: 'Letterheads',        from: 89,  image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'flyers',                label: 'Flyers',             from: 35,  image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'brochures',             label: 'Brochures',          from: 120, image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'business_card_square',  label: 'Square Cards',       from: 119, image: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'notebooks',             label: 'Notebooks',          from: 95,  image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'rollup-banners',        label: 'Roll-Up Banners',    from: 220, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'stickers',              label: 'Stickers & Labels',  from: 28,  image: 'https://images.unsplash.com/photo-1625690257008-a43dae74eb4d?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'pen',                   label: 'Branded Pens',       from: 15,  image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&h=260&q=80&auto=format&fit=crop' },
  { key: 'tshirts',               label: 'T-Shirts',           from: 75,  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=260&q=80&auto=format&fit=crop' },
]

function ExploreSection() {
  const navigate = useNavigate()
  return (
    <section style={{ backgroundColor: 'white', padding: '52px 32px 44px', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 700, fontSize: 'clamp(20px, 2.5vw, 26px)',
            color: '#0F172A', letterSpacing: '-0.02em', margin: 0,
          }}>Explore all categories</h2>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              backgroundColor: 'transparent', color: '#1D4ED8',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'system-ui, sans-serif', padding: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            See all
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
        }}>
          {EXPLORE_CATS.map(cat => (
            <button
              key={cat.key}
              onClick={() => navigate(cat.key.startsWith('business_card') ? `/editor?product=${cat.key}` : `/catalog`)}
              style={{
                backgroundColor: 'white', border: '1.5px solid #E2E8F0',
                borderRadius: 14, overflow: 'hidden',
                cursor: 'pointer', textAlign: 'left', padding: 0,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-4px)'
                el.style.boxShadow = '0 12px 32px rgba(15,23,42,0.12)'
                el.style.borderColor = '#1D4ED8'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
                el.style.borderColor = '#E2E8F0'
              }}
            >
              {/* Image */}
              <div style={{ height: 130, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                <img
                  src={cat.image}
                  alt={cat.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              {/* Label */}
              <div style={{ padding: '12px 14px 14px' }}>
                <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 3, lineHeight: 1.3 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui, sans-serif' }}>
                  From AED {cat.from}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Horizontal Product Carousel ───────────────────────────────────────────────
interface ProductCardProps {
  templateKey: string
  badge?: string
}

function ProductCard({ templateKey, badge }: ProductCardProps) {
  const navigate = useNavigate()
  const tmpl = TEMPLATES[templateKey]
  if (!tmpl) return null
  const [c1, c2] = CARD_COLORS[templateKey] ?? ['#0F172A', '#1E293B']
  const imgSrc = PRODUCT_IMAGES[templateKey]
  const [imgError, setImgError] = useState(false)

  return (
    <article
      onClick={() => navigate(`/editor?product=${templateKey}`)}
      style={{
        backgroundColor: 'white', borderRadius: 12,
        border: '1px solid #EBEBEB', overflow: 'hidden',
        cursor: 'pointer', flexShrink: 0, width: 240,
        transition: 'box-shadow 0.18s ease, transform 0.18s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 28px rgba(15,23,42,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* Product image */}
      <div style={{ height: 170, position: 'relative', overflow: 'hidden', borderBottom: '1px solid #F0F0F0' }}>
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={tmpl.label}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(135deg, ${c1}22, ${c2}14)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ProductMockup productKey={templateKey} c1={c1} c2={c2} />
          </div>
        )}
        {badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            backgroundColor: '#1D4ED8', color: 'white',
            borderRadius: 4, padding: '3px 8px',
            fontSize: 11, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
          }}>{badge}</div>
        )}
      </div>

      {/* Product info */}
      <div style={{ padding: '14px 16px' }}>
        <h3 style={{
          fontFamily: "'Poppins', system-ui, sans-serif",
          fontWeight: 600, fontSize: 14, color: '#0F172A',
          margin: '0 0 4px', letterSpacing: '-0.01em',
        }}>{tmpl.label}</h3>
        <p style={{ color: '#64748B', fontSize: 12, fontFamily: 'system-ui, sans-serif', margin: '0 0 10px' }}>
          Min. {tmpl.quantities[0]} units · {tmpl.dpi} DPI
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui, sans-serif" }}>
            AED {tmpl.basePrice}
          </span>
          <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
            Design now →
          </span>
        </div>
      </div>
    </article>
  )
}

function ProductMockup({ productKey, c1, c2 }: { productKey: string; c1: string; c2: string }) {
  if (productKey === 'letterhead') {
    return (
      <svg width="90" height="116" viewBox="0 0 90 116" fill="none">
        <rect x="0" y="0" width="90" height="116" rx="4" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        <rect x="0" y="0" width="90" height="16" rx="4" fill={c1} opacity="0.9"/>
        <rect x="0" y="8" width="90" height="8" fill={c1} opacity="0.9"/>
        <rect x="8" y="24" width="32" height="5" rx="2" fill="#0F172A" opacity="0.7"/>
        <rect x="8" y="33" width="22" height="3" rx="1.5" fill={c1} opacity="0.6"/>
        <rect x="8" y="48" width="74" height="3" rx="1.5" fill="#CBD5E1"/>
        <rect x="8" y="55" width="68" height="3" rx="1.5" fill="#CBD5E1"/>
        <rect x="8" y="62" width="74" height="3" rx="1.5" fill="#CBD5E1"/>
        <rect x="8" y="69" width="55" height="3" rx="1.5" fill="#CBD5E1"/>
        <rect x="8" y="84" width="74" height="3" rx="1.5" fill="#E8E8E8"/>
        <rect x="8" y="91" width="60" height="3" rx="1.5" fill="#E8E8E8"/>
        <rect x="8" y="104" width="40" height="3" rx="1.5" fill="#E8E8E8"/>
      </svg>
    )
  }
  if (productKey === 'pen' || productKey === 'business_card_oval') {
    return (
      <svg width="130" height="40" viewBox="0 0 130 40" fill="none">
        <rect x="0" y="14" width="110" height="12" rx="6" fill={c1} opacity="0.9"/>
        <rect x="108" y="16" width="16" height="8" rx="4" fill={c2}/>
        <circle cx="8" cy="20" r="6" fill={c2}/>
        <rect x="14" y="17" width="30" height="3" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="14" y="22" width="20" height="2" rx="1" fill="white" opacity="0.3"/>
      </svg>
    )
  }
  if (productKey === 'business_card_circle') {
    return (
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <circle cx="45" cy="45" r="42" fill={c1} opacity="0.08" stroke={c1} strokeWidth="1.5" opacity="0.2"/>
        <circle cx="45" cy="45" r="38" fill="white" stroke="#E8E8E8" strokeWidth="1"/>
        <circle cx="45" cy="34" r="10" fill={c1} opacity="0.15" stroke={c1} strokeWidth="1.5"/>
        <rect x="28" y="57" width="34" height="4" rx="2" fill="#CBD5E1"/>
        <rect x="31" y="65" width="28" height="3" rx="1.5" fill="#E8E8E8"/>
      </svg>
    )
  }
  if (productKey === 'business_card_square') {
    return (
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
        <rect x="5" y="5" width="80" height="80" rx="6" fill="white" stroke="#E8E8E8" strokeWidth="1.5"/>
        <rect x="5" y="5" width="80" height="22" rx="6" fill={c1} opacity="0.12"/>
        <rect x="5" y="17" width="80" height="10" fill={c1} opacity="0.12"/>
        <rect x="14" y="38" width="36" height="6" rx="3" fill="#0F172A" opacity="0.7"/>
        <rect x="14" y="49" width="24" height="4" rx="2" fill={c1} opacity="0.5"/>
        <rect x="14" y="62" width="50" height="3" rx="1.5" fill="#CBD5E1"/>
        <rect x="14" y="69" width="40" height="3" rx="1.5" fill="#E8E8E8"/>
      </svg>
    )
  }
  // Default: horizontal business card
  return (
    <svg width="136" height="80" viewBox="0 0 136 80" fill="none">
      <rect x="2" y="2" width="132" height="76" rx="6" fill="white" stroke="#E8E8E8" strokeWidth="1.5"/>
      <rect x="2" y="2" width="132" height="22" rx="6" fill={c1} opacity="0.12"/>
      <rect x="2" y="14" width="132" height="10" fill={c1} opacity="0.12"/>
      <circle cx="22" cy="48" r="10" fill={c1} opacity="0.15"/>
      <circle cx="22" cy="48" r="6" fill={c1} opacity="0.3"/>
      <rect x="40" y="42" width="60" height="5" rx="2.5" fill="#0F172A" opacity="0.7"/>
      <rect x="40" y="52" width="40" height="4" rx="2" fill={c1} opacity="0.4"/>
      <rect x="40" y="60" width="55" height="3" rx="1.5" fill="#CBD5E1"/>
    </svg>
  )
}

interface CarouselProps {
  title: string
  subtitle?: string
  keys: string[]
  badges?: Record<string, string>
}

function ProductCarousel({ title, subtitle, keys, badges = {} }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' })
  }

  const navigate = useNavigate()

  return (
    <section style={{ backgroundColor: 'white', padding: '48px 0', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)',
              color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 4px',
            }}>{title}</h2>
            {subtitle && (
              <p style={{ color: '#64748B', fontSize: 13, fontFamily: 'system-ui, sans-serif', margin: 0 }}>{subtitle}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/catalog')}
              style={{
                backgroundColor: 'transparent', color: '#1D4ED8', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'system-ui, sans-serif', padding: 0, marginRight: 8,
              }}
            >See all</button>
            {(['left', 'right'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '1px solid #E8E8E8', backgroundColor: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#0F172A',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d={dir === 'left' ? 'M9 2L4 7l5 5' : 'M5 2l5 5-5 5'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          style={{
            display: 'flex', gap: 16, padding: '4px 32px 12px',
            overflowX: 'auto', scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch' as never,
            maxWidth: 1500, margin: '0 auto',
          }}
        >
          {keys.map(k => (
            <ProductCard key={k} templateKey={k} badge={badges[k]} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Promo Pair Banners ────────────────────────────────────────────────────────
function PromoPair() {
  const navigate = useNavigate()
  return (
    <section style={{ backgroundColor: '#F7F7F7', padding: '48px 32px' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Card 1 */}
        <div style={{
          backgroundColor: '#0F172A', borderRadius: 16,
          padding: '36px 32px', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', minHeight: 200,
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', backgroundColor: '#1D4ED8', opacity: 0.15 }} />
          <div style={{ position: 'absolute', bottom: -20, right: 20, width: 80, height: 80, borderRadius: '50%', backgroundColor: '#3B82F6', opacity: 0.1 }} />
          <div style={{ position: 'relative' }}>
            <span style={{
              backgroundColor: '#1D4ED8', color: 'white', borderRadius: 4,
              padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              fontFamily: 'system-ui, sans-serif', display: 'inline-block', marginBottom: 14,
            }}>FREE DELIVERY</span>
            <h3 style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 700, fontSize: 22, color: 'white',
              margin: '0 0 10px', lineHeight: 1.2,
            }}>Same-day dispatch<br />on all card orders</h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontFamily: 'system-ui, sans-serif', margin: '0 0 20px', lineHeight: 1.5 }}>
              Order before 2pm · Delivered next business day across UAE
            </p>
            <button
              onClick={() => navigate('/editor?product=business_card')}
              style={{
                backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                borderRadius: 8, padding: '11px 20px', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
              }}
            >
              Order business cards
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{
          backgroundColor: '#EFF6FF', borderRadius: 16,
          border: '1px solid #BFDBFE',
          padding: '36px 32px', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', minHeight: 200,
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', backgroundColor: '#1D4ED8', opacity: 0.06 }} />
          <span style={{
            backgroundColor: '#BFDBFE', color: '#1E3A8A', borderRadius: 4,
            padding: '3px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
            fontFamily: 'system-ui, sans-serif', display: 'inline-block', marginBottom: 14,
          }}>BRAND STARTER KIT</span>
          <h3 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 700, fontSize: 22, color: '#0F172A',
            margin: '0 0 10px', lineHeight: 1.2,
          }}>Cards + Letterhead<br />bundled &amp; ready</h3>
          <p style={{ color: '#64748B', fontSize: 13, fontFamily: 'system-ui, sans-serif', margin: '0 0 20px', lineHeight: 1.5 }}>
            Get your full brand identity printed in one order. Save 15% on bundle.
          </p>
          <button
            onClick={() => navigate('/catalog')}
            style={{
              backgroundColor: '#0F172A', color: 'white', border: 'none',
              borderRadius: 8, padding: '11px 20px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
              alignSelf: 'flex-start',
            }}
          >
            Shop the bundle
          </button>
        </div>
      </div>
    </section>
  )
}

// ── Trust Strip ───────────────────────────────────────────────────────────────
function TrustStrip() {
  const pillars = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5 2.5-7.5L2 9.5h7.5z" stroke="#1D4ED8" strokeWidth="1.6" strokeLinejoin="round"/></svg>,
      heading: '300 DPI print quality',
      body: 'Crystal-sharp output on premium coated and uncoated stocks',
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3M9 17h6m4 0h2m-2 0a2 2 0 11-4 0 2 2 0 014 0zm-8 0a2 2 0 11-4 0 2 2 0 014 0z" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round"/></svg>,
      heading: '24–48hr UAE delivery',
      body: 'Rush orders available. Standard delivery to all 7 Emirates',
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      heading: 'Free reprints guaranteed',
      body: "Not happy with the result? We'll reprint it — no questions asked",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#1D4ED8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
      heading: 'WhatsApp support',
      body: 'Real humans on chat — help with files, design, and delivery',
    },
  ]

  return (
    <section style={{ backgroundColor: 'white', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto', padding: '0 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}>
          {pillars.map((p, i) => (
            <div key={p.heading} style={{
              padding: '28px 20px',
              borderRight: i < pillars.length - 1 ? '1px solid #F0F0F0' : 'none',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>{p.icon}</div>
              <div>
                <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 5 }}>
                  {p.heading}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui, sans-serif', lineHeight: 1.55 }}>
                  {p.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Marquee strip ─────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  '✦ Business Cards', '✦ Letterheads', '✦ Custom Pens', '✦ Branded Stationery',
  '✦ Circle Cards', '✦ Square Cards', '✦ Rounded Cards', '✦ Print & Deliver UAE',
  '✦ 300 DPI Quality', '✦ 24hr Rush Available', '✦ Free Reprints',
]

function MarqueeStrip() {
  const repeated = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div style={{ backgroundColor: '#F7F7F7', borderBottom: '1px solid #EBEBEB', borderTop: '1px solid #EBEBEB', padding: '12px 0', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 0, animation: 'stor-marquee 35s linear infinite', width: 'max-content' }}>
        {repeated.map((item, i) => (
          <span key={i} style={{
            fontFamily: 'system-ui, sans-serif', fontWeight: 500, fontSize: 12,
            color: i % 3 === 0 ? '#1D4ED8' : '#64748B',
            letterSpacing: '0.03em', paddingRight: 44, flexShrink: 0,
          }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

// ── Industries ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { label: 'Restaurants & Cafes',    sub: 'Menus, Cards, Loyalty Cards',         color: '#EFF6FF', border: '#BFDBFE', icon: '🍽️' },
  { label: 'Real Estate',            sub: 'Business Cards, Letterheads',           color: '#EFF6FF', border: '#BFDBFE', icon: '🏙️' },
  { label: 'Healthcare & Clinics',   sub: 'Appointment Cards, Stationery',         color: '#F0FDF4', border: '#BBF7D0', icon: '🏥' },
  { label: 'Retail & Fashion',       sub: 'Gift Cards, Brand Cards',               color: '#FAF5FF', border: '#E9D5FF', icon: '🛍️' },
  { label: 'Corporate & Finance',    sub: 'Letterheads, Premium Cards',            color: '#F8FAFC', border: '#CBD5E1', icon: '💼' },
  { label: 'Events & Hospitality',   sub: 'Event Cards, Branded Pens',             color: '#FFFBEB', border: '#FDE68A', icon: '🎪' },
]

function IndustriesSection() {
  const navigate = useNavigate()
  return (
    <section style={{ backgroundColor: '#F7F7F7', padding: '52px 32px', borderBottom: '1px solid #EBEBEB' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div className="stor-reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 700, fontSize: 'clamp(22px, 3vw, 30px)',
            color: '#0F172A', letterSpacing: '-0.02em', margin: '0 0 10px',
          }}>Made for every industry</h2>
          <p style={{ color: '#64748B', fontSize: 15, fontFamily: 'system-ui, sans-serif', margin: 0 }}>
            From solo entrepreneurs to enterprise brands across the UAE
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {INDUSTRIES.map((ind, i) => (
            <div
              key={ind.label}
              className={`stor-reveal stor-reveal-delay-${(i % 3) + 1}`}
              onClick={() => navigate('/catalog')}
              style={{
                backgroundColor: ind.color, borderRadius: 12,
                border: `1px solid ${ind.border}`,
                padding: '18px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(15,23,42,0.08)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{ind.icon}</span>
              <div>
                <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: '#0F172A', marginBottom: 3 }}>
                  {ind.label}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui, sans-serif' }}>
                  {ind.sub}
                </div>
              </div>
              <svg style={{ marginLeft: 'auto', flexShrink: 0, color: '#94A3B8' }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How it works ──────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      num: '01', heading: 'Choose your product',
      body: 'Pick from business cards, letterheads, pens and more. Every format and shape, configured exactly how you want.',
    },
    {
      num: '02', heading: 'Design it online',
      body: 'Our browser-based editor lets you add text, logos and images. No software needed — done in minutes.',
    },
    {
      num: '03', heading: 'We print & deliver',
      body: '300 DPI on premium stocks. Delivered to your door in 24–48 hours anywhere in the UAE.',
    },
  ]

  const navigate = useNavigate()

  return (
    <section style={{ backgroundColor: 'white', padding: '60px 32px', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div className="stor-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0 }}>
          {/* Heading column */}
          <div style={{ padding: '0 40px 0 0', borderRight: '1px solid #F0F0F0', marginRight: 40 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#1D4ED8', fontFamily: 'system-ui, sans-serif', marginBottom: 12, margin: '0 0 12px',
            }}>How it works</p>
            <h2 style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 700, fontSize: 'clamp(24px, 3vw, 34px)',
              color: '#0F172A', letterSpacing: '-0.02em',
              margin: '0 0 16px', lineHeight: 1.15,
            }}>
              From idea to your door in 3 steps
            </h2>
            <p style={{ color: '#64748B', fontSize: 14, fontFamily: 'system-ui, sans-serif', margin: '0 0 24px', lineHeight: 1.65 }}>
              Design, print, deliver — all in one place. No emails, no phone calls, no waiting.
            </p>
            <button
              onClick={() => navigate('/editor')}
              style={{
                backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                borderRadius: 8, padding: '12px 22px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: 'system-ui, sans-serif',
              }}
            >
              Start now — it's free
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                paddingBottom: i < steps.length - 1 ? 28 : 0,
                borderBottom: i < steps.length - 1 ? '1px solid #F7F7F7' : 'none',
                marginBottom: i < steps.length - 1 ? 28 : 0,
              }}>
                <div style={{
                  fontFamily: "'Poppins', system-ui, sans-serif",
                  fontWeight: 800, fontSize: 28, color: '#F0EDE8',
                  flexShrink: 0, lineHeight: 1, minWidth: 44,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 600, fontSize: 15, color: '#0F172A', marginBottom: 6 }}>
                    {step.heading}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui, sans-serif', lineHeight: 1.65 }}>
                    {step.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah Al-Mansouri', role: 'Café Owner, Dubai', quote: 'Incredible quality. Our business cards arrived in 24 hours and looked better than any print shop we\'d used before.', avatar: 'S' },
  { name: 'Mohammed Al-Rashid', role: 'Real Estate Agent, Abu Dhabi', quote: 'The online editor is so intuitive — I designed my letterhead in 10 minutes. Will definitely reorder.', avatar: 'M' },
  { name: 'Fatima Zahra', role: 'Clinic Manager, Sharjah', quote: 'We order every quarter for our clinic. Consistent quality, fast delivery, and the team is very responsive.', avatar: 'F' },
]

function TestimonialsSection() {
  return (
    <section style={{ backgroundColor: '#F8FAFC', padding: '52px 32px', borderBottom: '1px solid #EBEBEB' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>
        <div className="stor-reveal" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 10 }}>
            {[1,2,3,4,5].map(n => (
              <svg key={n} width="18" height="18" viewBox="0 0 18 18" fill="#3B82F6"><path d="M9 1l2.1 5.6H17l-4.7 3.4 1.8 5.5L9 12.4l-5.1 3.1 1.8-5.5L1 6.6h5.9z"/></svg>
            ))}
          </div>
          <p style={{ fontFamily: "'Poppins', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: '#0F172A', margin: '0 0 4px' }}>
            4.9 out of 5
          </p>
          <p style={{ color: '#64748B', fontSize: 14, fontFamily: 'system-ui, sans-serif', margin: 0 }}>
            From 2,000+ UAE businesses on Trustpilot
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`stor-reveal stor-reveal-delay-${i + 1}`}
              style={{
                backgroundColor: 'white', borderRadius: 12,
                border: '1px solid #E8E8E8', padding: '22px',
              }}
            >
              <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                {[1,2,3,4,5].map(n => (
                  <svg key={n} width="13" height="13" viewBox="0 0 13 13" fill="#3B82F6"><path d="M6.5.8l1.5 4H12L8.6 7.5l1.3 4-3.4-2.5L3.1 11.5l1.3-4L1 4.8h4z"/></svg>
                ))}
              </div>
              <p style={{ color: '#1E293B', fontSize: 14, fontFamily: 'system-ui, sans-serif', lineHeight: 1.65, margin: '0 0 18px' }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#1D4ED8', fontFamily: 'system-ui, sans-serif',
                  flexShrink: 0,
                }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', fontFamily: 'system-ui, sans-serif' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui, sans-serif' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate()
  return (
    <section style={{ backgroundColor: '#0F172A', padding: '72px 32px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <div className="stor-reveal">
          <h2 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)',
            color: 'white', letterSpacing: '-0.02em',
            margin: '0 0 14px', lineHeight: 1.12,
          }}>
            Ready to print your brand?
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 16,
            fontFamily: 'system-ui, sans-serif', margin: '0 0 32px', lineHeight: 1.55,
          }}>
            Join 10,000+ UAE businesses who trust MyPrintingWorld for premium custom print.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <button
              onClick={() => navigate('/editor')}
              style={{
                backgroundColor: '#1D4ED8', color: 'white', border: 'none',
                borderRadius: 8, padding: '15px 30px', cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', system-ui, sans-serif",
              }}
            >
              Start designing — it's free
            </button>
            <button
              onClick={() => navigate('/catalog')}
              style={{
                backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '15px 24px', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, fontFamily: 'system-ui, sans-serif',
              }}
            >
              Browse products
            </button>
          </div>
          {/* Payment methods */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {['Visa', 'Mastercard', 'Apple Pay', 'Cash on Delivery', 'Tabby'].map(m => (
              <span key={m} style={{
                backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4,
                padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.45)',
                fontFamily: 'system-ui, sans-serif', fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
const ALL_KEYS = Object.keys(TEMPLATES)
const BESTSELLER_KEYS = ALL_KEYS.slice(0, Math.min(6, ALL_KEYS.length))
const BUSINESS_KEYS = ALL_KEYS.slice(0, Math.min(6, ALL_KEYS.length)).reverse()

const BESTSELLER_BADGES: Record<string, string> = {
  business_card: 'Bestseller',
  letterhead: 'Popular',
}

export function HomePage() {
  useScrollReveal()
  return (
    <div style={{ overflowX: 'hidden' }}>
      <PromoBanner />
      <CategoryTabStrip />
      <HeroBanner />
      <ExploreSection />
      <ProductCarousel
        title="Bestsellers"
        subtitle="Our most popular products — loved by UAE businesses"
        keys={BESTSELLER_KEYS}
        badges={BESTSELLER_BADGES}
      />
      <TrustStrip />
      <PromoPair />
      <MarqueeStrip />
      <ProductCarousel
        title="For your business"
        subtitle="Everything you need to build a professional brand"
        keys={BUSINESS_KEYS}
      />
      <IndustriesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  )
}
