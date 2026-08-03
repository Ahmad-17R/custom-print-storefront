

function StampMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
      <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
      <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
      <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
    </svg>
  )
}

const cols: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Products',
    links: [
      { label: 'Business Cards', href: '/editor?product=business_card' },
      { label: 'Rounded Business Cards', href: '/editor?product=business_card_rounded' },
      { label: 'Square Business Cards', href: '/editor?product=business_card_square' },
      { label: 'Circle Business Cards', href: '/editor?product=business_card_circle' },
      { label: 'Letterhead (A4)', href: '/editor?product=letterhead' },
      { label: 'Custom Pens', href: '/editor?product=pen' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About MyPrintingWorld', href: '#' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Quality guarantee', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Contact us', href: '#' },
      { label: 'Design templates', href: '#' },
      { label: 'File specifications', href: '#' },
      { label: 'Shipping info', href: '#' },
      { label: 'FAQ', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy policy', href: '#' },
      { label: 'Terms of service', href: '#' },
      { label: 'Refund policy', href: '#' },
    ],
  },
]

export default function Footer() {
  const linkStyle = {
    color: '#64748B', textDecoration: 'none', fontSize: 14,
    fontFamily: 'system-ui, sans-serif', lineHeight: 1,
    transition: 'color 0.15s ease',
  } as React.CSSProperties

  return (
    <footer style={{ backgroundColor: '#0F172A', color: '#F1F5F9', marginTop: 0 }}>
      {/* Main footer grid */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '64px 24px 48px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 40,
      }}>
        {/* Brand column */}
        <div style={{ gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <StampMark />
            <span style={{
              fontFamily: "'Poppins', system-ui, sans-serif",
              fontWeight: 700, fontSize: 18, color: '#F8FAFC',
              letterSpacing: '-0.02em',
            }}>myprintingworld</span>
          </div>
          <p style={{
            color: '#64748B', fontSize: 14, lineHeight: 1.6,
            fontFamily: 'system-ui, sans-serif', margin: 0, maxWidth: 220,
          }}>
            UAE's modern custom print studio. Designed online, printed to perfection, delivered across the Emirates.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {/* Social icons (SVG) */}
            {[
              { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
              { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
            ].map(s => (
              <a
                key={s.label} href="#" aria-label={s.label}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#64748B', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(194,65,12,0.3)'; (e.currentTarget as HTMLElement).style.color = '#F8FAFC' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#64748B' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.path}/>
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {cols.map(col => (
          <div key={col.heading}>
            <p style={{
              color: '#F1F5F9', fontWeight: 600, fontSize: 13,
              fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em',
              textTransform: 'uppercase', margin: '0 0 16px',
            }}>
              {col.heading}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map(l => (
                <a
                  key={l.label} href={l.href}
                  style={linkStyle}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F1F5F9'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 24px',
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <p style={{ color: '#64748B', fontSize: 13, fontFamily: 'system-ui, sans-serif', margin: 0 }}>
          © {new Date().getFullYear()} MyPrintingWorld. All rights reserved. Designed &amp; printed in UAE.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Visa', 'Mastercard', 'Apple Pay'].map(m => (
            <span key={m} style={{
              backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4,
              padding: '4px 10px', fontSize: 12, color: '#64748B',
              fontFamily: 'system-ui, sans-serif', fontWeight: 500,
            }}>{m}</span>
          ))}
        </div>
      </div>
    </footer>
  )
}
