import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { CATALOG_PRODUCTS } from './CatalogPage'

// ─── Product definitions ────────────────────────────────────────────────────

type FieldType = 'dropdown' | 'radio' | 'checkbox'
interface Field { label: string; type: FieldType; options: string[] }

interface Product {
  slug: string; name: string; category: string; description: string
  longDescription: string[]; highlights: string[]
  basePrice: number; images: string[]; badge?: string; fields: Field[]
}

const img = (id: string, w = 700, h = 500) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`

const MOCK_REVIEWS = [
  { name: 'Sara Al-Mansoori', rating: 5, date: 'Jul 2025', text: 'Exceptional quality — the card stock is thick and colours are vibrant. Delivered in 2 days!', location: 'Dubai' },
  { name: 'James Whitfield', rating: 5, date: 'Jun 2025', text: 'Very professional result. Our team loves the new branded material. Will order again.', location: 'Abu Dhabi' },
  { name: 'Priya Nair', rating: 4, date: 'Jun 2025', text: 'Great print quality and fast delivery. Slight delay in proofing but resolved quickly.', location: 'Sharjah' },
  { name: 'Mohamed Al-Rashidi', rating: 5, date: 'May 2025', text: 'Ordered 500 flyers for our opening. They looked amazing and we got tons of compliments!', location: 'Ajman' },
  { name: 'Lena Fischer', rating: 5, date: 'May 2025', text: 'Perfectly matched our brand colors. The matte finish looks premium.', location: 'Dubai' },
]

const PRODUCTS: Record<string, Product> = {
  'business-cards': {
    slug: 'business-cards', name: 'Business Cards', category: 'Business Cards',
    basePrice: 49, badge: 'Bestseller',
    description: 'Make a lasting first impression with premium business cards printed on 350 GSM silk-coated or uncoated stock.',
    longDescription: [
      "Our business cards are printed at 300 DPI on premium 350 GSM paper. Whether you prefer a clean matte look or a glossy sheen, we've got the finish for you.",
      'Available in standard, square, and rounded corner formats. Order in quantities from 50 to 5,000 with no compromise on quality.',
    ],
    highlights: ['350 GSM premium stock', '300 DPI precision print', '24-hr express available', 'Matte, gloss & soft-touch finishes', 'Free PDF proof before print'],
    images: [
      img('photo-1607082348824-0a96f2a4b9da'), img('photo-1553484771-371a605b060b'),
      img('photo-1572021335469-31706a17aaef'), img('photo-1583251633146-d0545dc1c7f5'), img('photo-1560179707-f14e90ef3623'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['Standard (85×55mm)', 'Square (55×55mm)', 'Mini (70×28mm)'] },
      { label: 'Finish', type: 'radio', options: ['Matte Laminate', 'Gloss Laminate', 'Soft Touch', 'Uncoated'] },
      { label: 'Quantity', type: 'dropdown', options: ['50 cards', '100 cards', '250 cards', '500 cards', '1000 cards', '2500 cards'] },
      { label: 'Turnaround', type: 'radio', options: ['Standard (3–5 days)', 'Express (24 hrs +AED 35)'] },
    ],
  },
  'letterhead': {
    slug: 'letterhead', name: 'Letterhead', category: 'Stationery',
    basePrice: 89,
    description: 'Professional branded letterheads on 100 GSM premium bond paper for all your corporate correspondence.',
    longDescription: [
      'Our letterheads are printed on 100 GSM bright-white bond, perfectly suited for laser or inkjet printing after delivery.',
      'Available as single or double-sided, with optional watermark. Ideal for proposals, contracts, and official communications.',
    ],
    highlights: ['100 GSM bright-white bond', 'Single or double sided', 'Optional watermark', 'Full-bleed printing', 'Quantities from 50 to 5000'],
    images: [
      img('photo-1586281380349-632531db7ed4'), img('photo-1456324504439-367cee3b3c32'),
      img('photo-1588681664899-f142ff2dc9b1'), img('photo-1497032628192-86f99bcd76bc'), img('photo-1527980965255-d3b416303d12'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['A4', 'A5', 'Letter (US)'] },
      { label: 'Print Sides', type: 'radio', options: ['Single-sided', 'Double-sided'] },
      { label: 'Quantity', type: 'dropdown', options: ['50 sheets', '100 sheets', '250 sheets', '500 sheets', '1000 sheets'] },
    ],
  },
  'flyers': {
    slug: 'flyers', name: 'Flyers', category: 'Marketing',
    basePrice: 35, badge: 'Popular',
    description: 'Eye-catching flyers printed on 170 GSM gloss paper. Perfect for promotions, events, and product launches.',
    longDescription: [
      'Stand out in any crowd with our high-impact flyers. Printed on premium 170 GSM gloss paper with rich, full-bleed colors.',
      'We support full CMYK color printing with a free PDF proof. Sizes from A6 to A4.',
    ],
    highlights: ['170 GSM gloss paper', 'Full CMYK color', 'A6, A5, A4 sizes', 'Free PDF proof', '48-hr standard turnaround'],
    images: [
      img('photo-1561070791-2526d30994b5'), img('photo-1542744173-8e7e53415bb0'),
      img('photo-1504711434969-e33886168f5c'), img('photo-1578575437130-527eed3abbec'), img('photo-1571988840519-a2f07af8d18a'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['A6 (Postcard)', 'A5 Half Page', 'A4 Full Page', 'DL (third A4)'] },
      { label: 'Finish', type: 'radio', options: ['Gloss', 'Matte', 'Silk'] },
      { label: 'Print Sides', type: 'radio', options: ['Single-sided', 'Double-sided'] },
      { label: 'Quantity', type: 'dropdown', options: ['100', '250', '500', '1000', '2500', '5000'] },
    ],
  },
  'brochures': {
    slug: 'brochures', name: 'Brochures', category: 'Marketing',
    basePrice: 120,
    description: 'Tri-fold and bi-fold brochures on premium 200 GSM stock that communicate your brand story beautifully.',
    longDescription: [
      'Perfect for sales packs, product catalogues or event handouts. Printed on 200 GSM silk and professionally folded to A4 or DL.',
      'Choose from bi-fold or tri-fold options with full-bleed printing inside and out.',
    ],
    highlights: ['200 GSM silk stock', 'Bi-fold & tri-fold', 'Full-bleed inside & out', 'A4 or DL folded size', '3–5 day turnaround'],
    images: [
      img('photo-1543269865-cbf427effbad'), img('photo-1524758631624-e2822e304c36'),
      img('photo-1497366811353-6870744d04b2'), img('photo-1578574577315-3fbeb0cecdc2'), img('photo-1542744094-3a31f272c490'),
    ],
    fields: [
      { label: 'Fold Type', type: 'radio', options: ['Bi-fold (2 panels)', 'Tri-fold (3 panels)', 'Z-fold (accordion)'] },
      { label: 'Finish', type: 'radio', options: ['Silk Gloss', 'Matte Laminate', 'High Gloss'] },
      { label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500', '1000'] },
    ],
  },
  'envelopes': {
    slug: 'envelopes', name: 'Envelopes', category: 'Stationery',
    basePrice: 65,
    description: 'Branded envelopes in DL, C5, and C4 sizes. Make every piece of mail feel premium.',
    longDescription: [
      'Our custom printed envelopes are produced on 90 GSM white wove or kraft paper and are compatible with standard postage.',
      'Available with full-color print on the front flap, back, or both sides.',
    ],
    highlights: ['90 GSM white wove or kraft', 'DL, C5, C4 sizes', 'Full-color print', 'Self-seal or gummed', 'MOQ 100 units'],
    images: [
      img('photo-1596526131083-e8c633c948d2'), img('photo-1579389083078-4e7018379f7e'),
      img('photo-1588681664899-f142ff2dc9b1'), img('photo-1497032628192-86f99bcd76bc'), img('photo-1527980965255-d3b416303d12'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['DL (110×220mm)', 'C5 (162×229mm)', 'C4 (229×324mm)'] },
      { label: 'Seal Type', type: 'radio', options: ['Self-seal peel & stick', 'Gummed (lick & seal)'] },
      { label: 'Print Area', type: 'radio', options: ['Front only', 'Front & back flap', 'Full wrap'] },
      { label: 'Quantity', type: 'dropdown', options: ['100', '250', '500', '1000', '2500'] },
    ],
  },
  'rollup-banners': {
    slug: 'rollup-banners', name: 'Roll-Up Banners', category: 'Signage',
    basePrice: 220,
    description: 'High-impact pull-up banners for exhibitions, showrooms, and events. Easy assembly, durable hardware.',
    longDescription: [
      'Our roll-up banners use a premium retractable aluminium base and are printed on 510 GSM satin-finish banner media.',
      'Available in standard, wide and compact sizes. Includes a carry bag and base.',
    ],
    highlights: ['510 GSM satin banner media', 'Aluminium retractable base', 'Includes carry bag', 'UV-resistant inks', '1–2 day turnaround'],
    images: [
      img('photo-1540575467063-178a50c2df87'), img('photo-1504711434969-e33886168f5c'),
      img('photo-1505373877841-8d25f7d46678'), img('photo-1478720568477-152d9b164e26'), img('photo-1559136555-9303baea8ebd'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['Standard 85×200cm', 'Wide 100×200cm', 'Compact 60×160cm'] },
      { label: 'Material', type: 'radio', options: ['Satin Banner (default)', 'Backlit Film (+AED 40)'] },
      { label: 'Quantity', type: 'dropdown', options: ['1', '2', '3', '5', '10'] },
    ],
  },
  'stickers': {
    slug: 'stickers', name: 'Stickers & Labels', category: 'Packaging',
    basePrice: 28,
    description: 'Custom die-cut stickers and product labels on premium vinyl or paper. Any shape, any size.',
    longDescription: [
      'Ideal for packaging, branding, events and giveaways. Our stickers are printed on durable vinyl with a waterproof finish — perfect for bottles, boxes, or laptops.',
      'Choose your shape: circle, square, rectangle, or custom die-cut. Gloss or matte laminate available.',
    ],
    highlights: ['Waterproof vinyl or paper stock', 'Die-cut to any shape', 'Gloss or matte finish', 'Indoor & outdoor durable', 'From 50 units'],
    images: [
      img('photo-1619462729353-b3e82d86f2e1'), img('photo-1572375992501-4b0892d50c69'),
      img('photo-1563694983011-6f4d90358083'), img('photo-1611532736597-de2d4265fba3'), img('photo-1576502200916-3808e07386a5'),
    ],
    fields: [
      { label: 'Shape', type: 'radio', options: ['Circle', 'Square', 'Rectangle', 'Custom die-cut'] },
      { label: 'Material', type: 'radio', options: ['Gloss Vinyl', 'Matte Vinyl', 'Kraft Paper', 'Clear Vinyl'] },
      { label: 'Size', type: 'dropdown', options: ['30mm', '50mm', '70mm', '100mm', 'Custom'] },
      { label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500', '1000', '2500'] },
    ],
  },
  'notebooks': {
    slug: 'notebooks', name: 'Notebooks', category: 'Stationery',
    basePrice: 95,
    description: 'Branded A5 hardcover notebooks with 96 ruled pages. A premium corporate gift that lasts all year.',
    longDescription: [
      'Hardcover A5 notebooks with a smooth printed cover and 96 sheets of 80 GSM ruled inner pages.',
      'Perfect for corporate gifting, conferences, and onboarding kits. Includes a ribbon bookmark and elastic closure.',
    ],
    highlights: ['A5 hardcover format', '96 ruled inner pages (80 GSM)', 'Ribbon bookmark included', 'Elastic closure band', 'Minimum 25 units'],
    images: [
      img('photo-1544816155-12df9643f363'), img('photo-1531346680769-a1d79b57de5c'),
      img('photo-1456324504439-367cee3b3c32'), img('photo-1512820790803-83ca734da794'), img('photo-1585776245991-cf89dd7fc73a'),
    ],
    fields: [
      { label: 'Cover Finish', type: 'radio', options: ['Soft Touch Matte', 'Gloss Laminate', 'Recycled Kraft'] },
      { label: 'Inner Pages', type: 'radio', options: ['Ruled lines', 'Plain / blank', 'Dotted grid'] },
      { label: 'Quantity', type: 'dropdown', options: ['25', '50', '100', '250', '500'] },
    ],
  },
}

const DEFAULT_PRODUCT: Product = {
  slug: '', name: 'Custom Print Product', category: 'Printing',
  basePrice: 49,
  description: 'High-quality custom print product.',
  longDescription: ['Premium quality printing delivered across UAE.'],
  highlights: ['Fast delivery', 'Premium quality', 'Free PDF proof'],
  images: [img('photo-1607082348824-0a96f2a4b9da')],
  fields: [{ label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500'] }],
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1,2,3,4,5].map(n => (
          <svg key={n} width="15" height="15" viewBox="0 0 16 16" fill={n <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'}>
            <path d="M8 1.5l1.8 3.9 4.2.5-3.1 2.9.8 4.1L8 10.8l-3.7 2.1.8-4.1L2 5.9l4.2-.5z"/>
          </svg>
        ))}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>{rating}</span>
      {count && <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui' }}>({count.toLocaleString()} reviews)</span>}
    </div>
  )
}

function RatingBar({ label, val }: { label: string; val: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', width: 44, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${val}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', width: 30, textAlign: 'right' }}>{val}%</span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const product = (slug && PRODUCTS[slug]) ? PRODUCTS[slug] : DEFAULT_PRODUCT

  const [activeImg, setActiveImg] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(100)
  const [notes, setNotes] = useState('')
  const [addedToCart, setAddedToCart] = useState(false)

  const unitPriceDisplay = Math.round(product.basePrice * Math.max(1, qty / 100))

  function handleAddToCart() {
    addItem({
      id: `${product.slug}::${JSON.stringify(selections)}`,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      options: Object.values(selections).filter(Boolean),
      qty: 1,
      unitPrice: unitPriceDisplay,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  function handleBuyNow() {
    addItem({
      id: `${product.slug}::${JSON.stringify(selections)}`,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      options: Object.values(selections).filter(Boolean),
      qty: 1,
      unitPrice: unitPriceDisplay,
    })
    navigate('/checkout')
  }

  const related = CATALOG_PRODUCTS.filter(p => p.slug !== product.slug).slice(0, 5)

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link to="/" style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: '#CBD5E1', fontSize: 13 }}>/</span>
        <Link to="/catalog" style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', textDecoration: 'none' }}>All Products</Link>
        <span style={{ color: '#CBD5E1', fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: '#0F172A', fontFamily: 'system-ui', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main two-column layout */}
      <div className="stor-product-layout" style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px 48px' }}>

        {/* LEFT — Image gallery */}
        <div>
          {/* Main image */}
          <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 12, aspectRatio: '4/3', position: 'relative' }}>
            {product.badge && (
              <div style={{
                position: 'absolute', top: 16, left: 16, zIndex: 2,
                backgroundColor: product.badge === 'Popular' ? '#F59E0B' : '#1D4ED8',
                color: 'white', borderRadius: 6, padding: '4px 12px',
                fontSize: 12, fontWeight: 700, fontFamily: 'system-ui',
              }}>{product.badge}</div>
            )}
            <img
              src={imgErrors[activeImg] ? img('photo-1607082348824-0a96f2a4b9da') : product.images[activeImg]}
              alt={product.name}
              onError={() => setImgErrors(prev => ({ ...prev, [activeImg]: true }))}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Thumbnail strip */}
          <div className="stor-thumb-strip">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setActiveImg(i)} style={{
                width: 80, height: 70, borderRadius: 10, overflow: 'hidden', border: 'none',
                outline: `2.5px solid ${i === activeImg ? '#1D4ED8' : 'transparent'}`,
                outlineOffset: 2, cursor: 'pointer', padding: 0, flexShrink: 0,
                transition: 'outline 0.15s ease',
              }}>
                <img
                  src={imgErrors[i] ? img('photo-1607082348824-0a96f2a4b9da') : src}
                  alt=""
                  onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '🚀', label: '24–48 hr turnaround' },
              { icon: '🎨', label: 'Free PDF proof' },
              { icon: '✅', label: 'Quality guaranteed' },
              { icon: '🔒', label: 'Secure checkout' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'white', borderRadius: 8, padding: '8px 14px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: 'system-ui' }}>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Long description */}
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 14 }}>Product Details</h2>
            {product.longDescription.map((para, i) => (
              <p key={i} style={{ fontSize: 15, color: '#334155', fontFamily: 'system-ui', lineHeight: 1.75, marginBottom: 12 }}>{para}</p>
            ))}

            <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 16, color: '#0F172A', marginTop: 24, marginBottom: 12 }}>Why customers love it</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {product.highlights.map(h => (
                <li key={h} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155', fontFamily: 'system-ui' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews */}
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 20 }}>Customer Reviews</h2>

            {/* Aggregate */}
            <div style={{ display: 'flex', gap: 32, backgroundColor: 'white', borderRadius: 14, padding: '24px 28px', border: '1px solid #E2E8F0', marginBottom: 24, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui", lineHeight: 1 }}>4.8</div>
                <Stars rating={4.8} />
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', marginTop: 4 }}>3,256 reviews</div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <RatingBar label="5 stars" val={82} />
                <RatingBar label="4 stars" val={12} />
                <RatingBar label="3 stars" val={4} />
                <RatingBar label="2 stars" val={1} />
                <RatingBar label="1 star" val={1} />
              </div>
            </div>

            {/* Individual reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {MOCK_REVIEWS.map((r, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', fontFamily: 'system-ui' }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui' }}>{r.location} · {r.date}</div>
                    </div>
                    <Stars rating={r.rating} />
                  </div>
                  <p style={{ fontSize: 14, color: '#334155', fontFamily: 'system-ui', lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Config panel */}
        <div className="stor-config-panel">
          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '28px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

            {/* Category + title */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'system-ui', marginBottom: 6 }}>
              {product.category}
            </div>
            <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 26, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ marginBottom: 14 }}>
              <Stars rating={4.8} count={3256} />
            </div>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>AED {unitPriceDisplay}</span>
              <span style={{ fontSize: 14, color: '#64748B', fontFamily: 'system-ui', marginLeft: 8 }}>incl. 5% VAT</span>
            </div>

            <p style={{ fontSize: 14, color: '#475569', fontFamily: 'system-ui', lineHeight: 1.6, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F1F5F9' }}>
              {product.description}
            </p>

            {/* Fields */}
            {product.fields.map(field => (
              <div key={field.label} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'system-ui', marginBottom: 8 }}>
                  {field.label}
                  {selections[field.label] && (
                    <span style={{ fontWeight: 400, color: '#1D4ED8', marginLeft: 8 }}>— {selections[field.label]}</span>
                  )}
                </label>

                {field.type === 'dropdown' ? (
                  <select value={selections[field.label] || ''} onChange={e => setSelections(prev => ({ ...prev, [field.label]: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      border: `1.5px solid ${selections[field.label] ? '#1D4ED8' : '#E2E8F0'}`,
                      fontSize: 14, fontFamily: 'system-ui', color: '#0F172A',
                      backgroundColor: 'white', cursor: 'pointer',
                    }}>
                    <option value="">Select {field.label.toLowerCase()}…</option>
                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {field.options.map(o => {
                      const selected = selections[field.label] === o
                      return (
                        <button key={o} onClick={() => setSelections(prev => ({ ...prev, [field.label]: o }))}
                          style={{
                            padding: '8px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui',
                            fontWeight: selected ? 700 : 500,
                            border: `1.5px solid ${selected ? '#1D4ED8' : '#E2E8F0'}`,
                            backgroundColor: selected ? '#EFF6FF' : 'white',
                            color: selected ? '#1D4ED8' : '#334155',
                            transition: 'all 0.12s ease',
                          }}>
                          {o}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Qty stepper */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'system-ui', marginBottom: 8 }}>Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
                <button onClick={() => setQty(q => Math.max(50, q - 50))}
                  style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#0F172A', fontWeight: 700 }}>−</button>
                <span style={{ padding: '0 20px', fontSize: 15, fontWeight: 700, fontFamily: 'system-ui', color: '#0F172A' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 50)}
                  style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 18, color: '#0F172A', fontWeight: 700 }}>+</button>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', fontFamily: 'system-ui', marginBottom: 8 }}>
                Print Notes <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Pantone color refs, bleed requirements, special instructions…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                  border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'system-ui',
                  color: '#0F172A', resize: 'vertical', outline: 'none',
                }} />
            </div>

            {/* CTAs */}
            <button onClick={handleAddToCart} style={{
              width: '100%', padding: '15px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: addedToCart ? '#10B981' : '#16A34A', color: 'white',
              fontSize: 16, fontWeight: 700, fontFamily: "'Poppins', system-ui",
              marginBottom: 10, transition: 'background-color 0.2s ease',
            }}>
              {addedToCart ? '✓ Added to Cart!' : `Add to Cart — AED ${unitPriceDisplay}`}
            </button>
            <button onClick={handleBuyNow} style={{
              width: '100%', padding: '13px 20px', borderRadius: 10,
              border: '2px solid #0F172A', cursor: 'pointer',
              backgroundColor: 'transparent', color: '#0F172A',
              fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', system-ui",
              marginBottom: 10,
            }}>
              Buy Now
            </button>
            <Link to="/editor" style={{
              display: 'block', textAlign: 'center', padding: '13px 20px', borderRadius: 10,
              border: '2px solid #E2E8F0', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui',
              color: '#64748B', textDecoration: 'none',
            }}>
              🎨 Design it yourself in our editor
            </Link>

            {/* Delivery */}
            <div style={{ marginTop: 18, padding: '14px 16px', backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 9l3 3 6-7" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'system-ui' }}>Free delivery across UAE</span>
              </div>
              <p style={{ fontSize: 12, color: '#15803D', fontFamily: 'system-ui', margin: '6px 0 0' }}>
                Estimated: 24–48 hrs after proof approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 32px 60px' }}>
        <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 22, color: '#0F172A', marginBottom: 20 }}>
          You may also need
        </h2>
        <div className="stor-related-grid">
          {related.map(p => (
            <Link key={p.id} to={`/products/${p.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: 'white', borderRadius: 12, overflow: 'hidden',
                border: '1px solid #E2E8F0', transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.border = '1.5px solid #1D4ED8'
                  el.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.border = '1px solid #E2E8F0'
                  el.style.transform = 'none'
                }}
              >
                <div style={{ height: 130, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = p.fallback }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui', marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#1D4ED8', fontFamily: 'system-ui', fontWeight: 600 }}>From AED {p.basePrice}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
