import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

type FieldType = 'text' | 'textarea' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'file_upload'

interface FieldOption { id: string; label: string; value: string; priceModifier: number; sortOrder: number }
interface Field { id: string; label: string; type: FieldType; isRequired: boolean; helpText: string; sortOrder: number; options: FieldOption[] }

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'dropdown',    label: 'Dropdown' },
  { value: 'radio',       label: 'Radio buttons' },
  { value: 'checkbox',    label: 'Checkbox' },
  { value: 'text',        label: 'Text input' },
  { value: 'textarea',    label: 'Text area' },
  { value: 'number',      label: 'Number' },
  { value: 'file_upload', label: 'File upload' },
]

const inp = {
  padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 7,
  fontSize: 13, fontFamily: 'system-ui', color: '#0F172A',
  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box' as const,
}

// ── Option row ────────────────────────────────────────────────────────────────

function OptionRow({ option, index, total, onChange, onRemove, onMove }: {
  option: FieldOption
  index: number; total: number
  onChange: (patch: Partial<FieldOption>) => void
  onRemove: () => void
  onMove: (from: number, to: number) => void
}) {
  const dragOver = useRef(false)
  const [over, setOver] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('optIndex', String(index)); e.dataTransfer.effectAllowed = 'move' }}
      onDragOver={e => { e.preventDefault(); if (!dragOver.current) { dragOver.current = true; setOver(true) } }}
      onDragLeave={() => { dragOver.current = false; setOver(false) }}
      onDrop={e => {
        e.preventDefault(); dragOver.current = false; setOver(false)
        const from = parseInt(e.dataTransfer.getData('optIndex'))
        if (!isNaN(from) && from !== index) onMove(from, index)
      }}
      style={{
        display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 120px auto', gap: 8,
        alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9',
        borderTop: over ? '2px solid #1D4ED8' : '2px solid transparent', transition: 'border-color 0.1s',
      }}
    >
      <div style={{ color: '#CBD5E1', cursor: 'grab', fontSize: 16, paddingRight: 2, userSelect: 'none' }}>⠿</div>
      <input value={option.label} onChange={e => onChange({ label: e.target.value })}
        placeholder="Label" style={{ ...inp, width: '100%' }} />
      <input value={option.value} onChange={e => onChange({ value: e.target.value })}
        placeholder="Value (slug)" style={{ ...inp, width: '100%' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', flexShrink: 0 }}>+AED</span>
        <input type="number" value={option.priceModifier}
          onChange={e => onChange({ priceModifier: parseFloat(e.target.value) || 0 })}
          style={{ ...inp, width: '70px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <button onClick={() => index > 0 && onMove(index, index - 1)} disabled={index === 0}
          style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#E2E8F0' : '#94A3B8', padding: '1px 4px', fontSize: 10 }}>▲</button>
        <button onClick={() => index < total - 1 && onMove(index, index + 1)} disabled={index === total - 1}
          style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? '#E2E8F0' : '#94A3B8', padding: '1px 4px', fontSize: 10 }}>▼</button>
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px 4px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4.5 3.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7H4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Field card ────────────────────────────────────────────────────────────────

function FieldCard({ field, index, total, onChange, onRemove, onAddOption, onOptionChange, onOptionRemove, onOptionMove, onMove }: {
  field: Field; index: number; total: number
  onChange: (patch: Partial<Field>) => void
  onRemove: () => void
  onAddOption: () => void
  onOptionChange: (optionId: string, patch: Partial<FieldOption>) => void
  onOptionRemove: (optionId: string) => void
  onOptionMove: (from: number, to: number) => void
  onMove: (from: number, to: number) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [over, setOver] = useState(false)
  const dragOver = useRef(false)
  const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.type)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('fieldIndex', String(index)); e.dataTransfer.effectAllowed = 'move' }}
      onDragOver={e => { e.preventDefault(); if (!dragOver.current) { dragOver.current = true; setOver(true) } }}
      onDragLeave={() => { dragOver.current = false; setOver(false) }}
      onDrop={e => {
        const fromField = e.dataTransfer.getData('fieldIndex')
        dragOver.current = false; setOver(false)
        if (fromField !== '') {
          const from = parseInt(fromField)
          if (!isNaN(from) && from !== index) onMove(from, index)
        }
      }}
      style={{ backgroundColor: 'white', borderRadius: 10, border: over ? '2px solid #1D4ED8' : '2px solid #E2E8F0', overflow: 'hidden', transition: 'border-color 0.15s' }}
    >
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#FAFAFA', borderBottom: expanded ? '1px solid #E2E8F0' : 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <button onClick={() => index > 0 && onMove(index, index - 1)} disabled={index === 0}
            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', color: index === 0 ? '#E2E8F0' : '#94A3B8', padding: '1px 4px', fontSize: 11, lineHeight: 1 }}>▲</button>
          <div style={{ color: '#CBD5E1', cursor: 'grab', fontSize: 18, lineHeight: 1, userSelect: 'none' }}>⠿</div>
          <button onClick={() => index < total - 1 && onMove(index, index + 1)} disabled={index === total - 1}
            style={{ background: 'none', border: 'none', cursor: index === total - 1 ? 'default' : 'pointer', color: index === total - 1 ? '#E2E8F0' : '#94A3B8', padding: '1px 4px', fontSize: 11, lineHeight: 1 }}>▼</button>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 160px auto auto', gap: 10, alignItems: 'center' }}>
          <input value={field.label} onChange={e => onChange({ label: e.target.value })}
            placeholder="Field label" style={{ ...inp, fontWeight: 600 }} />
          <select value={field.type} onChange={e => onChange({ type: e.target.value as FieldType })}
            style={{ ...inp, cursor: 'pointer' }}>
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'system-ui', color: '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={field.isRequired} onChange={e => onChange({ isRequired: e.target.checked })}
              style={{ accentColor: '#1D4ED8', width: 14, height: 14 }} />
            Required
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setExpanded(v => !v)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, fontSize: 16 }}>
              {expanded ? '▴' : '▾'}
            </button>
            <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4.5 3.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7H4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px' }}>
          <input value={field.helpText} onChange={e => onChange({ helpText: e.target.value })}
            placeholder="Help text (optional — shown below the field)" style={{ ...inp, width: '100%', marginBottom: hasOptions ? 16 : 0 }} />
          {hasOptions && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 120px auto', gap: 8, padding: '0 0 6px', borderBottom: '1px solid #F1F5F9' }}>
                {['', 'Label', 'Value', 'Price add-on', ''].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {field.options.map((opt, i) => (
                <OptionRow key={opt.id} option={opt} index={i} total={field.options.length}
                  onChange={patch => onOptionChange(opt.id, patch)}
                  onRemove={() => onOptionRemove(opt.id)}
                  onMove={onOptionMove}
                />
              ))}
              <button onClick={onAddOption} style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: '#1D4ED8', fontFamily: 'system-ui',
                backgroundColor: '#EFF6FF', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}>+ Add option</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminProductFields() {
  const { id: productId } = useParams<{ id: string }>()
  const [productName, setProductName] = useState('')
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(0)  // count of in-flight requests
  const [error, setError] = useState('')
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const track = useCallback(<T,>(p: Promise<T>): Promise<T> => {
    setSaving(n => n + 1)
    return p.finally(() => setSaving(n => n - 1))
  }, [])

  const debounce = useCallback((key: string, fn: () => void, ms = 600) => {
    clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(fn, ms)
  }, [])

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const [prod, fieldList] = await Promise.all([
        api.get<{ name: string }>(`/products/${productId}`),
        api.get<Field[]>(`/products/${productId}/fields`),
      ])
      setProductName(prod.name)
      setFields(fieldList)
    } catch { setError('Failed to load fields') }
    finally { setLoading(false) }
  }, [productId])

  useEffect(() => { load() }, [load])

  // ── Field operations ──────────────────────────────────────────────────────

  const addField = async () => {
    const sortOrder = fields.length
    try {
      const created = await track(api.post<Field>(`/products/${productId}/fields`, {
        label: 'New Field', type: 'text', isRequired: false, helpText: '', sortOrder,
      }))
      setFields(prev => [...prev, { ...created, options: [] }])
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to add field') }
  }

  const updateFieldLocal = (id: string, patch: Partial<Field>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
    debounce(`field-${id}`, () => {
      track(api.patch(`/products/${productId}/fields/${id}`, patch)).catch(
        (e: unknown) => alert(e instanceof Error ? e.message : 'Save failed')
      )
    })
  }

  const removeField = async (id: string) => {
    if (!window.confirm('Delete this field?')) return
    setFields(prev => prev.filter(f => f.id !== id))
    try { await track(api.delete(`/products/${productId}/fields/${id}`)) }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed'); load() }
  }

  const moveField = async (from: number, to: number) => {
    const reordered = reorder(fields, from, to).map((f, i) => ({ ...f, sortOrder: i }))
    setFields(reordered)
    try {
      await track(api.post(`/products/${productId}/fields/reorder`, {
        orderedIds: reordered.map(f => f.id),
      }))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Reorder failed'); load() }
  }

  // ── Option operations ─────────────────────────────────────────────────────

  const addOption = async (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    try {
      const created = await track(api.post<FieldOption>(
        `/products/${productId}/fields/${fieldId}/options`,
        { label: '', value: '', priceModifier: 0, sortOrder: field.options.length }
      ))
      setFields(prev => prev.map(f => f.id === fieldId
        ? { ...f, options: [...f.options, created] }
        : f))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed to add option') }
  }

  const updateOptionLocal = (fieldId: string, optionId: string, patch: Partial<FieldOption>) => {
    setFields(prev => prev.map(f => f.id === fieldId
      ? { ...f, options: f.options.map(o => o.id === optionId ? { ...o, ...patch } : o) }
      : f))
    debounce(`opt-${optionId}`, () => {
      track(api.patch(
        `/products/${productId}/fields/${fieldId}/options/${optionId}`, patch
      )).catch((e: unknown) => alert(e instanceof Error ? e.message : 'Save failed'))
    })
  }

  const removeOption = async (fieldId: string, optionId: string) => {
    setFields(prev => prev.map(f => f.id === fieldId
      ? { ...f, options: f.options.filter(o => o.id !== optionId) }
      : f))
    try {
      await track(api.delete(`/products/${productId}/fields/${fieldId}/options/${optionId}`))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Delete failed'); load() }
  }

  const moveOption = async (fieldId: string, from: number, to: number) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    const reordered = reorder(field.options, from, to).map((o, i) => ({ ...o, sortOrder: i }))
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, options: reordered } : f))
    // Update sortOrder for each option via individual PATCHes
    try {
      await track(Promise.all(reordered.map(o =>
        api.patch(`/products/${productId}/fields/${fieldId}/options/${o.id}`, { sortOrder: o.sortOrder })
      )))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'Reorder failed'); load() }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const statusLabel = saving > 0 ? 'Saving…' : 'All changes saved'
  const statusColor = saving > 0 ? '#F59E0B' : '#10B981'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ width: 220, backgroundColor: '#0F172A', minHeight: '100vh', padding: '20px 16px', flexShrink: 0 }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#1D4ED8"/>
            <rect x="6" y="9" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="14" width="16" height="2.5" rx="1.25" fill="white"/>
            <rect x="6" y="19" width="10" height="2.5" rx="1.25" fill="white"/>
          </svg>
          <span style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 16, color: '#F8FAFC' }}>myprintingworld</span>
        </Link>
        <Link to="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', textDecoration: 'none', fontSize: 13, fontFamily: 'system-ui', padding: '8px 0' }}>← Back to Products</Link>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui', marginBottom: 2 }}>
              Products / {productName || '…'}
            </div>
            <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', margin: 0 }}>
              Configurator Fields
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: statusColor, fontFamily: 'system-ui', fontWeight: 500 }}>{!loading && statusLabel}</span>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#DC2626', fontSize: 13, fontFamily: 'system-ui', marginBottom: 20 }}>{error}</div>}

          <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#1E40AF', fontFamily: 'system-ui', lineHeight: 1.5 }}>
            <strong>How it works:</strong> Fields appear on the customer-facing product page in the order shown. Drag <strong>⠿</strong> or use <strong>▲ ▼</strong> to reorder. Changes save automatically.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8', fontFamily: 'system-ui' }}>Loading fields…</div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {fields.map((f, i) => (
                  <FieldCard key={f.id} field={f} index={i} total={fields.length}
                    onChange={patch => updateFieldLocal(f.id, patch)}
                    onRemove={() => removeField(f.id)}
                    onAddOption={() => addOption(f.id)}
                    onOptionChange={(oid, patch) => updateOptionLocal(f.id, oid, patch)}
                    onOptionRemove={oid => removeOption(f.id, oid)}
                    onOptionMove={(from, to) => moveOption(f.id, from, to)}
                    onMove={moveField}
                  />
                ))}
              </div>

              {fields.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontFamily: 'system-ui', fontSize: 14 }}>
                  No fields yet. Add your first configurator field below.
                </div>
              )}

              <button onClick={addField} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 10,
                border: '2px dashed #CBD5E1', backgroundColor: 'transparent',
                fontSize: 14, fontWeight: 600, color: '#64748B', fontFamily: 'system-ui',
                cursor: 'pointer', justifyContent: 'center', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1D4ED8'; (e.currentTarget as HTMLElement).style.color = '#1D4ED8' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.color = '#64748B' }}
              >+ Add Field</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
