import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCatalog, catalogImageUrl } from '../../lib/api'

// Preferred tab order for the known catalog categories; any other category the
// admin creates is appended alphabetically. The actual tab list is derived from
// the live products at runtime (see `categories` below) so it never desyncs.
const CATEGORY_ORDER = ['Business Cards', 'Stationery', 'Marketing', 'Packaging', 'Signage', 'Apparel & Gifts']

// Reliable Unsplash fallbacks — second entry used if first fails
const img = (id: string, w = 600, h = 380) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`

export interface CatalogCard {
  id: string; slug: string; name: string; category: string; basePrice: number
  badge?: string; description: string; image: string; fallback: string
}

// Mock catalog — kept as the offline fallback (and reused by ProductDetailPage for
// marketing copy). Live data from the backend replaces this at runtime when available.
export const CATALOG_PRODUCTS: CatalogCard[] = [
  {
    id: '1', slug: 'business-cards', name: 'Business Cards', category: 'Business Cards', basePrice: 49, badge: 'Bestseller',
    description: 'Premium 350 GSM cards with sharp 300 DPI print. Multiple finishes available.',
    image: img('photo-1607082348824-0a96f2a4b9da'),
    fallback: img('photo-1553484771-371a605b060b'),
  },
  {
    id: '2', slug: 'letterhead', name: 'Letterhead', category: 'Stationery', basePrice: 89,
    description: 'Professional letterheads for corporate correspondence on premium paper.',
    image: img('photo-1586281380349-632531db7ed4'),
    fallback: img('photo-1456324504439-367cee3b3c32'),
  },
  {
    id: '3', slug: 'flyers', name: 'Flyers', category: 'Marketing', basePrice: 35, badge: 'Popular',
    description: 'High-impact A5/A4 flyers for promotions, events and campaigns.',
    image: img('photo-1561070791-2526d30994b5'),
    fallback: img('photo-1542744173-8e7e53415bb0'),
  },
  {
    id: '4', slug: 'brochures', name: 'Brochures', category: 'Marketing', basePrice: 120,
    description: 'Tri-fold and bi-fold brochures that tell your brand story beautifully.',
    image: img('photo-1543269865-cbf427effbad'),
    fallback: img('photo-1524758631624-e2822e304c36'),
  },
  {
    id: '5', slug: 'envelopes', name: 'Envelopes', category: 'Stationery', basePrice: 65,
    description: 'Custom printed branded envelopes in DL, C5, and C4 sizes.',
    image: img('photo-1596526131083-e8c633c948d2'),
    fallback: img('photo-1579389083078-4e7018379f7e'),
  },
  {
    id: '6', slug: 'presentation-folders', name: 'Presentation Folders', category: 'Stationery', basePrice: 180,
    description: 'Branded A4 folders that make a strong impression in meetings.',
    image: img('photo-1531346680769-a1d79b57de5c'),
    fallback: img('photo-1541462608143-67571c6738dd'),
  },
  {
    id: '7', slug: 'rollup-banners', name: 'Roll-Up Banners', category: 'Signage', basePrice: 220,
    description: 'Portable pull-up banners for exhibitions, showrooms and events.',
    image: img('photo-1540575467063-178a50c2df87'),
    fallback: img('photo-1504711434969-e33886168f5c'),
  },
  {
    id: '8', slug: 'stickers', name: 'Stickers & Labels', category: 'Packaging', basePrice: 28,
    description: 'Custom die-cut stickers and product labels for any surface.',
    image: img('photo-1619462729353-b3e82d86f2e1'),
    fallback: img('photo-1572375992501-4b0892d50c69'),
  },
  {
    id: '9', slug: 'notebooks', name: 'Notebooks', category: 'Stationery', basePrice: 95,
    description: 'Branded hardcover and softcover notebooks for team or gifting.',
    image: img('photo-1544816155-12df9643f363'),
    fallback: img('photo-1531346680769-a1d79b57de5c'),
  },
  {
    id: '10', slug: 'pens', name: 'Branded Pens', category: 'Apparel & Gifts', basePrice: 15,
    description: 'Logo engraved pens — a timeless corporate gift under AED 20.',
    image: img('photo-1583485088034-697b5bc54ccd'),
    fallback: img('photo-1425082661705-1834bfd09dca'),
  },
  {
    id: '11', slug: 'tshirts', name: 'T-Shirts', category: 'Apparel & Gifts', basePrice: 75,
    description: 'Custom screen-printed or embroidered t-shirts for events and teams.',
    image: img('photo-1521572163474-6864f9cf17ab'),
    fallback: img('photo-1503341504253-dff4815485f1'),
  },
  {
    id: '12', slug: 'packaging-boxes', name: 'Packaging Boxes', category: 'Packaging', basePrice: 250,
    description: 'Custom branded boxes in any size for retail, gifting or product packaging.',
    image: img('photo-1577705998148-6da4f3963bc8'),
    fallback: img('photo-1519219788971-8d9797e0928e'),
  },
  {
    id: '13', slug: 'posters', name: 'Posters', category: 'Signage', basePrice: 45, badge: 'New',
    description: 'Vivid A3, A2 and A1 posters on premium gloss or matte paper.',
    image: img('photo-1558618666-fcd25c85cd64'),
    fallback: img('photo-1571988850800-7e4f02d3ba2b'),
  },
  {
    id: '14', slug: 'tote-bags', name: 'Tote Bags', category: 'Apparel & Gifts', basePrice: 55,
    description: 'Eco-friendly branded canvas tote bags — perfect for events and gifting.',
    image: img('photo-1553062407-98eeb64c6a62'),
    fallback: img('photo-1548036328-c9fa89d128fa'),
  },
  {
    id: '15', slug: 'mugs', name: 'Custom Mugs', category: 'Apparel & Gifts', basePrice: 35,
    description: 'Full-wrap printed ceramic mugs for offices, events and corporate gifts.',
    image: img('photo-1514228742587-6b1558fcca3d'),
    fallback: img('photo-1495474472287-4d71bcdd2085'),
  },
  {
    id: '16', slug: 'table-tents', name: 'Table Tents', category: 'Marketing', basePrice: 40,
    description: 'Folded table tent cards for restaurants, hotels and events.',
    image: img('photo-1414235077428-338989a2e8c0'),
    fallback: img('photo-1517248135467-4c7edcad34c4'),
  },
  {
    id: '17', slug: 'lanyards', name: 'Lanyards', category: 'Apparel & Gifts', basePrice: 18,
    description: 'Branded polyester and nylon lanyards with custom logo print.',
    image: img('photo-1635107510862-53886e926b74'),
    fallback: img('photo-1599666654775-4f7cd5d56546'),
  },
  {
    id: '18', slug: 'calendars', name: 'Desk Calendars', category: 'Stationery', basePrice: 85,
    description: 'Custom branded desk calendars — a whole year of brand visibility.',
    image: img('photo-1611532736597-de2d4265fba3'),
    fallback: img('photo-1506784983877-45594efa4cbe'),
  },
  {
    id: '19', slug: 'stamps', name: 'Custom Stamps', category: 'Stationery', basePrice: 30,
    description: 'Self-inking rubber stamps with your logo or text. AED 30 flat.',
    image: img('photo-1558618047-3c8c2a3dfb6a'),
    fallback: img('photo-1582719508461-905c673771fd'),
  },
  {
    id: '20', slug: 'caps', name: 'Branded Caps', category: 'Apparel & Gifts', basePrice: 65,
    description: 'Embroidered or printed caps for teams, events and giveaways.',
    image: img('photo-1588850561407-ed78c282e89b'),
    fallback: img('photo-1521369909029-2afed882baee'),
  },
]

function ProductCard({ product }: { product: CatalogCard }) {
  const [hovered, setHovered] = useState(false)
  const [src, setSrc] = useState(product.image)

  return (
    <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{
        backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', height: '100%',
        border: `1.5px solid ${hovered ? '#1D4ED8' : '#E2E8F0'}`,
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 12px 32px rgba(29,78,216,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Image */}
        <div style={{ height: 190, position: 'relative', overflow: 'hidden', flexShrink: 0, backgroundColor: '#F1F5F9' }}>
          <img src={src} alt={product.name}
            onError={() => { if (src !== product.fallback) setSrc(product.fallback) }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)', display: 'block' }}
          />
          {product.badge && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              backgroundColor: product.badge === 'New' ? '#10B981' : '#1D4ED8',
              color: 'white', borderRadius: 5, padding: '3px 10px',
              fontSize: 11, fontWeight: 700, fontFamily: 'system-ui',
            }}>{product.badge}</div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'system-ui', marginBottom: 5 }}>
            {product.category}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: "'Poppins', system-ui", margin: '0 0 6px' }}>
            {product.name}
          </h3>
          <p style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', lineHeight: 1.55, margin: '0 0 12px', flex: 1 }}>
            {product.description}
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(n => (
                <svg key={n} width="11" height="11" viewBox="0 0 11 11" fill="#F59E0B"><path d="M5.5 1l1.3 2.9H10L7.7 5.7l.9 2.8L5.5 7l-3.1 1.5.9-2.8L1 3.9h3.2z"/></svg>
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'system-ui' }}>4.9</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: "'Poppins', system-ui" }}>
              From AED {product.basePrice}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: hovered ? 'white' : '#1D4ED8',
              fontFamily: 'system-ui', backgroundColor: hovered ? '#1D4ED8' : '#EFF6FF',
              padding: '4px 10px', borderRadius: 5, transition: 'all 0.15s ease',
            }}>
              Order →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  // Live catalog from the backend; seeded to the mock list so the page renders
  // instantly and still works offline if the API is unreachable.
  const [products, setProducts] = useState<CatalogCard[]>(CATALOG_PRODUCTS)

  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then(rows => {
        if (cancelled || rows.length === 0) return   // empty API → keep mock
        const mockBySlug = Object.fromEntries(CATALOG_PRODUCTS.map(p => [p.slug, p]))
        setProducts(rows.map(r => {
          const mock = mockBySlug[r.slug]
          const main = r.images.find(i => i.isMain) ?? r.images[0]
          const image = catalogImageUrl(main?.url) || mock?.image || img('photo-1607082348824-0a96f2a4b9da')
          return {
            id: r.id,
            slug: r.slug,
            name: r.name,
            category: r.category?.name ?? mock?.category ?? 'Print',
            basePrice: Number(r.basePrice) || mock?.basePrice || 0,
            badge: mock?.badge,                       // badges are marketing-only, not in the DB
            description: r.description ?? mock?.description ?? '',
            image,
            fallback: mock?.fallback || image,
          }
        }))
      })
      .catch(() => { /* API down → keep the mock list already in state */ })
    return () => { cancelled = true }
  }, [])

  // Tabs derive from the categories actually present in the catalog: known ones
  // keep the curated order, unknown (admin-added) ones are appended alphabetically.
  const categories = useMemo(() => {
    const present = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    const known = CATEGORY_ORDER.filter(c => present.includes(c))
    const extra = present.filter(c => !CATEGORY_ORDER.includes(c)).sort()
    return ['All', ...known, ...extra]
  }, [products])

  // If the active tab's category disappears (e.g. catalog reload), fall back to All.
  useEffect(() => {
    if (activeCategory !== 'All' && !categories.includes(activeCategory)) setActiveCategory('All')
  }, [categories, activeCategory])

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const font = "'Poppins', system-ui, sans-serif"

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: font }}>

      {/* Page header — matches homepage section style */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '32px 44px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
              All Products
            </p>
            <h1 style={{ fontFamily: font, fontWeight: 800, fontSize: 28, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Print Products
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: '6px 0 0', fontFamily: 'system-ui' }}>
              {products.length} products · UAE studio · 24–48 hr turnaround
            </p>
          </div>
          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="8" cy="8" r="5.5" stroke="#94A3B8" strokeWidth="1.5"/>
              <path d="M12.5 12.5L16 16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontSize: 14, fontFamily: 'system-ui', outline: 'none', background: '#F8FAFC', color: '#0F172A' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#1D4ED8')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '12px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'system-ui', whiteSpace: 'nowrap',
              color: activeCategory === cat ? '#1D4ED8' : '#64748B',
              borderBottom: `2px solid ${activeCategory === cat ? '#1D4ED8' : 'transparent'}`,
              transition: 'color 0.15s, border-color 0.15s',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '28px 44px 44px' }}>
        <p style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'system-ui', marginBottom: 20 }}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B', fontFamily: 'system-ui' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 12, opacity: 0.4 }}>
              <circle cx="22" cy="22" r="14" stroke="#64748B" strokeWidth="2.5"/>
              <path d="M33 33L43 43" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p style={{ fontWeight: 600 }}>No products match "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
