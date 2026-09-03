import { useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { CATALOG_PRODUCTS } from './CatalogPage'

// Storefront product slugs that have a working in-browser design editor (pen not built yet)
const EDITOR_TEMPLATE: Record<string, string> = {
  'business-cards': 'business_card',
  'letterhead':     'letterhead',
}

type FieldType = 'dropdown' | 'radio' | 'checkbox'
interface Field { label: string; type: FieldType; options: string[] }
interface Product {
  slug: string; name: string; category: string; description: string
  longDescription: string[]; highlights: string[]; careInstructions?: string[]
  basePrice: number; images: string[]; badge?: string; fields: Field[]
}

const img = (id: string, w = 700, h = 500) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`

const MOCK_REVIEWS = [
  { name: 'Sara Al-Mansoori', rating: 5, date: 'Jul 2025', text: 'Exceptional quality — the card stock is thick and colours are vibrant. Delivered in 2 days!', location: 'Dubai', verified: true },
  { name: 'James Whitfield',  rating: 5, date: 'Jun 2025', text: 'Very professional result. Our team loves the new branded material. Will order again.', location: 'Abu Dhabi', verified: true },
  { name: 'Priya Nair',       rating: 4, date: 'Jun 2025', text: 'Great print quality and fast delivery. Slight delay in proofing but resolved quickly.', location: 'Sharjah', verified: false },
  { name: 'Mohamed Al-Rashidi', rating: 5, date: 'May 2025', text: 'Ordered 500 flyers for our opening. They looked amazing and we got tons of compliments!', location: 'Ajman', verified: true },
  { name: 'Lena Fischer',     rating: 5, date: 'May 2025', text: 'Perfectly matched our brand colors. The matte finish looks premium.', location: 'Dubai', verified: true },
]

const FAQ_ITEMS = [
  { q: 'What file formats do you accept?', a: 'We accept PDF, AI, EPS, PNG, and JPEG. For best results, supply print-ready PDFs at 300 DPI with 3mm bleed on all sides.' },
  { q: 'Will I see a proof before printing?', a: 'Yes — every order includes a free digital PDF proof. Production only begins once you have approved the proof.' },
  { q: 'Can I customise the design myself?', a: 'Absolutely. Use our online editor to build your design from scratch, or upload your own artwork. We also offer a professional design service.' },
  { q: 'What is your delivery timeframe?', a: 'Standard turnaround is 3–5 business days after proof approval. Express 24-hr turnaround is available for most products at a small surcharge.' },
  { q: 'Do you ship across the UAE?', a: 'Yes, we offer free delivery to all emirates. Orders over AED 200 receive priority courier handling.' },
]

const PRODUCTS: Record<string, Product> = {
  'business-cards': {
    slug: 'business-cards', name: 'Business Cards', category: 'Business Cards',
    basePrice: 49, badge: 'Bestseller',
    description: 'Make a lasting first impression with premium business cards printed on 350 GSM silk-coated or uncoated stock.',
    longDescription: [
      'Our business cards are printed at 300 DPI on premium 350 GSM paper. Whether you prefer a clean matte look or a glossy sheen, we have the finish for you.',
      'Available in standard, square, and rounded corner formats. Order in quantities from 50 to 5,000 with no compromise on quality. Every order includes a free digital proof before we go to print.',
    ],
    highlights: ['350 GSM premium stock', '300 DPI precision print', '24-hr express available', 'Matte, gloss & soft-touch finishes', 'Free PDF proof before print'],
    careInstructions: ['Store flat in a dry place', 'Avoid direct sunlight for extended periods', 'Handle with clean hands to prevent smudging'],
    images: [
      img('photo-1607082348824-0a96f2a4b9da'), img('photo-1553484771-371a605b060b'),
      img('photo-1572021335469-31706a17aaef'), img('photo-1583251633146-d0545dc1c7f5'),
      img('photo-1560179707-f14e90ef3623'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['Standard (85×55mm)', 'Square (55×55mm)', 'Mini (70×28mm)'] },
      { label: 'Finish', type: 'radio', options: ['Matte Laminate', 'Gloss Laminate', 'Soft Touch', 'Uncoated'] },
      { label: 'Quantity', type: 'dropdown', options: ['50 cards', '100 cards', '250 cards', '500 cards', '1000 cards', '2500 cards'] },
      { label: 'Turnaround', type: 'radio', options: ['Standard (3–5 days)', 'Express (24 hrs +AED 35)'] },
    ],
  },
  'letterhead': {
    slug: 'letterhead', name: 'Letterhead', category: 'Stationery', basePrice: 89,
    description: 'Professional branded letterheads on 100 GSM premium bond paper for all your corporate correspondence.',
    longDescription: [
      'Our letterheads are printed on 100 GSM bright-white bond, perfectly suited for laser or inkjet printing after delivery.',
      'Available as single or double-sided, with optional watermark. Ideal for proposals, contracts, and official communications.',
    ],
    highlights: ['100 GSM bright-white bond', 'Single or double sided', 'Optional watermark', 'Full-bleed printing', 'Quantities from 50 to 5000'],
    images: [
      img('photo-1586281380349-632531db7ed4'), img('photo-1456324504439-367cee3b3c32'),
      img('photo-1588681664899-f142ff2dc9b1'), img('photo-1497032628192-86f99bcd76bc'),
      img('photo-1527980965255-d3b416303d12'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['A4', 'A5', 'Letter (US)'] },
      { label: 'Print Sides', type: 'radio', options: ['Single-sided', 'Double-sided'] },
      { label: 'Quantity', type: 'dropdown', options: ['50 sheets', '100 sheets', '250 sheets', '500 sheets', '1000 sheets'] },
    ],
  },
  'flyers': {
    slug: 'flyers', name: 'Flyers', category: 'Marketing', basePrice: 35, badge: 'Popular',
    description: 'Eye-catching flyers printed on 170 GSM gloss paper. Perfect for promotions, events, and product launches.',
    longDescription: [
      'Stand out in any crowd with our high-impact flyers. Printed on premium 170 GSM gloss paper with rich, full-bleed colors.',
      'We support full CMYK color printing with a free PDF proof. Sizes from A6 to A4.',
    ],
    highlights: ['170 GSM gloss paper', 'Full CMYK color', 'A6, A5, A4 sizes', 'Free PDF proof', '48-hr standard turnaround'],
    images: [
      img('photo-1561070791-2526d30994b5'), img('photo-1542744173-8e7e53415bb0'),
      img('photo-1504711434969-e33886168f5c'), img('photo-1578575437130-527eed3abbec'),
      img('photo-1571988840519-a2f07af8d18a'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['A6 (Postcard)', 'A5 Half Page', 'A4 Full Page', 'DL (third A4)'] },
      { label: 'Finish', type: 'radio', options: ['Gloss', 'Matte', 'Silk'] },
      { label: 'Print Sides', type: 'radio', options: ['Single-sided', 'Double-sided'] },
      { label: 'Quantity', type: 'dropdown', options: ['100', '250', '500', '1000', '2500', '5000'] },
    ],
  },
  'brochures': {
    slug: 'brochures', name: 'Brochures', category: 'Marketing', basePrice: 120,
    description: 'Tri-fold and bi-fold brochures on premium 200 GSM stock that communicate your brand story beautifully.',
    longDescription: [
      'Perfect for sales packs, product catalogues or event handouts. Printed on 200 GSM silk and professionally folded to A4 or DL.',
      'Choose from bi-fold or tri-fold options with full-bleed printing inside and out.',
    ],
    highlights: ['200 GSM silk stock', 'Bi-fold & tri-fold', 'Full-bleed inside & out', 'A4 or DL folded size', '3–5 day turnaround'],
    images: [
      img('photo-1543269865-cbf427effbad'), img('photo-1524758631624-e2822e304c36'),
      img('photo-1497366811353-6870744d04b2'), img('photo-1578574577315-3fbeb0cecdc2'),
      img('photo-1542744094-3a31f272c490'),
    ],
    fields: [
      { label: 'Fold Type', type: 'radio', options: ['Bi-fold (2 panels)', 'Tri-fold (3 panels)', 'Z-fold (accordion)'] },
      { label: 'Finish', type: 'radio', options: ['Silk Gloss', 'Matte Laminate', 'High Gloss'] },
      { label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500', '1000'] },
    ],
  },
  'envelopes': {
    slug: 'envelopes', name: 'Envelopes', category: 'Stationery', basePrice: 65,
    description: 'Branded envelopes in DL, C5, and C4 sizes. Make every piece of mail feel premium.',
    longDescription: [
      'Our custom printed envelopes are produced on 90 GSM white wove or kraft paper and are compatible with standard postage.',
      'Available with full-color print on the front flap, back, or both sides.',
    ],
    highlights: ['90 GSM white wove or kraft', 'DL, C5, C4 sizes', 'Full-color print', 'Self-seal or gummed', 'MOQ 100 units'],
    images: [
      img('photo-1596526131083-e8c633c948d2'), img('photo-1579389083078-4e7018379f7e'),
      img('photo-1588681664899-f142ff2dc9b1'), img('photo-1497032628192-86f99bcd76bc'),
      img('photo-1527980965255-d3b416303d12'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['DL (110×220mm)', 'C5 (162×229mm)', 'C4 (229×324mm)'] },
      { label: 'Seal Type', type: 'radio', options: ['Self-seal peel & stick', 'Gummed (lick & seal)'] },
      { label: 'Print Area', type: 'radio', options: ['Front only', 'Front & back flap', 'Full wrap'] },
      { label: 'Quantity', type: 'dropdown', options: ['100', '250', '500', '1000', '2500'] },
    ],
  },
  'rollup-banners': {
    slug: 'rollup-banners', name: 'Roll-Up Banners', category: 'Signage', basePrice: 220,
    description: 'High-impact pull-up banners for exhibitions, showrooms, and events. Easy assembly, durable hardware.',
    longDescription: [
      'Our roll-up banners use a premium retractable aluminium base and are printed on 510 GSM satin-finish banner media.',
      'Available in standard, wide and compact sizes. Includes a carry bag and base.',
    ],
    highlights: ['510 GSM satin banner media', 'Aluminium retractable base', 'Includes carry bag', 'UV-resistant inks', '1–2 day turnaround'],
    images: [
      img('photo-1540575467063-178a50c2df87'), img('photo-1504711434969-e33886168f5c'),
      img('photo-1505373877841-8d25f7d46678'), img('photo-1478720568477-152d9b164e26'),
      img('photo-1559136555-9303baea8ebd'),
    ],
    fields: [
      { label: 'Size', type: 'radio', options: ['Standard 85×200cm', 'Wide 100×200cm', 'Compact 60×160cm'] },
      { label: 'Material', type: 'radio', options: ['Satin Banner (default)', 'Backlit Film (+AED 40)'] },
      { label: 'Quantity', type: 'dropdown', options: ['1', '2', '3', '5', '10'] },
    ],
  },
  'stickers': {
    slug: 'stickers', name: 'Stickers & Labels', category: 'Packaging', basePrice: 28,
    description: 'Custom die-cut stickers and product labels on premium vinyl or paper. Any shape, any size.',
    longDescription: [
      'Ideal for packaging, branding, events and giveaways. Our stickers are printed on durable vinyl with a waterproof finish — perfect for bottles, boxes, or laptops.',
      'Choose your shape: circle, square, rectangle, or custom die-cut. Gloss or matte laminate available.',
    ],
    highlights: ['Waterproof vinyl or paper stock', 'Die-cut to any shape', 'Gloss or matte finish', 'Indoor & outdoor durable', 'From 50 units'],
    images: [
      img('photo-1619462729353-b3e82d86f2e1'), img('photo-1572375992501-4b0892d50c69'),
      img('photo-1563694983011-6f4d90358083'), img('photo-1611532736597-de2d4265fba3'),
      img('photo-1576502200916-3808e07386a5'),
    ],
    fields: [
      { label: 'Shape', type: 'radio', options: ['Circle', 'Square', 'Rectangle', 'Custom die-cut'] },
      { label: 'Material', type: 'radio', options: ['Gloss Vinyl', 'Matte Vinyl', 'Kraft Paper', 'Clear Vinyl'] },
      { label: 'Size', type: 'dropdown', options: ['30mm', '50mm', '70mm', '100mm', 'Custom'] },
      { label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500', '1000', '2500'] },
    ],
  },
  'notebooks': {
    slug: 'notebooks', name: 'Notebooks', category: 'Stationery', basePrice: 95,
    description: 'Branded A5 hardcover notebooks with 96 ruled pages. A premium corporate gift that lasts all year.',
    longDescription: [
      'Hardcover A5 notebooks with a smooth printed cover and 96 sheets of 80 GSM ruled inner pages.',
      'Perfect for corporate gifting, conferences, and onboarding kits. Includes a ribbon bookmark and elastic closure.',
    ],
    highlights: ['A5 hardcover format', '96 ruled inner pages (80 GSM)', 'Ribbon bookmark included', 'Elastic closure band', 'Minimum 25 units'],
    images: [
      img('photo-1544816155-12df9643f363'), img('photo-1531346680769-a1d79b57de5c'),
      img('photo-1456324504439-367cee3b3c32'), img('photo-1512820790803-83ca734da794'),
      img('photo-1585776245991-cf89dd7fc73a'),
    ],
    fields: [
      { label: 'Cover Finish', type: 'radio', options: ['Soft Touch Matte', 'Gloss Laminate', 'Recycled Kraft'] },
      { label: 'Inner Pages', type: 'radio', options: ['Ruled lines', 'Plain / blank', 'Dotted grid'] },
      { label: 'Quantity', type: 'dropdown', options: ['25', '50', '100', '250', '500'] },
    ],
  },
}

const DEFAULT_PRODUCT: Product = {
  slug: '', name: 'Custom Print Product', category: 'Printing', basePrice: 49,
  description: 'High-quality custom print product.',
  longDescription: ['Premium quality printing delivered across UAE.'],
  highlights: ['Fast delivery', 'Premium quality', 'Free PDF proof'],
  images: [img('photo-1607082348824-0a96f2a4b9da')],
  fields: [{ label: 'Quantity', type: 'dropdown', options: ['50', '100', '250', '500'] }],
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="6.5" fill="#D1FAE5"/>
    <path d="M3.5 6.5l2 2 4-4" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const StarFilled = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill={color}>
    <path d="M8 1.5l1.8 3.9 4.2.5-3.1 2.9.8 4.1L8 10.8l-3.7 2.1.8-4.1L2 5.9l4.2-.5z"/>
  </svg>
)
const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
)
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ── Sub-components ────────────────────────────────────────────────────────────
function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ display: 'flex', gap: 1 }}>
        {[1,2,3,4,5].map(n => <StarFilled key={n} color={n <= Math.round(rating) ? '#F59E0B' : '#E2E8F0'} />)}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui' }}>{rating}</span>
      {count && <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui' }}>({count.toLocaleString()} reviews)</span>}
    </div>
  )
}

function RatingBar({ label, val }: { label: string; val: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', width: 44, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${val}%`, height: '100%', backgroundColor: '#F59E0B', borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', width: 30, textAlign: 'right' }}>{val}%</span>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="pdp-faq-item">
      <button className="pdp-faq-btn" onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <ChevronDown open={open} />
      </button>
      {open && <div className="pdp-faq-body">{a}</div>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate  = useNavigate()
  const { addItem } = useCart()

  const product = (slug && PRODUCTS[slug]) ? PRODUCTS[slug] : DEFAULT_PRODUCT

  const [activeImg, setActiveImg]     = useState(0)
  const [imgErrors, setImgErrors]     = useState<Record<number, boolean>>({})
  const [selections, setSelections]   = useState<Record<string, string>>({})
  const [qty, setQty]                 = useState(100)
  const [notes, setNotes]             = useState('')

  const price = Math.round(product.basePrice * Math.max(1, qty / 100))

  const editorKey  = EDITOR_TEMPLATE[product.slug]
  const designable = !!editorKey
  const fileRef    = useRef<HTMLInputElement>(null)
  const pendingDest = useRef<'cart' | 'checkout'>('cart')

  const addLine = (extraOptions: string[] = []) => addItem({
    id: `${product.slug}::${JSON.stringify(selections)}::${Date.now()}`,
    slug: product.slug, name: product.name, image: product.images[0],
    options: [...Object.values(selections).filter(Boolean), ...extraOptions], qty: 1, unitPrice: price,
  })

  // Designable products: go straight to the editor (→ review → auto-added to cart)
  function handleDesignIt() { navigate(`/editor?product=${editorKey}`) }

  // Non-designable products: pick a file, then add to cart / go to checkout
  function startUpload(dest: 'cart' | 'checkout') { pendingDest.current = dest; fileRef.current?.click() }
  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    addLine([`Design file: ${f.name}`])
    e.target.value = ''
    navigate(pendingDest.current === 'checkout' ? '/checkout' : '/cart')
  }

  const related = CATALOG_PRODUCTS.filter(p => p.slug !== product.slug).slice(0, 6)
  const fbt     = CATALOG_PRODUCTS.filter(p => p.slug !== product.slug).slice(6, 11)

  const fallback = img('photo-1607082348824-0a96f2a4b9da')

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Breadcrumb ── */}
      <div className="pdp-wrap" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/" style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', textDecoration: 'none' }}>Home</Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <Link to="/catalog" style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', textDecoration: 'none' }}>All Products</Link>
          <span style={{ color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: 13, color: '#0F172A', fontFamily: 'system-ui', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      {/* ── Main two-column ── */}
      <div className="pdp-wrap">
        <div className="pdp-main">

          {/* LEFT ── gallery + details + reviews */}
          <div>

            {/* Main image */}
            <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', aspectRatio: '4/3', position: 'relative' }}>
              {product.badge && (
                <div style={{
                  position: 'absolute', top: 14, left: 14, zIndex: 2,
                  backgroundColor: product.badge === 'Popular' ? '#F59E0B' : '#1D4ED8',
                  color: 'white', borderRadius: 6, padding: '4px 12px',
                  fontSize: 12, fontWeight: 700, fontFamily: "'Poppins', system-ui",
                }}>{product.badge}</div>
              )}
              <img
                src={imgErrors[activeImg] ? fallback : product.images[activeImg]}
                alt={product.name}
                onError={() => setImgErrors(p => ({ ...p, [activeImg]: true }))}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>

            {/* Thumbnails */}
            <div className="pdp-thumbs">
              {product.images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{
                  width: 76, height: 66, borderRadius: 10, overflow: 'hidden', border: 'none', padding: 0,
                  outline: `2.5px solid ${i === activeImg ? '#1D4ED8' : 'transparent'}`,
                  outlineOffset: 2, cursor: 'pointer', flexShrink: 0,
                }}>
                  <img src={imgErrors[i] ? fallback : src} alt="" onError={() => setImgErrors(p => ({ ...p, [i]: true }))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { Icon: ClockIcon, label: '24–48 hr turnaround' },
                { Icon: FileIcon,  label: 'Free PDF proof' },
                { Icon: ShieldIcon,label: 'Quality guaranteed' },
                { Icon: TruckIcon, label: 'Free UAE delivery' },
              ].map(({ Icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'white', borderRadius: 8, padding: '8px 14px', border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#1D4ED8', display: 'flex' }}><Icon /></span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', fontFamily: 'system-ui' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Product Details */}
            <div style={{ marginTop: 44 }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 14 }}>
                Get superior results with {product.name.toLowerCase()}
              </h2>
              {product.longDescription.map((para, i) => (
                <p key={i} style={{ fontSize: 15, color: '#334155', fontFamily: 'system-ui', lineHeight: 1.8, marginBottom: 14 }}>{para}</p>
              ))}

              <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', marginTop: 24, marginBottom: 12 }}>Highlights</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {product.highlights.map(h => (
                  <li key={h} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155', fontFamily: 'system-ui' }}>
                    <CheckIcon />{h}
                  </li>
                ))}
              </ul>

              {product.careInstructions && (
                <>
                  <h3 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 15, color: '#0F172A', marginTop: 28, marginBottom: 10 }}>Care Instructions</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {product.careInstructions.map(c => (
                      <li key={c} style={{ fontSize: 14, color: '#475569', fontFamily: 'system-ui', paddingLeft: 14, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: '#CBD5E1' }}>·</span>{c}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Reviews */}
            <div style={{ marginTop: 52 }}>
              <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 6 }}>Reviews</h2>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 20 }}>
                <Stars rating={4.8} /><span style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', marginLeft: 4 }}>3,256 verified reviews</span>
              </div>

              {/* Aggregate */}
              <div style={{ display: 'flex', gap: 32, backgroundColor: 'white', borderRadius: 14, padding: '22px 26px', border: '1px solid #E2E8F0', marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui", lineHeight: 1 }}>4.8</div>
                  <div style={{ marginTop: 6 }}><Stars rating={4.8} /></div>
                  <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', marginTop: 4 }}>out of 5</div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <RatingBar label="5 stars" val={82} />
                  <RatingBar label="4 stars" val={12} />
                  <RatingBar label="3 stars" val={4} />
                  <RatingBar label="2 stars" val={1} />
                  <RatingBar label="1 star"  val={1} />
                </div>
              </div>

              {/* Review cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {MOCK_REVIEWS.map((r, i) => (
                  <div key={i} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #E2E8F0', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', fontFamily: 'system-ui' }}>{r.name}</span>
                          {r.verified && <span style={{ fontSize: 11, background: '#D1FAE5', color: '#065F46', borderRadius: 4, padding: '2px 7px', fontFamily: 'system-ui', fontWeight: 600 }}>Verified</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui', marginTop: 2 }}>{r.location} · {r.date}</div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p style={{ fontSize: 14, color: '#334155', fontFamily: 'system-ui', lineHeight: 1.65, margin: 0 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT ── sticky config panel */}
          <div className="pdp-panel">
            <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'system-ui', marginBottom: 6 }}>
                {product.category}
              </div>
              <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 24, color: '#0F172A', margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {product.name}
              </h1>

              <div style={{ marginBottom: 14 }}><Stars rating={4.8} count={3256} /></div>

              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>AED {price}</span>
                <span style={{ fontSize: 13, color: '#64748B', fontFamily: 'system-ui', marginLeft: 8 }}>incl. 5% VAT</span>
              </div>

              <p style={{ fontSize: 14, color: '#475569', fontFamily: 'system-ui', lineHeight: 1.65, marginBottom: 20, paddingBottom: 18, borderBottom: '1px solid #F1F5F9' }}>
                {product.description}
              </p>

              {/* Fields */}
              {product.fields.map(field => (
                <div key={field.label} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui", marginBottom: 8 }}>
                    {field.label}
                    {selections[field.label] && <span style={{ fontWeight: 400, color: '#1D4ED8', marginLeft: 6 }}>— {selections[field.label]}</span>}
                  </label>
                  {field.type === 'dropdown' ? (
                    <select value={selections[field.label] || ''} onChange={e => setSelections(p => ({ ...p, [field.label]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${selections[field.label] ? '#1D4ED8' : '#E2E8F0'}`, fontSize: 14, fontFamily: 'system-ui', color: '#0F172A', backgroundColor: 'white', cursor: 'pointer', outline: 'none' }}>
                      <option value="">Select {field.label.toLowerCase()}…</option>
                      {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                      {field.options.map(o => {
                        const sel = selections[field.label] === o
                        return (
                          <button key={o} onClick={() => setSelections(p => ({ ...p, [field.label]: o }))} style={{
                            padding: '7px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui',
                            fontWeight: sel ? 700 : 400,
                            border: `1.5px solid ${sel ? '#1D4ED8' : '#E2E8F0'}`,
                            backgroundColor: sel ? '#EFF6FF' : '#F8FAFC',
                            color: sel ? '#1D4ED8' : '#475569',
                            transition: 'all 0.12s ease',
                          }}>{o}</button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Qty stepper */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui", marginBottom: 8 }}>Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E2E8F0', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
                  <button onClick={() => setQty(q => Math.max(50, q - 50))} style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 20, color: '#0F172A', fontWeight: 700 }}>−</button>
                  <span style={{ padding: '0 20px', fontSize: 15, fontWeight: 700, fontFamily: 'system-ui', color: '#0F172A' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 50)} style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', border: 'none', cursor: 'pointer', fontSize: 20, color: '#0F172A', fontWeight: 700 }}>+</button>
                </div>
              </div>

              {/* Print notes */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui", marginBottom: 8 }}>
                  Print Notes <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  placeholder="Pantone refs, bleed requirements, special instructions…"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'system-ui', color: '#0F172A', resize: 'vertical', outline: 'none', backgroundColor: '#FAFAFA' }} />
              </div>

              {/* CTAs — designable products go to the editor; others upload a file */}
              <input ref={fileRef} type="file" accept="image/*,application/pdf,.ai,.psd,.eps" onChange={handleFileChosen} style={{ display: 'none' }} />
              {designable ? (
                <button onClick={handleDesignIt} className="stor-btn-primary" style={{
                  width: '100%', padding: '15px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: '#1D4ED8', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', system-ui", marginBottom: 20,
                }}>
                  <PencilIcon /> Design it — AED {price}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => startUpload('checkout')} className="stor-btn-primary" style={{
                    width: '100%', padding: '15px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: '#1D4ED8', color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', system-ui",
                  }}>
                    <UploadIcon /> Upload design &amp; Checkout — AED {price}
                  </button>
                  <button onClick={() => startUpload('cart')} style={{
                    width: '100%', padding: '13px 20px', borderRadius: 10, border: '2px solid #0F172A', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: 'transparent', color: '#0F172A', fontSize: 14, fontWeight: 700, fontFamily: "'Poppins', system-ui",
                  }}>
                    <UploadIcon /> Upload design &amp; Add to Cart
                  </button>
                </div>
              )}

              {/* Delivery notice */}
              <div style={{ padding: '13px 16px', backgroundColor: '#F0FDF4', borderRadius: 10, border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#16A34A', display: 'flex' }}><TruckIcon /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', fontFamily: 'system-ui' }}>Free delivery across UAE</span>
                </div>
                <p style={{ fontSize: 12, color: '#15803D', fontFamily: 'system-ui', margin: '5px 0 0' }}>
                  Estimated: 24–48 hrs after proof approval
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Related Products ── */}
        <div style={{ paddingBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', margin: 0 }}>You may also need</h2>
            <Link to="/catalog" style={{ fontSize: 13, color: '#1D4ED8', fontFamily: 'system-ui', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
          </div>
          <div className="pdp-hscroll">
            {related.map(p => (
              <div key={p.id} className="pdp-hscroll-card" onClick={() => navigate(`/products/${p.slug}`)}>
                <div style={{ height: 120, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <img src={p.image} alt={p.name} onError={e => { (e.currentTarget as HTMLImageElement).src = p.fallback }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui', marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#1D4ED8', fontFamily: 'system-ui', fontWeight: 600 }}>From AED {p.basePrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Frequently bought together ── */}
        {fbt.length > 0 && (
          <div style={{ paddingBottom: 56 }}>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 18, marginTop: 0 }}>Frequently bought together</h2>
            <div className="pdp-hscroll">
              {fbt.map(p => (
                <div key={p.id} className="pdp-hscroll-card" onClick={() => navigate(`/products/${p.slug}`)}>
                  <div style={{ height: 120, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                    <img src={p.image} alt={p.name} onError={e => { (e.currentTarget as HTMLImageElement).src = p.fallback }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', fontFamily: 'system-ui', marginBottom: 3 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#1D4ED8', fontFamily: 'system-ui', fontWeight: 600 }}>From AED {p.basePrice}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Design it for you banner ── */}
        <div style={{
          borderRadius: 20, overflow: 'hidden', marginBottom: 56,
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #3B82F6 100%)',
          padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'system-ui', marginBottom: 10 }}>Professional Design Service</div>
            <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 800, fontSize: 26, color: 'white', margin: '0 0 12px', lineHeight: 1.2 }}>
              Let us design it for you
            </h2>
            <p style={{ fontSize: 15, color: '#BFDBFE', fontFamily: 'system-ui', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 480 }}>
              Our expert designers will craft a print-ready design tailored to your brand. Share your brief, logo, and colors — we handle the rest, from first concept to final files.
            </p>
            <button style={{
              padding: '13px 28px', borderRadius: 10, border: '2px solid white', cursor: 'pointer',
              backgroundColor: 'white', color: '#1D4ED8',
              fontSize: 14, fontWeight: 700, fontFamily: "'Poppins', system-ui",
            }}>
              Find out more
            </button>
          </div>
          <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ paddingBottom: 72 }}>
          <h2 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', marginBottom: 4, marginTop: 0 }}>Frequently asked questions</h2>
          <p style={{ fontSize: 14, color: '#64748B', fontFamily: 'system-ui', marginBottom: 24 }}>Everything you need to know about ordering with us.</p>
          <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #E2E8F0', padding: '0 24px' }}>
            {FAQ_ITEMS.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
