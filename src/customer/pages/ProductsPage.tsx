import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEMPLATES } from '../../shared/components/product-editor/templates'

const CARD_COLORS: Record<string, [string, string]> = {
  business_card:         ['#C2410C', '#EA580C'],
  business_card_rounded: ['#0369A1', '#0284C7'],
  business_card_square:  ['#7C3AED', '#8B5CF6'],
  business_card_circle:  ['#047857', '#059669'],
  business_card_oval:    ['#B45309', '#D97706'],
  letterhead:            ['#1D4ED8', '#2563EB'],
  pen:                   ['#374151', '#4B5563'],
}

const CARD_ICONS: Record<string, string> = {
  business_card:         '🪪',
  business_card_rounded: '🪪',
  business_card_square:  '🟦',
  business_card_circle:  '⭕',
  business_card_oval:    '🥚',
  letterhead:            '📄',
  pen:                   '🖊️',
}

const CATEGORIES = [
  { id: 'all',          label: 'All Products' },
  { id: 'cards',        label: 'Business Cards' },
  { id: 'stationery',   label: 'Stationery' },
  { id: 'promo',        label: 'Promotional' },
]

const CATEGORY_MAP: Record<string, string> = {
  business_card:         'cards',
  business_card_rounded: 'cards',
  business_card_square:  'cards',
  business_card_circle:  'cards',
  business_card_oval:    'cards',
  letterhead:            'stationery',
  pen:                   'promo',
}

export function ProductsPage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price')

  const allEntries = Object.entries(TEMPLATES)
  const filtered = allEntries
    .filter(([key]) => activeCategory === 'all' || CATEGORY_MAP[key] === activeCategory)
    .sort(([, a], [, b]) =>
      sortBy === 'price' ? a.basePrice - b.basePrice : a.label.localeCompare(b.label),
    )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', paddingTop: 64 }}>
      {/* Page header */}
      <div style={{ backgroundColor: '#1C1917', padding: '56px 24px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <a
              href="/"
              style={{ color: '#78716C', textDecoration: 'none', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}
              onClick={e => { e.preventDefault(); navigate('/') }}
            >
              Home
            </a>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#78716C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#F5F3EE', fontSize: 13, fontFamily: 'system-ui, sans-serif' }}>Products</span>
          </nav>
          <h1 style={{
            fontFamily: "'Poppins', system-ui, sans-serif",
            fontWeight: 800, fontSize: 'clamp(32px, 5vw, 52px)',
            color: '#FAFAF8', letterSpacing: '-0.03em',
            margin: '0 0 12px', lineHeight: 1.1,
          }}>
            All Products
          </h1>
          <p style={{ color: '#78716C', fontSize: 16, fontFamily: 'system-ui, sans-serif', margin: 0, lineHeight: 1.5 }}>
            {allEntries.length} products · Designed online, printed in UAE, delivered fast
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{
        backgroundColor: 'white', borderBottom: '1px solid #E7E5E0',
        position: 'sticky', top: 64, zIndex: 100,
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 0,
          overflowX: 'auto',
        }}>
          {/* Category tabs */}
          <div style={{ display: 'flex', flex: 1, gap: 0 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '16px 20px', backgroundColor: 'transparent', border: 'none',
                  cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  fontSize: 14, fontWeight: activeCategory === cat.id ? 700 : 500,
                  color: activeCategory === cat.id ? '#C2410C' : '#78716C',
                  borderBottom: `2px solid ${activeCategory === cat.id ? '#C2410C' : 'transparent'}`,
                  whiteSpace: 'nowrap', transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingLeft: 20 }}>
            <span style={{ fontSize: 13, color: '#78716C', fontFamily: 'system-ui, sans-serif' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'price' | 'name')}
              style={{
                border: '1px solid #E7E5E0', borderRadius: 8, padding: '6px 12px',
                fontSize: 13, color: '#1C1917', fontFamily: 'system-ui, sans-serif',
                backgroundColor: 'white', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="price">Price: Low to high</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#78716C', fontFamily: 'system-ui, sans-serif' }}>
            No products in this category yet. More coming soon!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {filtered.map(([key, tmpl]) => {
              const [c1, c2] = CARD_COLORS[key] ?? ['#1C1917', '#44403C']
              const minQty = tmpl.quantities[0]
              return (
                <article
                  key={key}
                  className="stor-product-card"
                  onClick={() => navigate(`/editor?product=${key}`)}
                  style={{
                    backgroundColor: 'white', borderRadius: 16,
                    border: '1px solid #E7E5E0', overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(28,25,23,0.04)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Header */}
                  <div style={{
                    height: 140, backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    }} />
                    <span style={{ fontSize: 48, position: 'relative' }}>
                      {CARD_ICONS[key] ?? '🖨️'}
                    </span>
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
                      borderRadius: 100, padding: '4px 12px',
                      color: 'white', fontSize: 12, fontWeight: 700,
                      fontFamily: 'system-ui, sans-serif',
                    }}>
                      from AED {tmpl.basePrice}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '20px 20px 24px' }}>
                    <h3 style={{
                      fontFamily: "'Poppins', system-ui, sans-serif",
                      fontWeight: 700, fontSize: 17, color: '#1C1917',
                      margin: '0 0 6px', letterSpacing: '-0.01em',
                    }}>
                      {tmpl.label}
                    </h3>
                    <p style={{
                      color: '#78716C', fontSize: 13, fontFamily: 'system-ui, sans-serif',
                      margin: '0 0 20px', lineHeight: 1.5,
                    }}>
                      Min. {minQty} units · {tmpl.dpi} DPI · {tmpl.zones.length > 1 ? 'Double-sided' : 'Single-sided'}
                    </p>

                    {/* Quantities */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                      {tmpl.quantities.slice(0, 4).map(q => (
                        <span key={q} style={{
                          padding: '4px 10px', borderRadius: 6,
                          backgroundColor: '#F5F3EE', fontSize: 12, color: '#44403C',
                          fontFamily: 'system-ui, sans-serif', fontWeight: 500,
                        }}>{q} pcs</span>
                      ))}
                      {tmpl.quantities.length > 4 && (
                        <span style={{
                          padding: '4px 10px', borderRadius: 6,
                          backgroundColor: '#F5F3EE', fontSize: 12, color: '#78716C',
                          fontFamily: 'system-ui, sans-serif',
                        }}>+{tmpl.quantities.length - 4} more</span>
                      )}
                    </div>

                    <button
                      style={{
                        width: '100%', backgroundColor: '#1C1917', color: 'white',
                        border: 'none', borderRadius: 10, padding: '12px 16px',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        fontFamily: 'system-ui, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#C2410C'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1C1917'}
                    >
                      Design Now
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
