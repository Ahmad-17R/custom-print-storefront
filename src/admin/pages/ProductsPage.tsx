import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const API_BASE = 'http://localhost:4000'

interface Product { id: string; name: string; slug: string; brandId: string; categoryId: string; isActive: boolean; variantCount: number; createdAt: string }
interface Brand    { id: string; name: string }
interface Category { id: string; name: string }
interface ProductImage { id: string; url: string; altText: string | null; sortOrder: number; isMain: boolean }

const COLS = [
  { key: 'name',         label: 'Product Name' },
  { key: 'brand',        label: 'Brand',    width: 150 },
  { key: 'category',     label: 'Category', width: 150 },
  { key: 'isActive',     label: 'Status',   width: 100 },
  { key: 'createdAt',    label: 'Created',  width: 110 },
  { key: 'actions',      label: '',         width: 280 },
]

function Modal({ product, brands, categories, onClose, onSave }: {
  product: Partial<Product> | null
  brands: Brand[]; categories: Category[]
  onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState({ name: product?.name ?? '', brandId: product?.brandId ?? brands[0]?.id ?? '', categoryId: product?.categoryId ?? categories[0]?.id ?? '', description: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  if (product === null) return null
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return setErr('Name is required')
    if (!form.brandId)     return setErr('Select a brand')
    if (!form.categoryId)  return setErr('Select a category')
    setLoading(true)
    try {
      if (product.id) await api.patch(`/products/${product.id}`, { name: form.name })
      else            await api.post('/products', form)
      onSave(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480, fontFamily: FONT, maxWidth: "calc(100vw - 32px)", boxSizing: "border-box" as const }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{product.id ? 'Edit Product' : 'New Product'}</h2>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Product Name *</span>
          <input value={form.name} onChange={e => f('name', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        {!product.id && (
          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Description</span>
            <input value={form.description} onChange={e => f('description', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Brand *</span>
            <select value={form.brandId} onChange={e => f('brandId', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              <option value="">Select brand…</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Category *</span>
            <select value={form.categoryId} onChange={e => f('categoryId', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={loading ? 'Saving…' : 'Save Product'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

function PhotosModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [images, setImages]     = useState<ProductImage[]>([])
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    setLoading(true)
    try {
      const imgs = await api.get<ProductImage[]>(`/products/${product.id}/images`)
      setImages(imgs)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [product.id])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      await fetch(`${API_BASE}/api/v1/products/${product.id}/images`, { method: 'POST', body: fd })
      await load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const setMain = async (img: ProductImage) => {
    await api.patch(`/products/${product.id}/images/${img.id}`, { isMain: true })
    load()
  }

  const remove = async (img: ProductImage) => {
    if (!window.confirm('Delete this image?')) return
    await api.delete(`/products/${product.id}/images/${img.id}`)
    load()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 640, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', fontFamily: FONT, boxSizing: 'border-box' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DARK }}>Photos — {product.name}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
            <Btn label={uploading ? 'Uploading…' : '+ Upload Photo'} onClick={() => fileRef.current?.click()} />
            <Btn label="Close" variant="secondary" onClick={onClose} />
          </div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading…</div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>No photos yet. Click "Upload Photo" to add one.</div>
        ) : (
          <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {images.map(img => (
              <div key={img.id} style={{ border: img.isMain ? '2px solid #1D4ED8' : '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <img src={`${API_BASE}${img.url}`} alt={img.altText ?? ''} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                {img.isMain && (
                  <div style={{ position: 'absolute', top: 6, left: 6, background: '#1D4ED8', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>MAIN</div>
                )}
                <div style={{ padding: '8px 8px 10px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {!img.isMain && (
                    <button onClick={() => setMain(img)} style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #E2E8F0', borderRadius: 5, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Set Main</button>
                  )}
                  <button onClick={() => remove(img)} style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #FECACA', borderRadius: 5, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProductsPage() {
  const navigate = useNavigate()
  const [data, setData]         = useState<Product[]>([])
  const [brands, setBrands]     = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [modal, setModal]       = useState<Partial<Product> | null>(null)
  const [photosProduct, setPhotosProduct] = useState<Product | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pr, br, cr] = await Promise.all([
        api.get<{ data: Product[] }>('/products?pageSize=100'),
        api.get<{ data: Brand[] }>('/brands?pageSize=100'),
        api.get<{ data: Category[] }>('/categories?pageSize=200'),
      ])
      setData(pr.data); setBrands(br.data); setCategories(cr.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggle = async (p: Product) => {
    await api.patch(`/products/${p.id}`, { isActive: !p.isActive })
    load()
  }

  const remove = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This will fail if it has active variants.`)) return
    try { await api.delete(`/products/${p.id}`); load() }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed') }
  }

  const brandMap    = Object.fromEntries(brands.map(b => [b.id, b.name]))
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(p => ({
    ...p,
    brand:    brandMap[p.brandId] ?? '—',
    category: categoryMap[p.categoryId] ?? '—',
    isActive: <Badge label={p.isActive ? 'Active' : 'Inactive'} color={p.isActive ? '#10B981' : '#64748B'} />,
    createdAt: p.createdAt.slice(0, 10),
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(p)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>
        <button onClick={() => navigate(`/admin/products/${p.id}/fields`)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Fields</button>
        <button onClick={() => navigate(`/admin/products/${p.id}/jobs`)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Jobs</button>
        <button onClick={() => setPhotosProduct(p)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Photos</button>
        <button onClick={() => toggle(p)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>{p.isActive ? 'Off' : 'On'}</button>
        <button onClick={() => remove(p)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}>Del</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Products" actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search products…" /><Btn label="+ New Product" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total" value={String(data.length)}                         sub="All products" />
        <StatCard label="Active"         value={String(data.filter(p=>p.isActive).length)}   sub="Live"          color="#10B981" />
        <StatCard label="Inactive"       value={String(data.filter(p=>!p.isActive).length)}  sub="Hidden"        color="#EF4444" />
      </StatGrid>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
               : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal product={modal} brands={brands} categories={categories} onClose={() => setModal(null)} onSave={load} />}
      {photosProduct !== null && <PhotosModal product={photosProduct} onClose={() => setPhotosProduct(null)} />}
    </AdminLayout>
  )
}
