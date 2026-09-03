import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Warehouse { id: string; name: string; city: string | null }
interface FixedAsset {
  id: string; name: string; category: string | null
  purchaseDate: string; purchaseValue: string; currentValue: string
  usefulLifeYears: number | null; isActive: boolean; createdAt: string
  warehouse?: { id: string; name: string; city: string | null }
}

const CATEGORIES = ['Equipment', 'Machinery', 'Furniture', 'Vehicles', 'IT Equipment', 'Buildings', 'Land', 'Other']

function monthlyDepreciation(asset: FixedAsset): number | null {
  if (!asset.usefulLifeYears || asset.usefulLifeYears <= 0) return null
  return Math.round((Number(asset.purchaseValue) / (asset.usefulLifeYears * 12)) * 100) / 100
}

// ── Add / Edit Modal ─────────────────────────────────────────────────────────
function Modal({ item, warehouses, onClose, onSaved }: {
  item: Partial<FixedAsset> | null; warehouses: Warehouse[]
  onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!item?.id
  const [warehouseId, setWarehouse] = useState(item?.warehouse?.id ?? '')
  const [name, setName]             = useState(item?.name ?? '')
  const [category, setCategory]     = useState(item?.category ?? '')
  const [purchaseDate, setDate]     = useState(item?.purchaseDate ? item.purchaseDate.slice(0, 10) : '')
  const [purchaseValue, setValue]   = useState(item?.purchaseValue ? String(Number(item.purchaseValue)) : '')
  const [usefulLifeYears, setLife]  = useState(item?.usefulLifeYears ? String(item.usefulLifeYears) : '')
  const [currentValue, setCurrent]  = useState(item?.currentValue ? String(Number(item.currentValue)) : '')
  const [isActive, setActive]       = useState(item?.isActive ?? true)
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')

  // Sync warehouse default once list loads
  useEffect(() => {
    if (!warehouseId && warehouses.length > 0) setWarehouse(warehouses[0].id)
  }, [warehouses.length])

  const save = async () => {
    if (!isEdit && !warehouseId) { setErr('Please select a warehouse'); return }
    setSaving(true); setErr('')
    try {
      if (isEdit) {
        await api.patch(`/assets/${item!.id}`, {
          name, category: category || null,
          currentValue: Number(currentValue),
          usefulLifeYears: usefulLifeYears ? Number(usefulLifeYears) : null,
          isActive,
        })
      } else {
        await api.post('/assets', {
          warehouseId, name, category: category || null,
          purchaseDate, purchaseValue: Number(purchaseValue),
          usefulLifeYears: usefulLifeYears ? Number(usefulLifeYears) : null,
        })
      }
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  const monthly = usefulLifeYears && purchaseValue
    ? Math.round((Number(purchaseValue) / (Number(usefulLifeYears) * 12)) * 100) / 100
    : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 520, padding: 28, fontFamily: FONT, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{isEdit ? 'Edit Asset' : 'Add Fixed Asset'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!isEdit && (
            <label>
              {lbl('Warehouse / Branch *')}
              <select style={inp} value={warehouseId} onChange={e => setWarehouse(e.target.value)}>
                <option value="">— select warehouse —</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}{w.city ? ` — ${w.city}` : ''}</option>
                ))}
              </select>
            </label>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ gridColumn: '1/-1' }}>
              {lbl('Asset Name *')}
              <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Roland Printing Machine" />
            </label>
            <label>
              {lbl('Category')}
              <select style={inp} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">— select —</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>
              {lbl('Useful Life (years)')}
              <input type="number" min="1" style={inp} value={usefulLifeYears} onChange={e => setLife(e.target.value)} placeholder="e.g. 5" />
            </label>

            {!isEdit ? (
              <>
                <label>
                  {lbl('Purchase Date *')}
                  <input type="date" style={inp} value={purchaseDate} onChange={e => setDate(e.target.value)} />
                </label>
                <label>
                  {lbl('Purchase Value (AED) *')}
                  <input type="number" min="0" step="0.01" style={inp} value={purchaseValue} onChange={e => setValue(e.target.value)} />
                </label>
              </>
            ) : (
              <label style={{ gridColumn: '1/-1' }}>
                {lbl('Current Book Value (AED)')}
                <input type="number" min="0" step="0.01" style={inp} value={currentValue} onChange={e => setCurrent(e.target.value)} />
              </label>
            )}
          </div>

          {/* Monthly depreciation preview */}
          {monthly !== null && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0369A1' }}>
              Monthly depreciation: <strong>AED {monthly.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</strong>
              <span style={{ color: '#64748B', fontSize: 12 }}> over {usefulLifeYears} years</span>
            </div>
          )}

          {isEdit && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} /> Active
            </label>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

// ── Depreciation Panel ───────────────────────────────────────────────────────
function DepreciationPanel({ asset, onClose, onSaved }: {
  asset: FixedAsset; onClose: () => void; onSaved: () => void
}) {
  const monthly = monthlyDepreciation(asset)
  const today = new Date().toISOString().slice(0, 10)
  const [amount, setAmount]   = useState(monthly !== null ? String(monthly) : '')
  const [date, setDate]       = useState(today)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const remaining = Number(asset.currentValue)
  const pctUsed = Number(asset.purchaseValue) > 0
    ? ((Number(asset.purchaseValue) - remaining) / Number(asset.purchaseValue)) * 100
    : 0

  const record = async () => {
    if (!amount || Number(amount) <= 0) { setErr('Enter a valid amount'); return }
    if (Number(amount) > remaining) { setErr(`Amount exceeds current book value (AED ${remaining.toLocaleString()})`); return }
    setSaving(true); setErr('')
    try {
      await api.post(`/assets/${asset.id}/depreciate`, { amount: Number(amount), date, notes: notes || null })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.response?.data?.error ?? e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 4 }}>Record Depreciation</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>{asset.name}</div>

        {/* Asset value summary */}
        <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>PURCHASE VALUE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DARK }}>AED {Number(asset.purchaseValue).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>BOOK VALUE NOW</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: remaining > 0 ? '#10B981' : '#EF4444' }}>AED {remaining.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>DEPRECIATED</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#F59E0B' }}>{pctUsed.toFixed(1)}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(pctUsed, 100)}%`, background: pctUsed >= 100 ? '#EF4444' : pctUsed >= 80 ? '#F59E0B' : '#10B981', borderRadius: 999, transition: 'width .3s' }} />
        </div>

        {monthly !== null && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0369A1', marginBottom: 16 }}>
            Suggested monthly amount: <strong>AED {monthly.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</strong>
            <button onClick={() => setAmount(String(monthly))} style={{ marginLeft: 12, fontSize: 12, padding: '2px 8px', borderRadius: 5, border: '1px solid #BAE6FD', background: '#fff', cursor: 'pointer', color: '#0369A1', fontFamily: FONT }}>
              Use this
            </button>
          </div>
        )}

        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <label>
            {lbl('Depreciation Amount (AED) *')}
            <input type="number" min="0.01" step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} />
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              {lbl('Date')}
              <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label>
              {lbl('Notes')}
              <input style={inp} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Monthly — Aug 2026" />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Recording…' : 'Record Depreciation'} onClick={record} />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
const COLS = [
  { key: 'name',          label: 'Asset Name'             },
  { key: 'warehouse',     label: 'Location',   width: 150 },
  { key: 'category',      label: 'Category',   width: 110 },
  { key: 'purchaseValue', label: 'Cost (AED)', width: 120 },
  { key: 'currentValue',  label: 'Book Value', width: 120 },
  { key: 'monthly',       label: 'Monthly Dep.', width: 120 },
  { key: 'depreciated',   label: 'Depreciated', width: 110 },
  { key: 'actions',       label: '',           width: 160 },
]

export function FixedAssetsPage() {
  const [data, setData]             = useState<FixedAsset[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading]       = useState(true)
  const [q, setQ]                   = useState('')
  const [modal, setModal]           = useState<Partial<FixedAsset> | null>(null)
  const [depPanel, setDepPanel]     = useState<FixedAsset | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, w] = await Promise.all([
        api.get<{ data: FixedAsset[] }>('/assets?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100&isActive=true'),
      ])
      setData(r.data); setWarehouses(w.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    (r.category ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.warehouse?.name ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const totalCost = data.filter(r => r.isActive).reduce((s, r) => s + Number(r.purchaseValue), 0)
  const totalBook = data.filter(r => r.isActive).reduce((s, r) => s + Number(r.currentValue), 0)
  const totalLost = totalCost - totalBook

  const rows = filtered.map(r => {
    const monthly = monthlyDepreciation(r)
    const pctUsed = Number(r.purchaseValue) > 0
      ? ((Number(r.purchaseValue) - Number(r.currentValue)) / Number(r.purchaseValue)) * 100
      : 0
    const fullyDepreciated = Number(r.currentValue) <= 0

    return {
      name: (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
          {!r.isActive && <Badge label="Inactive" color="#94A3B8" />}
          {fullyDepreciated && <Badge label="Fully Depreciated" color="#EF4444" />}
        </div>
      ),
      warehouse: r.warehouse
        ? <span style={{ fontSize: 12 }}>{r.warehouse.name}{r.warehouse.city ? ` — ${r.warehouse.city}` : ''}</span>
        : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
      category: r.category ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
      purchaseValue: <span style={{ fontVariantNumeric: 'tabular-nums' }}>AED {Number(r.purchaseValue).toLocaleString()}</span>,
      currentValue: (
        <strong style={{ color: fullyDepreciated ? '#EF4444' : '#10B981', fontVariantNumeric: 'tabular-nums' }}>
          AED {Number(r.currentValue).toLocaleString()}
        </strong>
      ),
      monthly: monthly !== null
        ? <span style={{ fontSize: 12, color: '#64748B', fontVariantNumeric: 'tabular-nums' }}>AED {monthly.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>
        : <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>,
      depreciated: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pctUsed, 100)}%`, background: pctUsed >= 100 ? '#EF4444' : pctUsed >= 80 ? '#F59E0B' : '#10B981', borderRadius: 999 }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748B', minWidth: 32 }}>{pctUsed.toFixed(0)}%</span>
        </div>
      ),
      actions: (
        <div style={{ display: 'flex', gap: 4 }}>
          {r.isActive && !fullyDepreciated && (
            <button onClick={() => setDepPanel(r)} style={{ ...btnS, border: 'none', background: '#1D4ED8', color: '#fff' }}>
              Depreciate
            </button>
          )}
          <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        </div>
      ),
    }
  })

  return (
    <AdminLayout title="Fixed Assets" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, category…" />
        <Btn label="+ Add Asset" onClick={() => setModal({})} />
      </div>
    }>
      <StatGrid>
        <StatCard label="Total Assets"   value={String(data.length)}                                      sub="All registered assets" />
        <StatCard label="Active"         value={String(data.filter(r => r.isActive).length)}              sub="In service"            color="#10B981" />
        <StatCard label="Total Cost"     value={`AED ${totalCost.toLocaleString()}`}                      sub="Original purchase value" color="#1D4ED8" />
        <StatCard label="Book Value"     value={`AED ${totalBook.toLocaleString()}`}                      sub="Current value after depreciation" color="#8B5CF6" />
        <StatCard label="Total Depreciated" value={`AED ${totalLost.toLocaleString()}`}                   sub="Value written off"     color="#F59E0B" />
      </StatGrid>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />
      }

      {modal !== null && (
        <Modal item={modal} warehouses={warehouses} onClose={() => setModal(null)} onSaved={load} />
      )}
      {depPanel !== null && (
        <DepreciationPanel asset={depPanel} onClose={() => setDepPanel(null)} onSaved={load} />
      )}
    </AdminLayout>
  )
}
