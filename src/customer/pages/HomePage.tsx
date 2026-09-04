import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

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
const NAV_LINKS = [
  { label: 'Deals', accent: AMBER },
  { label: 'Business Cards',               slug: '/products/business-cards' },
  { label: 'Postcards & Print Advertising', slug: '/catalog' },
  { label: 'Signs, Banners & Posters',     slug: '/catalog' },
  { label: 'Stickers & Labels',            slug: '/products/stickers' },
  { label: 'Clothing & Bags',              slug: '/catalog' },
  { label: 'Promotional Products',         slug: '/catalog' },
  { label: 'Packaging',                    slug: '/catalog' },
  { label: 'Notebooks & Stationery',       slug: '/catalog' },
  { label: 'Envelopes',                    slug: '/products/envelopes' },
  { label: 'Logo & Design Services',       slug: '/catalog' },
  { label: 'Design Services',              slug: '/editor' },
]

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

const CATEGORIES = [
  { name: 'Business Cards',          img: u('photo-1607082348824-0a96f2a4b9da', 220, 160), slug: '/products/business-cards' },
  { name: 'Postcards & Advertising', img: u('photo-1561070791-2526d30994b5',    220, 160), slug: '/catalog' },
  { name: 'Signs, Banners & Posters',img: u('photo-1540575467063-178a50c2df87', 220, 160), slug: '/catalog' },
  { name: 'Stickers & Labels',       img: u('photo-1572375992501-4b0892d50c69', 220, 160), slug: '/products/stickers' },
  { name: 'Clothing & Bags',         img: u('photo-1521572163474-6864f9cf17ab', 220, 160), slug: '/catalog' },
  { name: 'Promotional Products',    img: u('photo-1583485088034-697b5bc54ccd', 220, 160), slug: '/catalog' },
  { name: 'Packaging',               img: u('photo-1600275669439-14e40452d20b', 220, 160), slug: '/catalog' },
  { name: 'Booklets & Catalogues',   img: u('photo-1543269865-cbf427effbad',    220, 160), slug: '/catalog' },
  { name: 'Notebooks & Stationery',  img: u('photo-1544816155-12df9643f363',    220, 160), slug: '/products/notebooks' },
  { name: 'Envelopes',               img: u('photo-1596526131083-e8c633c948d2', 220, 160), slug: '/products/envelopes' },
  { name: 'Flyers & Leaflets',       img: u('photo-1586281380349-632531db7ed4', 220, 160), slug: '/products/flyers' },
  { name: 'Brochures',               img: u('photo-1497366811353-6870744d04b2', 220, 160), slug: '/products/brochures' },
]

const POPULAR_ITEMS = [
  { name: 'Custom Business Cards',  price: 'From AED 49',  sub: 'AED 0.49 each / 100 units', img: u('photo-1607082348824-0a96f2a4b9da', 260, 200), slug: '/products/business-cards' },
  { name: 'Company Letterhead',     price: 'From AED 89',  sub: 'AED 0.36 each / 250 units', img: u('photo-1586281380349-632531db7ed4', 260, 200), slug: '/products/letterhead' },
  { name: 'Roll-Up Banners',        price: 'From AED 220', sub: '85×200 cm, includes stand',  img: u('photo-1540575467063-178a50c2df87', 260, 200), slug: '/products/rollup-banners' },
  { name: 'Branded Notebooks',      price: 'From AED 95',  sub: 'A5 hardcover, min 25 units', img: u('photo-1544816155-12df9643f363',    260, 200), slug: '/products/notebooks' },
  { name: 'Stickers & Labels',      price: 'From AED 28',  sub: 'AED 0.28 each / 100 units', img: u('photo-1572375992501-4b0892d50c69', 260, 200), slug: '/products/stickers' },
  { name: 'Branded Pens',           price: 'From AED 15',  sub: 'Minimum quantity 50',        img: u('photo-1583485088034-697b5bc54ccd', 260, 200), slug: '/catalog' },
  { name: 'Flyers',                 price: 'From AED 55',  sub: 'A5 glossy, min 100 units',   img: u('photo-1561070791-2526d30994b5',    260, 200), slug: '/products/flyers' },
  { name: 'Brochures',              price: 'From AED 120', sub: 'Tri-fold, min 50 units',     img: u('photo-1497366811353-6870744d04b2', 260, 200), slug: '/products/brochures' },
  { name: 'Branded Envelopes',      price: 'From AED 65',  sub: 'DL size, min 100 units',     img: u('photo-1596526131083-e8c633c948d2', 260, 200), slug: '/products/envelopes' },
  { name: 'Custom Packaging',       price: 'From AED 180', sub: 'Min 50 units',               img: u('photo-1600275669439-14e40452d20b', 260, 200), slug: '/catalog' },
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
  const [annDismissed, setAnnDismissed] = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const year  = new Date().getFullYear()
  const width = useWindowWidth()

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
      {!annDismissed && (
        <div style={{ background: DARK, color: '#fff', fontSize: isMobile ? 11 : 12, padding: `8px ${px}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative' }}>
          <span style={{ textAlign: 'center', paddingRight: 24 }}>
            {isMobile
              ? 'Quality printing across all 7 Emirates.'
              : 'You are viewing the UAE website. Quality printing delivered across all seven Emirates.'}
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
          <a href="tel:+97140000000" style={{ color: '#555', textDecoration: 'none' }}>+971 4 000 0000</a>
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

        {/* Search — full width on its own row on mobile */}
        <div style={{ flex: 1, display: 'flex', minWidth: isMobile ? '100%' : 200, order: isMobile ? 3 : 0 }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search for products…"
            onKeyDown={e => { if (e.key === 'Enter' && search.trim()) navigate('/catalog') }}
            style={{ flex: 1, border: '1.5px solid #ccc', borderRight: 'none', padding: '9px 12px', borderRadius: '4px 0 0 4px', fontSize: 14, fontFamily: font, outline: 'none' }}
          />
          <button
            onClick={() => navigate('/catalog')}
            style={{ background: DARK, color: '#fff', border: 'none', borderRadius: '0 4px 4px 0', padding: '0 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 20, fontSize: 12, marginLeft: 'auto' }}>
          {!isMobile && (
            <div style={{ lineHeight: 1.4, whiteSpace: 'nowrap' }}>
              Help is here<br /><strong style={{ fontSize: 13 }}>+971 4 000 0000</strong>
            </div>
          )}
          {user ? (
            <button onClick={() => signOut()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: DARK, fontFamily: font }}>
              Sign out
            </button>
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
          {NAV_LINKS.map(link => (
            <Link key={link.label} to={link.slug ?? '/catalog'}
              onClick={() => setMenuOpen(false)}
              style={{ color: link.accent ?? DARK, fontWeight: 500, textDecoration: 'none', fontSize: 14, padding: '4px 0' }}>
              {link.label}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '4px 0' }} />
          <Link to="/catalog" onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>All Products</Link>
          <Link to="/catalog" onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>Corporate Pricing</Link>
          <Link to="/editor"  onClick={() => setMenuOpen(false)} style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>Design Studio</Link>
          <a href="tel:+97140000000" style={{ color: '#555', textDecoration: 'none', fontSize: 13 }}>+971 4 000 0000</a>
        </div>
      )}

      {/* ── Category nav bar (desktop/tablet only) ───────────────────────────── */}
      {!isMobile && (
        <div style={{ padding: `0 ${px}px 12px`, display: 'flex', gap: 20, fontSize: 13, borderBottom: '1px solid #eee', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {NAV_LINKS.map(link => (
            <Link key={link.label} to={link.slug ?? '/catalog'} style={{ color: link.accent ?? DARK, fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── Promo banner ─────────────────────────────────────────────────────── */}
      <div style={{ background: DARK, color: '#fff', padding: `8px ${px}px`, fontSize: isMobile ? 11 : 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          {isMobile
            ? <><strong>AED 220 off orders AED 730+</strong> | Code: MPW30</>
            : <><strong>Buy More, Save More: AED 220 off orders AED 730+ | Code: MPW30</strong>{' | '}Ends Aug 31 | <Link to="/catalog" style={{ color: '#fff', textDecoration: 'underline' }}>Offer details</Link>{' | '}<Link to="/catalog" style={{ color: '#fff', textDecoration: 'underline' }}>Save now</Link></>
          }
        </div>
        <span>›</span>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      {isMobile ? (
        /* Mobile: image strip on top, CTA block below — no absolute overlay */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', height: 140 }}>
            {HERO_IMAGES.slice(0, 3).map((src, i) => (
              <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
            ))}
          </div>
          <div style={{ background: DARK, color: '#fff', padding: '24px 16px', textAlign: 'center' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: font }}>If you need it, we print it.</h1>
            <p style={{ fontSize: 12, margin: '0 0 14px', opacity: 0.85 }}>Top products starting at just AED 35 each</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button onClick={() => navigate('/catalog')} style={{ background: '#fff', color: DARK, border: 'none', padding: '9px 18px', fontSize: 12, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
                Shop from AED 35
              </button>
              <button onClick={() => navigate('/editor')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '9px 18px', fontSize: 12, borderRadius: 12, cursor: 'pointer', fontFamily: font }}>
                Design Studio
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
            {HERO_IMAGES.map((src, i) => (
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
              If you need it, we print it.
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, margin: '0 0 16px', opacity: 0.9 }}>
              From branded business products to beautiful corporate gifts — we've got the product for you. Easy-to-use design tools and same-week delivery across UAE.
            </p>
            <p style={{ fontSize: 14, margin: '0 0 20px' }}>Try our top products starting at just AED 35 each</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/catalog')} style={{ background: '#fff', color: DARK, border: 'none', padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer', fontFamily: font, fontWeight: 600 }}>
                Shop from AED 35
              </button>
              <button onClick={() => navigate('/catalog')} style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer', fontFamily: font }}>
                Bestselling Products
              </button>
              <button onClick={() => navigate('/editor')} style={{ background: 'transparent', color: '#fff', border: '1px solid #fff', padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer', fontFamily: font }}>
                Design Studio
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

      {/* ── Explore all categories ────────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>Explore all categories</h2>
        <HSlider itemWidth={catW} isMobile={isMobile}>
          {CATEGORIES.map(c => (
            <Link key={c.name} to={c.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: catW }}>
              <img src={c.img} alt={c.name} style={{ width: catW, height: catH, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#f2efe8' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.3, fontWeight: 500 }}>{c.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>

      {/* ── Popular products ──────────────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>Our most popular products</h2>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {POPULAR_ITEMS.map(r => (
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

      {/* ── Shop by collection ────────────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: 0, fontFamily: font }}>Shop by collection</h2>
          <Link to="/catalog" style={{ fontSize: 13, color: BLUE, whiteSpace: 'nowrap' }}>See all collections →</Link>
        </div>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {COLLECTIONS.map(col => (
            <Link key={col.name} to={col.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: itemW }}>
              <img src={col.img} alt={col.name} style={{ width: itemW, height: collH, objectFit: 'cover', borderRadius: 12, display: 'block' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.3, fontWeight: 500 }}>{col.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>

      {/* ── Must-haves ────────────────────────────────────────────────────────── */}
      <section style={{ padding: sectionPad }}>
        <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: '0 0 16px', fontFamily: font }}>Explore even more must-haves</h2>
        <HSlider itemWidth={itemW} isMobile={isMobile}>
          {MUST_HAVES.map(m => (
            <Link key={m.name} to={m.slug} style={{ textDecoration: 'none', color: DARK, flexShrink: 0, width: itemW }}>
              <img src={m.img} alt={m.name} style={{ width: itemW, height: collH, objectFit: 'cover', borderRadius: 12, display: 'block', background: '#f2efe8' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.background = '#e2e8f0' }} />
              <div style={{ fontSize: 12, marginTop: 8, fontWeight: 500 }}>{m.name}</div>
            </Link>
          ))}
        </HSlider>
      </section>

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

      {/* ── UGC Gallery ──────────────────────────────────────────────────────── */}
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
            {!isMobile && <span>+971 4 000 0000</span>}
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
