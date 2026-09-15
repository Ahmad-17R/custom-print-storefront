import React, { useEffect, useState } from 'react'
import { AdminLayout, Btn } from '../components/AdminLayout'
import {
  getStorefrontSettings, saveStorefrontSettings, uploadStorefrontImage,
  fetchCatalog, catalogImageUrl,
  type StorefrontSettings, type StorefrontLink, type CatalogProduct,
} from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8,
  fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }

function Field({ label, value, onChange, placeholder, textarea }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={labelStyle}>{label}</span>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />}
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: DARK }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 18 }}>
      <h3 style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: DARK, fontFamily: FONT }}>{title}</h3>
      {desc && <p style={{ margin: '0 0 14px', fontSize: 12, color: '#94A3B8' }}>{desc}</p>}
      {children}
    </div>
  )
}

// Small inline image uploader used for hero images and collection tiles.
function ImageUploader({ url, onChange, height = 120 }: { url: string; onChange: (url: string) => void; height?: number }) {
  const [busy, setBusy] = useState(false)
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try { const { url } = await uploadStorefrontImage(file); onChange(url) }
    catch { /* surfaced by caller if needed */ }
    finally { setBusy(false) }
  }
  return (
    <div>
      {url && <img src={catalogImageUrl(url)} alt="" style={{ width: '100%', height, objectFit: 'cover', borderRadius: 8, marginBottom: 8, background: '#F1F5F9', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label style={{ display: 'inline-block', padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: DARK, cursor: busy ? 'default' : 'pointer', background: '#F8FAFC' }}>
          {busy ? 'Uploading…' : url ? 'Change image' : 'Upload image'}
          <input type="file" accept="image/*" onChange={pick} disabled={busy} style={{ display: 'none' }} />
        </label>
        {url && !busy && <button type="button" onClick={() => onChange('')} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Remove</button>}
      </div>
    </div>
  )
}

// Editor for a list of {title,image,href} tiles (collections & must-haves).
function LinkListEditor({ items, onChange }: { items: StorefrontLink[]; onChange: (items: StorefrontLink[]) => void }) {
  const update = (i: number, patch: Partial<StorefrontLink>) => onChange(items.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () => onChange([...items, { title: '', image: '', href: '/catalog' }])
  return (
    <div>
      {items.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 12px' }}>No custom tiles — the storefront shows its built-in defaults. Add tiles below to override.</p>}
      {items.map((it, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14, padding: 14, border: '1px solid #F1F5F9', borderRadius: 10, marginBottom: 12 }}>
          <ImageUploader url={it.image} onChange={url => update(i, { image: url })} height={80} />
          <div>
            <Field label="Title" value={it.title} onChange={v => update(i, { title: v })} placeholder="e.g. Corporate gifting" />
            <Field label="Links to (path)" value={it.href} onChange={v => update(i, { href: v })} placeholder="/catalog?category=Apparel & Gifts" />
            <button type="button" onClick={() => remove(i)} style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Remove tile</button>
          </div>
        </div>
      ))}
      <Btn label="+ Add tile" variant="secondary" onClick={add} />
    </div>
  )
}

export function StorefrontSettingsPage() {
  const [s, setS] = useState<StorefrontSettings | null>(null)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([getStorefrontSettings(), fetchCatalog().catch(() => [])])
      .then(([settings, prods]) => { setS(settings); setProducts(prods) })
      .catch(e => setMsg(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !s) {
    return <AdminLayout title="Storefront"><div style={{ padding: 40, color: '#64748B', fontFamily: FONT }}>Loading…</div></AdminLayout>
  }

  // Section-scoped setters keep updates immutable and concise.
  const set = <K extends keyof StorefrontSettings>(key: K, patch: Partial<StorefrontSettings[K]>) =>
    setS(prev => prev ? { ...prev, [key]: { ...prev[key], ...patch } } : prev)

  const save = async () => {
    setSaving(true); setMsg('')
    try { const saved = await saveStorefrontSettings(s); setS(saved); setMsg('Saved ✓') }
    catch (e: unknown) { setMsg(e instanceof Error ? e.message : 'Save failed') }
    finally { setSaving(false) }
  }

  const toggleFeatured = (slug: string) => {
    const cur = s.featured.productSlugs
    set('featured', { productSlugs: cur.includes(slug) ? cur.filter(x => x !== slug) : [...cur, slug] })
  }

  return (
    <AdminLayout title="Storefront" actions={
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {msg && <span style={{ fontSize: 13, color: msg.includes('✓') ? '#10B981' : '#EF4444', fontFamily: FONT }}>{msg}</span>}
        <Btn label={saving ? 'Saving…' : 'Save changes'} onClick={save} />
      </div>
    }>
      <div style={{ maxWidth: 760 }}>
        <Card title="Announcement bar" desc="The thin bar at the very top of the storefront.">
          <Toggle label="Show announcement bar" checked={s.announcement.enabled} onChange={v => set('announcement', { enabled: v })} />
          <Field label="Text" value={s.announcement.text} onChange={v => set('announcement', { text: v })} />
        </Card>

        <Card title="Promo banner" desc="The dark banner with your current offer / discount code.">
          <Toggle label="Show promo banner" checked={s.promo.enabled} onChange={v => set('promo', { enabled: v })} />
          <Field label="Message" value={s.promo.text} onChange={v => set('promo', { text: v })} placeholder="Buy More, Save More: AED 220 off…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Discount code" value={s.promo.code} onChange={v => set('promo', { code: v })} placeholder="MPW30" />
            <Field label="Detail (e.g. expiry)" value={s.promo.detail} onChange={v => set('promo', { detail: v })} placeholder="Ends Aug 31" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Button label" value={s.promo.ctaLabel} onChange={v => set('promo', { ctaLabel: v })} placeholder="Save now" />
            <Field label="Button links to" value={s.promo.ctaHref} onChange={v => set('promo', { ctaHref: v })} placeholder="/catalog" />
          </div>
        </Card>

        <Card title="Hero" desc="The big banner at the top of the homepage.">
          <Field label="Headline" value={s.hero.headline} onChange={v => set('hero', { headline: v })} />
          <Field label="Sub-text" value={s.hero.subtext} onChange={v => set('hero', { subtext: v })} textarea />
          <Field label="Tagline" value={s.hero.tagline} onChange={v => set('hero', { tagline: v })} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Primary button label" value={s.hero.primaryLabel} onChange={v => set('hero', { primaryLabel: v })} />
            <Field label="Primary button links to" value={s.hero.primaryHref} onChange={v => set('hero', { primaryHref: v })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Secondary button label" value={s.hero.secondaryLabel} onChange={v => set('hero', { secondaryLabel: v })} />
            <Field label="Secondary button links to" value={s.hero.secondaryHref} onChange={v => set('hero', { secondaryHref: v })} />
          </div>
          <span style={labelStyle}>Hero images (leave empty to use defaults)</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {s.hero.images.map((img, i) => (
              <ImageUploader key={i} url={img} height={70} onChange={url => set('hero', { images: url ? s.hero.images.map((x, idx) => idx === i ? url : x) : s.hero.images.filter((_, idx) => idx !== i) })} />
            ))}
          </div>
          <Btn label="+ Add hero image" variant="secondary" onClick={() => set('hero', { images: [...s.hero.images, ''] })} />
        </Card>

        <Card title="Featured products" desc="Pick which products appear in the homepage row. Leave all unchecked to show the first products automatically.">
          <Field label="Section title" value={s.featured.title} onChange={v => set('featured', { title: v })} />
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #F1F5F9', borderRadius: 8, padding: 8 }}>
            {products.length === 0 && <div style={{ fontSize: 12, color: '#94A3B8', padding: 8 }}>No products yet.</div>}
            {products.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={s.featured.productSlugs.includes(p.slug)} onChange={() => toggleFeatured(p.slug)} />
                {p.name} <span style={{ color: '#94A3B8', fontSize: 11 }}>· {p.category?.name ?? ''}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card title="Shop by collection" desc="Curated tiles below the featured row.">
          <Toggle label="Show this section" checked={s.collections.enabled} onChange={v => set('collections', { enabled: v })} />
          <Field label="Section title" value={s.collections.title} onChange={v => set('collections', { title: v })} />
          <LinkListEditor items={s.collections.items} onChange={items => set('collections', { items })} />
        </Card>

        <Card title="Explore even more must-haves" desc="A second row of curated tiles.">
          <Toggle label="Show this section" checked={s.mustHaves.enabled} onChange={v => set('mustHaves', { enabled: v })} />
          <Field label="Section title" value={s.mustHaves.title} onChange={v => set('mustHaves', { title: v })} />
          <LinkListEditor items={s.mustHaves.items} onChange={items => set('mustHaves', { items })} />
        </Card>

        <Card title="Web & IT services banner" desc="The dark banner promoting your website-building / IT services.">
          <Toggle label="Show this banner" checked={s.webBanner.enabled} onChange={v => set('webBanner', { enabled: v })} />
          <Field label="Eyebrow (small label)" value={s.webBanner.eyebrow} onChange={v => set('webBanner', { eyebrow: v })} />
          <Field label="Headline" value={s.webBanner.headline} onChange={v => set('webBanner', { headline: v })} />
          <Field label="Pitch text" value={s.webBanner.text} onChange={v => set('webBanner', { text: v })} textarea />
          <Field label="Feature chips (comma-separated)" value={s.webBanner.features.join(', ')} onChange={v => set('webBanner', { features: v.split(',').map(x => x.trim()).filter(Boolean) })} placeholder="Business websites, Online stores, Hosting & domains" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Main button label" value={s.webBanner.ctaLabel} onChange={v => set('webBanner', { ctaLabel: v })} />
            <Field label="Main button links to (blank = dial phone)" value={s.webBanner.ctaHref} onChange={v => set('webBanner', { ctaHref: v })} placeholder="/catalog or leave blank" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Secondary button label" value={s.webBanner.secondaryLabel} onChange={v => set('webBanner', { secondaryLabel: v })} />
            <Field label="Secondary button links to" value={s.webBanner.secondaryHref} onChange={v => set('webBanner', { secondaryHref: v })} />
          </div>
        </Card>

        <Card title="Other sections">
          <Toggle label="Show 'Tools to help build your business'" checked={s.tools.enabled} onChange={v => set('tools', { enabled: v })} />
          <Toggle label="Show the Instagram / made-by-you gallery" checked={s.gallery.enabled} onChange={v => set('gallery', { enabled: v })} />
        </Card>

        <Card title="Contact">
          <Field label="Phone number" value={s.contact.phone} onChange={v => set('contact', { phone: v })} placeholder="+971 4 000 0000" />
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 40 }}>
          {msg && <span style={{ fontSize: 13, color: msg.includes('✓') ? '#10B981' : '#EF4444', alignSelf: 'center', fontFamily: FONT }}>{msg}</span>}
          <Btn label={saving ? 'Saving…' : 'Save changes'} onClick={save} />
        </div>
      </div>
    </AdminLayout>
  )
}
