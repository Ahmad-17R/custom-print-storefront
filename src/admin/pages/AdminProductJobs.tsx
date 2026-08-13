import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminLayout, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Supplier { id: string; name: string }
interface JobStep {
  id: string
  name: string
  supplierId: string | null
  note: string | null
  sortOrder: number
  supplier: { id: string; name: string } | null
}

const btnBase: React.CSSProperties = {
  fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0',
  borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT,
}
const dangerBtn: React.CSSProperties = {
  ...btnBase, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626',
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function AdminProductJobs() {
  const { id: productId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [productName, setProductName] = useState('')
  const [steps, setSteps]             = useState<JobStep[]>([])
  const [suppliers, setSuppliers]     = useState<Supplier[]>([])
  const [saving, setSaving]           = useState(0)
  const [dragIdx, setDragIdx]         = useState<number | null>(null)
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const track = <T,>(p: Promise<T>) => {
    setSaving(s => s + 1)
    return p.finally(() => setSaving(s => s - 1))
  }

  const load = async () => {
    const [prod, stps, sups] = await Promise.all([
      api.get<{ id: string; name: string }>(`/products/${productId}`),
      api.get<JobStep[]>(`/products/${productId}/jobs`),
      api.get<{ data: Supplier[] }>('/suppliers?pageSize=200'),
    ])
    setProductName(prod.name)
    setSteps(stps)
    setSuppliers(sups.data.filter(s => (s as any).isActive !== false))
  }

  useEffect(() => { load() }, [productId])

  const addStep = async () => {
    const newStep = await track(api.post<JobStep>(`/products/${productId}/jobs`, { name: 'New Job' }))
    setSteps(s => [...s, newStep])
  }

  const removeStep = async (step: JobStep) => {
    if (!window.confirm(`Remove "${step.name}" job step?`)) return
    setSteps(s => s.filter(x => x.id !== step.id))
    await track(api.delete(`/products/${productId}/jobs/${step.id}`))
  }

  const updateStep = (stepId: string, patch: Partial<Pick<JobStep, 'name' | 'supplierId' | 'note'>>) => {
    setSteps(s => s.map(x => x.id === stepId ? { ...x, ...patch } : x))
    clearTimeout(debounceRef.current[stepId])
    debounceRef.current[stepId] = setTimeout(() => {
      track(api.patch(`/products/${productId}/jobs/${stepId}`, patch))
    }, 600)
  }

  const moveStep = async (from: number, to: number) => {
    const next = reorder(steps, from, to)
    setSteps(next)
    await track(api.post(`/products/${productId}/jobs/reorder`, { orderedIds: next.map(s => s.id) }))
  }

  return (
    <AdminLayout
      title={productName ? `Jobs — ${productName}` : 'Jobs'}
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: saving > 0 ? '#F59E0B' : '#10B981', fontFamily: FONT }}>
            {saving > 0 ? 'Saving…' : 'All changes saved'}
          </span>
          <Btn label="+ Add Job Step" onClick={addStep} />
          <Btn label="← Back to Products" variant="secondary" onClick={() => navigate('/admin/products')} />
        </div>
      }
    >
      {steps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>
          No job steps yet. Click "Add Job Step" to define the production workflow for this product.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((step, idx) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={e => { e.preventDefault() }}
              onDrop={e => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) moveStep(dragIdx, idx); setDragIdx(null) }}
              onDragEnd={() => setDragIdx(null)}
              style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '16px 20px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
                opacity: dragIdx === idx ? 0.4 : 1, cursor: 'grab',
              }}
            >
              {/* Drag handle + order number */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 4, minWidth: 28 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: FONT }}>#{idx + 1}</span>
                <button onClick={() => idx > 0 && moveStep(idx, idx - 1)} disabled={idx === 0}
                  style={{ ...btnBase, padding: '2px 6px', opacity: idx === 0 ? 0.3 : 1 }}>▲</button>
                <button onClick={() => idx < steps.length - 1 && moveStep(idx, idx + 1)} disabled={idx === steps.length - 1}
                  style={{ ...btnBase, padding: '2px 6px', opacity: idx === steps.length - 1 ? 0.3 : 1 }}>▼</button>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Job Name</span>
                  <input
                    value={step.name}
                    onChange={e => updateStep(step.id, { name: e.target.value })}
                    placeholder="e.g. Printing, Cutting, Lamination…"
                    style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: FONT, outline: 'none' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Supplier <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></span>
                  <select
                    value={step.supplierId ?? ''}
                    onChange={e => updateStep(step.id, { supplierId: e.target.value || null })}
                    style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: FONT, outline: 'none' }}
                  >
                    <option value="">— In-house —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Note <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></span>
                  <input
                    value={step.note ?? ''}
                    onChange={e => updateStep(step.id, { note: e.target.value })}
                    placeholder="Any instructions for this step…"
                    style={{ padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, fontFamily: FONT, outline: 'none' }}
                  />
                </label>
              </div>

              {/* Delete */}
              <button onClick={() => removeStep(step)} style={{ ...dangerBtn, marginTop: 4 }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
