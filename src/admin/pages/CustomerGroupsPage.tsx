import React, { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Product { id: string; name: string; basePrice: string | number }
interface GroupPrice { id: string; productId: string; price: string; product: Product }
interface Group {
  id: string; name: string; discountPercent: string; note: string | null; isActive: boolean
  _count: { customers: number }; prices: GroupPrice[]
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{t}</span>
const money = (n: number | string) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function GroupModal({ group, onClose, onSaved }: { group: Group | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(group?.name ?? '')
  const [discount, setDiscount] = useState(group ? String(Number(group.discountPercent)) : '0')
  const [note, setNote] = useState(group?.note ?? '')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!name.trim()) return setErr('Name is required')
    setSaving(true); setErr('')
    try {
      const body = { name, discountPercent: Number(discount) || 0, note }
      if (group) await api.patch(`/customer-groups/${group.id}`, body)
      else await api.post('/customer-groups', body)
      onSaved(); onClose()
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
    finally { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 26, width: 440, maxWidth: '100%', fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: DARK }}>{group ? 'Edit Customer Type' : 'New Customer Type'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>{lbl('Name *')}<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Freelancer, Corporate, VIP" style={inp} /></label>
          <label>{lbl('Discount on catalogue prices (%)')}<input type="number" min={0} max={99} step="0.5" value={discount} onChange={e => setDiscount(e.target.value)} style={inp} />
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Applied to every product unless a special price is set for it below.</span></label>
          <label>{lbl('Note')}<input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Daily freelance designers" style={inp} /></label>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// Special per-product prices for one customer type
function PricesPanel({ group, products, onChanged }: { group: Group; products: Product[]; onChanged: () => void }) {
  const [productId, setProductId] = useState('')
  const [price, setPrice] = useState('')
  const [err, setErr] = useState('')
  const used = new Set(group.prices.map(p => p.productId))
  const d = Number(group.discountPercent)

  const add = async () => {
    if (!productId || !(Number(price) > 0)) return setErr('Choose a product and enter its special price')
    setErr('')
    try { await api.post(`/customer-groups/${group.id}/prices/${productId}`, { price: Number(price) }); setProductId(''); setPrice(''); onChanged() }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Error') }
  }
  const remove = async (pid: string) => { await api.delete(`/customer-groups/${group.id}/prices/${pid}`).catch(() => {}); onChanged() }

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 14, marginTop: 12, fontFamily: FONT }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 4 }}>Special prices — {group.name}</div>
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>Products not listed here get {d > 0 ? `${d}% off the catalogue price` : 'the catalogue price'}.</div>
      {group.prices.map(p => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #EEF2F7', fontSize: 13 }}>
          <span style={{ flex: 1 }}>{p.product.name}</span>
          <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>AED {money(p.product.basePrice)}</span>
          <b>AED {money(p.price)}</b>
          <button onClick={() => remove(p.productId)} style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>×</button>
        </div>
      ))}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginTop: 10 }}>
        <select value={productId} onChange={e => { setProductId(e.target.value); const pr = products.find(x => x.id === e.target.value); if (pr) setPrice(String(Math.round(Number(pr.basePrice) * (1 - d / 100) * 100) / 100)) }} style={inp}>
          <option value="">— product —</option>
          {products.filter(p => !used.has(p.id)).map(p => <option key={p.id} value={p.id}>{p.name} (AED {money(p.basePrice)})</option>)}
        </select>
        <input type="number" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Special price" style={inp} />
        <Btn label="Add" onClick={add} />
      </div>
      {err && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  )
}

export function CustomerGroupsPage() {
  const [data, setData] = useState<Group[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ group: Group | null } | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [g, p] = await Promise.all([
        api.get<{ data: Group[] }>('/customer-groups'),
        api.get<{ data: Product[] }>('/products?pageSize=500&isActive=true'),
      ])
      setData(g.data); setProducts(p.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const toggle = async (g: Group) => { await api.patch(`/customer-groups/${g.id}`, { isActive: !g.isActive }); load() }
  const remove = async (g: Group) => {
    if (!confirm(`Delete customer type "${g.name}"?`)) return
    try { await api.delete(`/customer-groups/${g.id}`); load() } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Error') }
  }

  const b: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT, border: '1px solid #E2E8F0', background: '#fff' }
  const rows = data.map(g => ({
    name: <div><div style={{ fontWeight: 600 }}>{g.name}</div>{g.note && <div style={{ fontSize: 11, color: '#64748B' }}>{g.note}</div>}</div>,
    discount: Number(g.discountPercent) > 0 ? <b style={{ color: '#10B981' }}>{Number(g.discountPercent)}% off</b> : '—',
    prices: g.prices.length ? `${g.prices.length} product${g.prices.length === 1 ? '' : 's'}` : '—',
    customers: g._count.customers,
    status: <Badge label={g.isActive ? 'Active' : 'Inactive'} color={g.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setOpenId(openId === g.id ? null : g.id)} style={{ ...b, color: '#1D4ED8', borderColor: '#BFDBFE' }}>Special prices</button>
        <button onClick={() => setModal({ group: g })} style={b}>Edit</button>
        <button onClick={() => toggle(g)} style={{ ...b, color: '#EA580C', borderColor: '#FED7AA' }}>{g.isActive ? 'Disable' : 'Enable'}</button>
        {g._count.customers === 0 && <button onClick={() => remove(g)} style={{ ...b, color: '#DC2626', borderColor: '#FECACA' }}>Delete</button>}
      </div>
    ),
  }))
  const open = data.find(g => g.id === openId)

  return (
    <AdminLayout title="Customer Types & Special Rates" actions={<Btn label="+ New Customer Type" onClick={() => setModal({ group: null })} />}>
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#14532D', fontFamily: FONT }}>
        Give special customers (e.g. daily freelancers) lower rates: set a <b>discount %</b> for the type and/or a <b>special price</b> per product, then pick the type on the customer (Customers → Edit). Their prices fill in automatically on walk-in sales, quotations and the POS — staff can still adjust.
      </div>
      <StatGrid>
        <StatCard label="Customer Types" value={String(data.length)} sub={`${data.filter(g => g.isActive).length} active`} />
        <StatCard label="Customers"      value={String(data.reduce((s, g) => s + g._count.customers, 0))} sub="On a special rate" color="#10B981" />
        <StatCard label="Special Prices" value={String(data.reduce((s, g) => s + g.prices.length, 0))} sub="Product-level rates" color="#7C3AED" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No customer types yet.<div style={{ marginTop: 16 }}><Btn label="+ New Customer Type" onClick={() => setModal({ group: null })} /></div></div>
        : <Table columns={[
            { key: 'name', label: 'Customer Type' }, { key: 'discount', label: 'Discount', width: 110 },
            { key: 'prices', label: 'Special Prices', width: 130 }, { key: 'customers', label: 'Customers', width: 100 },
            { key: 'status', label: 'Status', width: 100 }, { key: 'actions', label: '', width: 320 },
          ]} rows={rows} />}
      {open && <PricesPanel group={open} products={products} onChanged={load} />}
      {modal && <GroupModal group={modal.group} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
