import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { fetchCatalog, fetchCatalogCategories, fetchStorefront, catalogImageUrl } from '../../lib/api'
import type { StorefrontSettings } from '../../lib/api'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ── Slider components ─────────────────────────────────────────────────────────
function SliderArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'absolute', top: '40%', transform: 'translateY(-50%)',
        [dir]: -18,
        zIndex: 10, width: 36, height: 36, borderRadius: '50%',
        background: hov ? '#0F172A' : '#fff',
        color: hov ? '#fff' : '#0F172A',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        fontSize: 16, fontWeight: 700, lineHeight: 1,
      }}>
      {dir === 'left' ? '‹' : '›'}
    </button>
  )
}

function HSlider({ children, itemWidth = 200, isMobile = false }: { children: React.ReactNode; itemWidth?: number; isMobile?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * (itemWidth + 14) * 3, behavior: 'smooth' })
  return (
    <div style={{ position: 'relative' }}>
      {!isMobile && <SliderArrow dir="left"  onClick={() => scroll(-1)} />}
      <div ref={ref} style={{ display: 'flex', gap: isMobile ? 10 : 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}
        className="hslider">
        {children}
      </div>
      {!isMobile && <SliderArrow dir="right" onClick={() => scroll(1)} />}
    </div>
  )
}

// ── Brand tokens ──────────────────────────────────────────────────────────────
const DARK  = '#0F172A'
const BLUE  = '#1D4ED8'
const LIGHT = '#EFF6FF'
const AMBER = '#F59E0B'

const u = (id: string, w = 600, h = 400) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&q=80&auto=format&fit=crop`

// ── Data ──────────────────────────────────────────────────────────────────────
const HERO_IMAGES = [
  u('photo-1607082348824-0a96f2a4b9da', 400, 360),
  u('photo-1521572163474-6864f9cf17ab', 400, 360),
  u('photo-1514228742587-6b1558fcca3d', 400, 360),
  u('photo-1576502200916-3808e07386a5', 400, 360),
  u('photo-1540575467063-178a50c2df87', 400, 360),
  u('photo-1544816155-12df9643f363',   400, 360),
]

const TRUST_ICONS = {
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#F59E0B" stroke="#F59E0B"/>
    </svg>
  ),
  pen: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  truck: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
}

const TRUST_ITEMS = [
  { icon: 'star',  title: 'Over 18,000 5-star reviews', sub: 'Rated by Trustpilot users' },
  { icon: 'pen',   title: 'Create with confidence',      sub: 'Design it yourself, or with help' },
  { icon: 'truck', title: 'Fast delivery across UAE',    sub: 'Pick the speed, get it on time' },
]

const COLLECTIONS = [
  { name: 'Top products, starting at AED 35', img: u('photo-1607082348824-0a96f2a4b9da', 260, 180), slug: '/catalog' },
  { name: 'Prepare for exhibitions & events',  img: u('photo-1540575467063-178a50c2df87', 260, 180), slug: '/catalog' },
  { name: 'Corporate gifting & giveaways',     img: u('photo-1544816155-12df9643f363',    260, 180), slug: '/catalog' },
  { name: 'Team uniforms & branded wear',      img: u('photo-1521572163474-6864f9cf17ab', 260, 180), slug: '/catalog' },
  { name: 'Ramadan & Eid special prints',      img: u('photo-1576502200916-3808e07386a5', 260, 180), slug: '/catalog' },
  { name: 'Business starter kits',             img: u('photo-1561070791-2526d30994b5',    260, 180), slug: '/catalog' },
  { name: 'Restaurant & Café branding',        img: u('photo-1414235077428-338989a2e8c0', 260, 180), slug: '/catalog' },
  { name: 'Real estate marketing prints',      img: u('photo-1560518883-ce09059eeffa',    260, 180), slug: '/catalog' },
  { name: 'Healthcare & clinic materials',     img: u('photo-1576091160399-112ba8d25d1d', 260, 180), slug: '/catalog' },
  { name: 'Wedding & event stationery',        img: u('photo-1511795409834-ef04bbd61622', 260, 180), slug: '/catalog' },
]

const MUST_HAVES = [
  { name: 'Marketing Materials',  img: u('photo-1561070791-2526d30994b5', 260, 180), slug: '/catalog' },
  { name: 'Die-Cut Stickers',     img: u('photo-1572375992501-4b0892d50c69', 260, 180), slug: '/products/stickers' },
  { name: 'Branded Envelopes',    img: u('photo-1596526131083-e8c633c948d2', 260, 180), slug: '/products/envelopes' },
  { name: 'Outdoor Signs',        img: u('photo-1505373877841-8d25f7d46678', 260, 180), slug: '/catalog' },
  { name: 'Branded Pens',         img: u('photo-1583485088034-697b5bc54ccd', 260, 180), slug: '/catalog' },
  { name: 'Roll Labels',          img: u('photo-1572375992501-4b0892d50c69', 260, 180), slug: '/catalog' },
  { name: 'Custom Notebooks',     img: u('photo-1544816155-12df9643f363',    260, 180), slug: '/products/notebooks' },
  { name: 'Presentation Folders', img: u('photo-1497366811353-6870744d04b2', 260, 180), slug: '/catalog' },
  { name: 'Custom Packaging',     img: u('photo-1600275669439-14e40452d20b', 260, 180), slug: '/catalog' },
  { name: 'Flyers & Leaflets',    img: u('photo-1586281380349-632531db7ed4', 260, 180), slug: '/products/flyers' },
]

const TOOLS = [
  { title: 'Create your free logo',       name: 'Logo design',              img: u('photo-1572021335469-31706a17aaef', 220, 130), slug: '/editor' },
  { title: 'Build your website',          name: 'Custom Business Websites',  img: u('photo-1531297484001-80022131f5a1', 220, 130), slug: '/catalog' },
  { title: 'Design social content',       name: 'Social Media',             img: u('photo-1611162617474-5b21e879e113', 220, 130), slug: '/editor' },
  { title: 'Get design help',             name: 'Product Design',           img: u('photo-1600132806370-bf17e65e942f', 220, 130), slug: '/editor' },
  { title: 'Corporate tailored pricing',  name: 'Corporate Services',       img: u('photo-1497366811353-6870744d04b2', 220, 130), slug: '/catalog' },
  { title: 'Print & ship to customers',   name: 'Fulfilment Services',      img: u('photo-1586528116311-ad8dd3c8310d', 220, 130), slug: '/catalog' },
  { title: 'Branded packaging solutions', name: 'Packaging Design',         img: u('photo-1600275669439-14e40452d20b', 220, 130), slug: '/catalog' },
  { title: 'Event display graphics',      name: 'Event Printing',           img: u('photo-1540575467063-178a50c2df87', 220, 130), slug: '/catalog' },
]

const GALLERY = [
  { handle: '@creative_uae',      img: u('photo-1572021335469-31706a17aaef', 260, 180) },
  { handle: '@brandingdxb',       img: u('photo-1607082348824-0a96f2a4b9da', 260, 180) },
  { handle: '@printlove_ae',      img: u('photo-1572375992501-4b0892d50c69', 260, 180) },
  { handle: '@eventproabudhabi',  img: u('photo-1540575467063-178a50c2df87', 260, 180) },
  { handle: '@shopbrand_dubai',   img: u('photo-1521572163474-6864f9cf17ab', 260, 180) },
  { handle: '@thecreative_co',    img: u('photo-1576502200916-3808e07386a5', 260, 180) },
  { handle: '@designhaus_ae',     img: u('photo-1561070791-2526d30994b5',    260, 180) },
  { handle: '@packcraft_dubai',   img: u('photo-1600275669439-14e40452d20b', 260, 180) },
  { handle: '@stickerclub_uae',   img: u('photo-1583485088034-697b5bc54ccd', 260, 180) },
  { handle: '@printco_abudhabi',  img: u('photo-1586281380349-632531db7ed4', 260, 180) },
]

const FOOTER_HELP    = ['My Account', 'Shipping & Delivery', 'Contact & Support', 'Ideas & Advice', 'Accessibility']
const FOOTER_COMPANY = ['About Us', 'Careers in UAE', 'Ambassador Program', 'For Media', 'Sustainability', 'Privacy Policy', 'Terms & Conditions']

// ── Component ─────────────────────────────────────────────────────────────────
export function HomePage() {
  const navigate  = useNavigate()
  const { user, signOut } = useAuth()
  const { count } = useCart()
  const [search,       setSearch]       = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [annDismissed, setAnnDismissed] = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const year  = new Date().getFullYear()
  const width = useWindowWidth()

  // Live catalog — powers the "most popular products" row AND the free-text search
  // dropdown. Only real admin-managed products (no demo data).
  type SearchItem = { name: string; category: string; price: string; img: string; slug: string }
  const [searchItems, setSearchItems] = useState<SearchItem[]>([])
  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then(rows => {
        if (cancelled) return
        setSearchItems(rows.map(r => {
          const main = r.images.find(i => i.isMain) ?? r.images[0]
          const price = Number(r.basePrice) || 0
          return {
            name: r.name,
            category: r.category?.name ?? 'Custom print',
            price: price > 0 ? `From AED ${price}` : 'Get a quote',
            img: catalogImageUrl(main?.url) || u('photo-1607082348824-0a96f2a4b9da', 260, 200),
            slug: `/products/${r.slug}`,
          }
        }))
      })
      .catch(() => { if (!cancelled) setSearchItems([]) })
    return () => { cancelled = true }
  }, [])

  // Admin-editable storefront content (announcement, promo, hero, collections…).
  const [sf, setSf] = useState<StorefrontSettings | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchStorefront().then(s => { if (!cancelled) setSf(s) }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Featured "most popular" row: admin-picked products if any, else first 12.
  const featuredSlugs = sf?.featured.productSlugs ?? []
  const popular = (featuredSlugs.length
    ? featuredSlugs.map(slug => searchItems.find(p => p.slug === `/products/${slug}`)).filter((p): p is SearchItem => !!p)
    : searchItems.slice(0, 12)
  ).map(m => ({ name: m.name, price: m.price, sub: m.category, img: m.img, slug: m.slug }))

  // Resolved storefront content — admin settings when present, else built-in defaults.
  const announcementOn = sf ? sf.announcement.enabled : true
  const announcementText = sf?.announcement.text
  const promoOn = sf ? sf.promo.enabled : true
  const heroImages = sf && sf.hero.images.length ? sf.hero.images.map(catalogImageUrl) : HERO_IMAGES
  const heroHeadline = sf?.hero.headline ?? 'If you need it, we print it.'
  const heroSubtext  = sf?.hero.subtext ?? "From branded business products to beautiful corporate gifts — we've got the product for you. Easy-to-use design tools and same-week delivery across UAE."
  const heroTagline  = sf?.hero.tagline ?? 'Try our top products starting at just AED 35 each'
  const heroPrimaryLabel   = sf?.hero.primaryLabel ?? 'Shop from AED 35'
  const heroPrimaryHref    = sf?.hero.primaryHref ?? '/catalog'
  const heroSecondaryLabel = sf?.hero.secondaryLabel ?? 'Design Studio'
  const heroSecondaryHref  = sf?.hero.secondaryHref ?? '/editor'
  const featuredTitle = sf?.featured.title ?? 'Our most popular products'
  const collectionsOn = sf ? sf.collections.enabled : true
  const collectionItems = sf && sf.collections.items.length
    ? sf.collections.items.map(i => ({ name: i.title, img: catalogImageUrl(i.image) || u('photo-1607082348824-0a96f2a4b9da', 260, 180), slug: i.href || '/catalog' }))
    : COLLECTIONS
  const mustHavesOn = sf ? sf.mustHaves.enabled : true
  const mustHaveItems = sf && sf.mustHaves.items.length
    ? sf.mustHaves.items.map(i => ({ name: i.title, img: catalogImageUrl(i.image) || u('photo-1607082348824-0a96f2a4b9da', 260, 180), slug: i.href || '/catalog' }))
    : MUST_HAVES
  const toolsOn = sf ? sf.tools.enabled : true
  const galleryOn = sf ? sf.gallery.enabled : true
  const contactPhone = sf?.contact.phone ?? '+971 4 000 0000'
  const DEFAULT_WEB_BANNER = { enabled: true, eyebrow: 'MyPrintingWorld · Web & IT', headline: 'Need a website for your business?', text: "We don't just print — our in-house team builds fast, modern business websites, online stores and booking systems. From your logo to your domain, we get you online.", features: ['Business websites', 'Online stores', 'Hosting & domains'], ctaLabel: 'Book a free consultation', ctaHref: '', secondaryLabel: 'See our work', secondaryHref: '/catalog' }
  const webBanner = sf?.webBanner ?? DEFAULT_WEB_BANNER
  const webBannerOn = sf ? sf.webBanner.enabled : true

  // Free-text matches for the search dropdown (name or category), capped at 8.
  const q = search.trim().toLowerCase()
  const searchMatches = q
    ? searchItems.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8)
    : []
  const showSearchResults = searchFocused && q.length > 0

  // Categories from the real DB — powers both the nav strip under the search bar
  // and the "Explore all categories" image tiles.
  const [navCategories, setNavCategories] = useState<{ label: string; slug: string }[]>([])
  const [categoryTiles, setCategoryTiles] = useState<{ name: string; img: string; slug: string }[]>([])
  useEffect(() => {
    let cancelled = false
    fetchCatalogCategories()
      .then(cats => {
        if (cancelled) return
        setNavCategories(cats.map(c => ({ label: c.name, slug: `/catalog?category=${encodeURIComponent(c.name)}` })))
        setCategoryTiles(cats.map(c => ({
          name: c.name,
          img: catalogImageUrl(c.imageUrl) || u('photo-1607082348824-0a96f2a4b9da', 220, 160),
          slug: `/catalog?category=${encodeURIComponent(c.name)}`,
        })))
      })
      .catch(() => { if (!cancelled) { setNavCategories([]); setCategoryTiles([]) } })
    return () => { cancelled = true }
  }, [])

  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024
  const font = "'Poppins', system-ui, sans-serif"

  // Responsive values
  const px         = isMobile ? 16 : isTablet ? 28 : 44   // side padding
  const sectionPad = `32px ${px}px 8px`
  const catW       = isMobile ? 140 : 180
  const catH       = isMobile ?  110 : 140
  const itemW      = isMobile ? 160 : 210
  const itemH      = isMobile ? 130 : 170
  const collH      = isMobile ? 110 : 150
  const toolW      = isMobile ? 160 : 220

  return (
    <div className="storefront-home" style={{ width: '100%', background: '#fff', color: DARK, fontFamily: font, overflowX: 'hidden' }}>

      {/* ── Announcement bar ─────────────────────────────────────────────────── */}
      {announcementOn && !annDismissed && (
        <div style={{ background: DARK, color: '#fff', fontSize: isMobile ? 11 : 12, padding: `8px ${px}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
          <span style={{ textAlign: 'center', paddingRight: 24 }}>
            {announcementText ?? (isMobile
              ? 'Quality printing across all 7 Emirates.'
              : 'You are viewing the UAE website. Quality printing delivered across all seven Emirates.')}
          </span>
          <span style={{ position: 'absolute', right: px, cursor: 'pointer', fontSize: 15 }} onClick={() => setAnnDismissed(true)}>✕</span>
        </div>
      )}

      {/* ── Utility sub-nav ──────────────────────────────────────────────────── */}
      {!isMobile && (
        <div style={{ borderBottom: '1px solid #eee', padding: `6px ${px}px`, display: 'flex', gap: 24, fontSize: 12, color: '#555', flexWrap: 'wrap' }}>
          <Link to="/catalog" style={{ color: '#555', textDecoration: 'none' }}>All Products</Link>
          <Link to="/catalog" style={{ color: '#555', textDecoration: 'none' }}>Corporate Pricing</Link>
          <Link to="/editor"  style={{ color: '#555', textDecoration: 'none' }}>Design Studio</Link>
          <a href="tel:+97140000000" style={{ color: '#555', textDecoration: 'none' }}>{contactPhone}</a>
        </div>
      )}

      {/* ── Main header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 24, padding: `12px ${px}px`, flexWrap: 'wrap' }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ fontSize: isMobile ? 17 : 22, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: font }}>
            <span style={{ color: BLUE }}>My</span>Printing<span style={{ color: BLUE }}>World</span>
          </div>
        </Link>

        {/* Search — free-text with a live results dropdown */}
        <div style={{ flex: 1, position: 'relative', minWidth: isMobile ? '100%' : 200, order: isMobile ? 3 : 0 }}>
          <div style={{ display: 'flex' }}>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search for products…"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim()) { setSearchFocused(false); navigate(`/catalog?q=${encodeURIComponent(search.trim())}`) }
                if (e.key === 'Escape') setSearchFocused(false)
              }}
              style={{ flex: 1, border: '1.5px solid #ccc', borderRight: 'none', padding: '9px 12px', borderRadius: '4px 0 0 4px', fontSize: 14, fontFamily: font, outline: 'none' }}
            />
            <button
              onClick={() => { if (search.trim()) navigate(`/catalog?q=${encodeURIComponent(search.trim())}`) }}
              style={{ background: DARK, color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>

          {showSearchResults && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 50, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
              {searchMatches.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: '#64748B' }}>No products match “{search.trim()}”.</div>
              ) : (
                <>
                  {searchMatches.map(m => (
                    <div key={m.slug}
                      onMouseDown={e => { e.preventDefault(); setSearch(''); setSearchFocused(false); navigate(m.slug) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff' }}>
                      <img src={m.img} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#F1F5F9' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{m.category} · {m.price}</div>
                      </div>
                    </div>
                  ))}
                  <div onMouseDown={e => { e.preventDefault(); setSearchFocused(false); navigate(`/catalog?q=${encodeURIComponent(search.trim())}`) }}
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: BLUE, cursor: 'pointer', textAlign: 'center' }}>
                    See all results for “{search.trim()}” →
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20, fontSize: 12, marginLeft: 'auto' }}>
          {!isMobile && (
            <div style={{ lineHeight: 1.4, whiteSpace: 'nowrap' }}>
              Help is here<br /><strong style={{ fontSize: 13 }}>{contactPhone}</strong>
            </div>
          )}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setProfileOpen(o => !o)} onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE, color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>
                  {(((user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '?') as string).trim()[0] ?? '?').toUpperCase()}
                </span>
                {!isMobile && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>}
              </button>
              {profileOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', zIndex: 60, minWidth: 190, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'My account') as string}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  </div>
                  {[
                    { label: 'My Orders', href: '/account?tab=orders' },
                    { label: 'Account Settings', href: '/account' },
                  ].map(it => (
                    <div key={it.label} onMouseDown={e => { e.preventDefault(); setProfileOpen(false); navigate(it.href) }}
                      style={{ padding: '10px 14px', fontSize: 13, color: DARK, cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F8FAFC' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff' }}>
                      {it.label}
                    </div>
                  ))}
                  <div onMouseDown={async e => { e.preventDefault(); setProfileOpen(false); await signOut() }}
                    style={{ padding: '10px 14px', fontSize: 13, color: '#EF4444', fontWeight: 600, cursor: 'pointer', borderTop: '1px solid #F1F5F9' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FEF2F2' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fff' }}>
                    Sign out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{ background: BLUE, color: '#fff', border: 'none', padding: isMobile ? '7px 12px' : '8px 16px', borderRadius: 12, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: font, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {isMobile ? '' : 'Sign In'}
            </button>
          )}
          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => navigate('/cart')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            {!isMobile && 'Cart'}
            {count > 0 && (
              <span style={{ position: 'absolute', top: -8, right: -10, background: BLUE, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {count}
              </span>
            )}
          </div>
          {/* Hamburger on mobile */}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile nav drawer ────────────────────────────────────────────────── */}
      {isMobile && menuOpen && (
        <div style={{ background: '#fff', borderTop: '1px solid #eee', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {navCategories.map(link => (
            <Link key={link.label} to={link.slug}
              onClick={() => setMenuOpen(false)}
              style={{ color: DARK, fontWeight: 500, textDecoration: 'none', fontSize: 14, padding: '4px 0' }}>
              {link.label}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />
          <Link to="/catalog" onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>All Products</Link>
          <Link to="/catalog" onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>Corporate Pricing</Link>
          <Link to="/editor"  onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>Design Studio</Link>
          <a href="tel:+97140000000" style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>{contactPhone}</a>
        </div>
      )}

      {/* ── Category nav bar (desktop/tablet only) — real DB categories ──────── */}
      {!isMobile && navCategories.length > 0 && (
        <div style={{ padding: `0 ${px}px 12px`, display: 'flex', gap: 20, fontSize: 13, borderBottom: '1px solid #eee', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {navCategories.map(link => (
            <Link key={link.label} to={link.slug} style={{ color: DARK, fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── Promo banner ─────────────────────────────────────────────────────── */}
      {promoOn && (
      <div style={{ background: DARK, color: '#fff', padding: `8px ${px}px`, fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {sf ? (
            <>
              <strong>{sf.promo.text}{sf.promo.code ? ` | Code: ${sf.promo.code}` : ''}</strong>
              {!isMobile && sf.promo.detail ? ` | ${sf.promo.detail}` : ''}
              {!isMobile && sf.promo.ctaLabel ? <>{' | '}<Link to={sf.promo.ctaHref || '/catalog'} style={{ color: '#fff', textDecoration: 'underline' }}>{sf.promo.ctaLabel}</Link></> : ''}
            </>
          ) : isMobile
            ? <><strong>AED 220 off orders AED 730+</strong> | Code: MPW30</>
            : <><strong>Buy More, Save More: AED 220 off orders AED 730+ | Code: MPW30</strong>{' | '}Ends Aug 31 | <Link to="/catalog" style={{ color: '#fff', textDecoration: 'underline' }}>Offer details</Link>{' | '}<Link to="/catalog" style={{ color: '#fff', textDecoration: 'underline' }}>Save now</Link></>
          }
        </div>
        <span>›</span>
      </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      {isMobile ? (
        /* Mobile: image strip on top, CTA block below — no absolute overlay */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', height: 140 }}>
            {heroImages.slice(0, 3).map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
            ))}
          </div>
          <div style={{ background: DARK, color: '#fff', padding: '24px 16px', textAlign: 'center' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: font }}>{heroHeadline}</h1>
            <p style={{ fontSize: 12, margin: '0 0 14px', opacity: 0.85 }}>{heroTagline}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => navigate(heroPrimaryHref)} style={{ background: '#fff', color: DARK, border: 'none', padding: '9px 18px', fontSize: 12, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
                {heroPrimaryLabel}
              </button>
              <button onClick={() => navigate(heroSecondaryHref)} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '9px 18px', fontSize: 12, borderRadius: 12, cursor: 'pointer', fontFamily: font }}>
                {heroSecondaryLabel}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tablet / Desktop: absolute overlay on image grid */
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
            gap: 0,
            height: isTablet ? 280 : 380,
          }}>
            {heroImages.map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
            ))}
          </div>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: DARK, color: '#fff',
            width: isTablet ? 420 : 520,
            padding: isTablet ? '28px 32px' : '36px 40px',
            textAlign: 'center', borderRadius: 12,
          }}>
            <h1 style={{ fontSize: isTablet ? 20 : 26, fontWeight: 700, margin: '0 0 14px', fontFamily: font }}>
              {heroHeadline}
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', opacity: 0.9 }}>
              {heroSubtext}
            </p>
            <p style={{ fontSize: 14, margin: '0 0 20px' }}>{heroTagline}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate(heroPrimaryHref)} style={{ background: '#fff', color: DARK, border: 'none', padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
                {heroPrimaryLabel}
              </button>
              <button onClick={() => navigate(heroSecondaryHref)} style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer', fontFamily: font }}>
                {heroSecondaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'space-around', padding: `16px ${px}px`, borderTop: '1px solid #eee', borderBottom: '1px solid #eee', flexWrap: 'wrap', gap: 16, overflowX: isMobile ? 'auto' : 'visible' }}>
        {TRUST_ITEMS.map(t => (
          <div key={t.title} style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ color: BLUE }}>{TRUST_ICONS[t.icon as keyof typeof TRUST_ICONS]}</div>
            <div>
              <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 600 }}>{t.title}</div>
              {!isMobile && <div style={{ fontSize: 12, color: '#666' }}>{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Explore all categories (real DB categories; hidden when empty) ────── */}
      {categoryTiles.length > 0 && (
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>Explore all categories</h2>
        <HSlider itemWidth={catW} isMobile={isMobile}>
          {categoryTiles.map(c => (
            <Link key={c.name} to={c.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: catW }}>
              <img src={c.img} alt={c.name} style={{ width: catW, height: catH, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#f2efe8' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.3, fontWeight: 500 }}>{c.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── Web & IT services banner (admin-editable) ────────────────────────── */}
      {webBannerOn && (
      <section style={{ margin: `32px ${px}px` }}>
        <div style={{
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(120deg, #0B1120 0%, #10224A 55%, #1D4ED8 130%)',
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
        }}>
          {/* Left: pitch */}
          <div style={{ padding: isMobile ? '30px 24px' : '48px 52px', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7DD3FC', fontFamily: font }}>{webBanner.eyebrow}</span>
            <h2 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, margin: 0, color: '#fff', lineHeight: 1.15, fontFamily: font, letterSpacing: '-0.02em' }}>{webBanner.headline}</h2>
            <p style={{ fontSize: 15, color: '#CBD5E1', margin: 0, lineHeight: 1.65, maxWidth: 460 }}>
              {webBanner.text}
            </p>
            {webBanner.features.length > 0 && (
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
                {webBanner.features.map(t => (
                  <span key={t} style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '5px 12px' }}>✓ {t}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              {webBanner.ctaLabel && (webBanner.ctaHref
                ? <button onClick={() => navigate(webBanner.ctaHref)} style={{ background: '#38BDF8', color: '#04263A', border: 'none', padding: '12px 24px', fontSize: 14, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 700 }}>{webBanner.ctaLabel}</button>
                : <a href={`tel:${contactPhone.replace(/\s/g, '')}`} style={{ background: '#38BDF8', color: '#04263A', border: 'none', padding: '12px 24px', fontSize: 14, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>{webBanner.ctaLabel}</a>)}
              {webBanner.secondaryLabel && (
                <button onClick={() => navigate(webBanner.secondaryHref || '/catalog')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', padding: '12px 22px', fontSize: 14, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>{webBanner.secondaryLabel}</button>
              )}
            </div>
          </div>

          {/* Right: browser/code motif */}
          <div style={{ position: 'relative', minHeight: isMobile ? 170 : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0 24px 28px' : '40px 44px' }}>
            <div style={{ width: '100%', maxWidth: 360, background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', alignItems: 'center' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F87171' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#34D399' }} />
                <span style={{ marginLeft: 10, fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>yourbusiness.ae</span>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 34, borderRadius: 8, background: 'linear-gradient(90deg,#1D4ED8,#38BDF8)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.07)' }} />)}
                </div>
                <div style={{ height: 8, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.12)' }} />
                <div style={{ height: 8, width: '55%', borderRadius: 4, background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ height: 30, width: 110, borderRadius: 8, background: '#38BDF8', marginTop: 4 }} />
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Popular products (real catalog only; hidden when empty) ───────────── */}
      {popular.length > 0 && (
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>{featuredTitle}</h2>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {popular.map(r => (
            <Link key={r.name} to={r.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: itemW }}>
              <img src={r.img} alt={r.name} style={{ width: itemW, height: itemH, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#fafafa' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 10 }}>{r.name}</div>
              <div style={{ fontSize: 13, marginTop: 2, color: BLUE, fontWeight: 700 }}>{r.price}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{r.sub}</div>
            </Link>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── Shop by collection ────────────────────────────────────────────────── */}
      {collectionsOn && (
      <section style={{ padding: sectionPad }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: 0, fontFamily: font }}>{sf?.collections.title ?? 'Shop by collection'}</h2>
          <Link to="/catalog" style={{ fontSize: 13, color: BLUE, whiteSpace: 'nowrap' }}>See all collections →</Link>
        </div>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {collectionItems.map(col => (
            <Link key={col.name} to={col.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: itemW }}>
              <img src={col.img} alt={col.name} style={{ width: itemW, height: collH, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.3, fontWeight: 500 }}>{col.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── Must-haves ────────────────────────────────────────────────────────── */}
      {mustHavesOn && (
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>{sf?.mustHaves.title ?? 'Explore even more must-haves'}</h2>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {mustHaveItems.map(m => (
            <Link key={m.name} to={m.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: itemW }}>
              <img src={m.img} alt={m.name} style={{ width: itemW, height: collH, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#f2efe8' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, fontWeight: 500 }}>{m.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── Promo split card ──────────────────────────────────────────────────── */}
      <section style={{ margin: `32px ${px}px` }}>
        <div style={{
          background: LIGHT, borderRadius: 12, overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        }}>
          <div style={{ padding: isMobile ? '28px 24px' : '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
            <h2 style={{ fontSize: isMobile ? 18 : 26, fontWeight: 700, margin: 0, fontFamily: font }}>Flyers that mean business, for less.</h2>
            <p style={{ fontSize: 14, color: '#444', margin: 0, lineHeight: 1.6 }}>Bring your brand to life with flyers that are easy to create and impossible to ignore. Delivered across UAE.</p>
            <button onClick={() => navigate('/products/flyers')} style={{ background: DARK, color: '#fff', border: 'none', padding: '12px 22px', fontSize: 13, borderRadius: 12, width: 'max-content', cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
              Shop flyers
            </button>
          </div>
          <img src={u('photo-1561070791-2526d30994b5', 600, 400)} alt="Flyers"
            style={{ width: '100%', height: isMobile ? 180 : '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#cbd5e1' }} />
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────────────────────────── */}
      {toolsOn && (
      <section style={{ padding: sectionPad }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: 0, fontFamily: font }}>Tools to help build your business</h2>
          <Link to="/editor" style={{ fontSize: 13, color: BLUE, whiteSpace: 'nowrap' }}>See all services →</Link>
        </div>
        <HSlider itemWidth={toolW} isMobile={isMobile}>
          {TOOLS.map(tool => (
            <Link key={tool.title} to={tool.slug} style={{ textDecoration: 'none', color: DARK, border: '1px solid #eee', borderRadius: 12, padding: isMobile ? 14 : 20, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: toolW }}>
              <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, fontFamily: font }}>{tool.title}</div>
              <img src={tool.img} alt={tool.name} style={{ width: '100%', height: isMobile ? 80 : 110, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 11, color: '#666' }}>{tool.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── UGC Gallery ──────────────────────────────────────────────────────── */}
      {galleryOn && (
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 4px', fontFamily: font }}>Made by you, #MadeWithMyPrintingWorld</h2>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>
          {isMobile ? 'Tag us @MyPrintingWorld to be featured.' : 'We love to see your custom creations. Tag us @MyPrintingWorld and #MadeWithMyPrintingWorld for a chance to be featured.'}
        </p>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {GALLERY.map(g => (
            <div key={g.handle} style={{ flexShrink: 0, width: itemW }}>
              <img src={g.img} alt={g.handle} style={{ width: itemW, height: collH, objectFit: 'cover', display: 'block', borderRadius: 12 }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{g.handle}</div>
            </div>
          ))}
        </HSlider>
      </section>
      )}

      {/* ── About section ────────────────────────────────────────────────────── */}
      <section style={{ background: '#F8FAFC', marginTop: 24 }}>
        <div style={{
          padding: isMobile ? '36px 16px' : `56px ${px}px`,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 24 : 60,
        }}>
          <div>
            <h3 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, margin: '0 0 12px', fontFamily: font }}>MyPrintingWorld: Here for UAE business.</h3>
            <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0 }}>
              MyPrintingWorld has helped small business owners, entrepreneurs and dreamers across the UAE create custom designs and professional marketing. Our online printing services help you find custom products you need — business cards, banners, promotional marketing and more — to create a look you love. Delivered fast, across all seven Emirates.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: font }}>Easy Design</h4>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>Our online tools make the process as simple and clear as possible, and we're improving your experience all the time.</p>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: font }}>Make It Match</h4>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>Our designs work across multiple products, so you can create consistent, professional marketing effortlessly.</p>
            </div>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', fontFamily: font }}>UAE Delivery</h4>
              <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: 0 }}>Free delivery across UAE on all orders. Most products ship within 24–48 hours of proof approval.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ background: DARK }}>
        <div style={{
          color: '#cdd5e0',
          padding: isMobile ? `32px ${px}px` : `40px ${px}px`,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? '1fr 1fr 1fr' : '1.4fr 1fr 1fr 1fr',
          gap: isMobile ? '24px 20px' : 30,
        }}>
          {/* Brand col — full width on mobile */}
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10, fontFamily: font }}>
              <span style={{ color: BLUE }}>My</span>Printing<span style={{ color: BLUE }}>World</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              MyPrintingWorld is here to help every step of the way. <Link to="/catalog" style={{ color: '#9db4d4' }}>Explore products</Link>
            </p>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Let Us Help</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FOOTER_HELP.map(f => <a key={f} href="#" style={{ fontSize: 12, color: '#cdd5e0', textDecoration: 'none' }}>{f}</a>)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Our Company</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {FOOTER_COMPANY.map(f => <a key={f} href="#" style={{ fontSize: 12, color: '#cdd5e0', textDecoration: 'none' }}>{f}</a>)}
            </div>
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={AMBER} stroke={AMBER} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Trustpilot
              </div>
              <div style={{ fontSize: 12 }}>TrustScore 4.8 <span style={{ color: '#9db4d4' }}>3,256 reviews</span></div>
              <div style={{ fontSize: 11, color: '#9db4d4', marginTop: 10 }}>Our customers rate us Excellent on Trustpilot</div>
            </div>
          )}
        </div>
      </footer>

      {/* ── Footer bottom bar ────────────────────────────────────────────────── */}
      <div style={{ background: '#0d1826' }}>
        <div style={{ color: '#9db4d4', padding: `12px ${px}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
            {!isMobile && <span>{contactPhone}</span>}
            <Link to="/" style={{ color: '#9db4d4', textDecoration: 'none' }}>Home</Link>
            <a href="#" style={{ color: '#9db4d4', textDecoration: 'none' }}>Privacy Policy</a>
            {!isMobile && <a href="#" style={{ color: '#9db4d4', textDecoration: 'none' }}>Terms and Conditions</a>}
            {!isMobile && <a href="#" style={{ color: '#9db4d4', textDecoration: 'none' }}>Legal</a>}
          </div>
          <div>© 2024–{year} MyPrintingWorld.</div>
        </div>
      </div>

    </div>
  )
}
