import { useState } from 'react'
import { Link } from 'react-router-dom'

type FieldType = 'text' | 'textarea' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'file_upload'

interface FieldOption { id: string; label: string; value: string; priceModifier: number }
interface Field { id: string; label: string; type: FieldType; isRequired: boolean; helpText: string; options: FieldOption[]; sortOrder: number }

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'dropdown',    label: 'Dropdown' },
  { value: 'radio',       label: 'Radio buttons' },
  { value: 'checkbox',    label: 'Checkbox' },
  { value: 'text',        label: 'Text input' },
  { value: 'textarea',    label: 'Text area' },
  { value: 'number',      label: 'Number' },
  { value: 'file_upload', label: 'File upload' },
]

const INITIAL_FIELDS: Field[] = [
  { id: 'f1', label: 'Quantity', type: 'dropdown', isRequired: true, helpText: '', sortOrder: 0, options: [
    { id: 'o1', label: '250 cards', value: '250', priceModifier: 0 },
    { id: 'o2', label: '500 cards', value: '500', priceModifier: 25 },
    { id: 'o3', label: '1000 cards', value: '1000', priceModifier: 55 },
  ]},
  { id: 'f2', label: 'Finish', type: 'dropdown', isRequired: true, helpText: '', sortOrder: 1, options: [
    { id: 'o4', label: 'Gloss Lamination', value: 'gloss', priceModifier: 0 },
    { id: 'o5', label: 'Matte Lamination', value: 'matte', priceModifier: 5 },
    { id: 'o6', label: 'Soft Touch', value: 'soft_touch', priceModifier: 15 },
  ]},
]

const inp = {
  padding: '9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 7,
  fontSize: 13, fontFamily: 'system-ui', color: '#0F172A',
  backgroundColor: 'white', outline: 'none', boxSizing: 'border-box' as const,
}

function OptionRow({ option, onUpdate, onRemove }: {
  option: FieldOption
  onUpdate: (id: string, key: keyof FieldOption, val: string | number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
      <input value={option.label} onChange={e => onUpdate(option.id, 'label', e.target.value)}
        placeholder="Label" style={{ ...inp, width: '100%' }} />
      <input value={option.value} onChange={e => onUpdate(option.id, 'value', e.target.value)}
        placeholder="Value (slug)" style={{ ...inp, width: '100%' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'system-ui', flexShrink: 0 }}>+AED</span>
        <input type="number" value={option.priceModifier} onChange={e => onUpdate(option.id, 'priceModifier', parseFloat(e.target.value) || 0)}
          style={{ ...inp, width: '70px' }} />
      </div>
      <button onClick={() => onRemove(option.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4.5 3.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7H4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

function FieldCard({ field, onUpdate, onRemove, onAddOption, onUpdateOption, onRemoveOption }: {
  field: Field
  onUpdate: (id: string, key: keyof Field, val: unknown) => void
  onRemove: (id: string) => void
  onAddOption: (fieldId: string) => void
  onUpdateOption: (fieldId: string, optionId: string, key: keyof FieldOption, val: string | number) => void
  onRemoveOption: (fieldId: string, optionId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasOptions = ['dropdown', 'radio', 'checkbox'].includes(field.type)

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#FAFAFA', borderBottom: expanded ? '1px solid #E2E8F0' : 'none' }}>
        <div style={{ color: '#CBD5E1', cursor: 'grab', fontSize: 16 }}>⠿</div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 160px auto auto', gap: 10, alignItems: 'center' }}>
          <input value={field.label} onChange={e => onUpdate(field.id, 'label', e.target.value)}
            placeholder="Field label" style={{ ...inp, fontWeight: 600 }} />
          <select value={field.type} onChange={e => onUpdate(field.id, 'type', e.target.value as FieldType)}
            style={{ ...inp, cursor: 'pointer' }}>
            {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'system-ui', color: '#64748B', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={field.isRequired} onChange={e => onUpdate(field.id, 'isRequired', e.target.checked)}
              style={{ accentColor: '#1D4ED8', width: 14, height: 14 }} />
            Required
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setExpanded(v => !v)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, fontSize: 16 }}>
              {expanded ? '▴' : '▾'}
            </button>
            <button onClick={() => onRemove(field.id)} style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5.5 3.5V2h3v1.5M4.5 3.5v7a.5.5 0 00.5.5h4a.5.5 0 00.5-.5v-7H4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '14px 16px' }}>
          <input value={field.helpText} onChange={e => onUpdate(field.id, 'helpText', e.target.value)}
            placeholder="Help text (optional — shown below the field)" style={{ ...inp, width: '100%', marginBottom: hasOptions ? 16 : 0 }} />

          {hasOptions && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto', gap: 8, padding: '0 0 6px', borderBottom: '1px solid #F1F5F9' }}>
                {['Label', 'Value', 'Price add-on', ''].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', fontFamily: 'system-ui', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                ))}
              </div>
              {field.options.map(opt => (
                <OptionRow key={opt.id} option={opt}
                  onUpdate={(oid, key, val) => onUpdateOption(field.id, oid, key, val)}
                  onRemove={oid => onRemoveOption(field.id, oid)}
                />
              ))}
              <button onClick={() => onAddOption(field.id)} style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: '#1D4ED8', fontFamily: 'system-ui',
                backgroundColor: '#EFF6FF', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
              }}>
                + Add option
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AdminProductFields() {
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS)
  const [saved, setSaved] = useState(false)

  const addField = () => {
    const newField: Field = {
      id: `f${Date.now()}`, label: 'New Field', type: 'text',
      isRequired: false, helpText: '', sortOrder: fields.length, options: [],
    }
    setFields(prev => [...prev, newField])
  }

  const updateField = (id: string, key: keyof Field, val: unknown) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id))

  const addOption = (fieldId: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? {
      ...f, options: [...f.options, { id: `o${Date.now()}`, label: '', value: '', priceModifier: 0 }]
    } : f))
  }

  const updateOption = (fieldId: string, optionId: string, key: keyof FieldOption, val: string | number) => {
    setFields(prev => prev.map(f => f.id === fieldId ? {
      ...f, options: f.options.map(o => o.id === optionId ? { ...o, [key]: val } : o)
    } : f))
  }

  const removeOption = (fieldId: string, optionId: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? {
      ...f, options: f.options.filter(o => o.id !== optionId)
    } : f))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Simple sidebar strip */}
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
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', textDecoration: 'none', fontSize: 13, fontFamily: 'system-ui', padding: '8px 0' }}>← Back to Dashboard</Link>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'system-ui', marginBottom: 2 }}>
              Products / Business Cards
            </div>
            <h1 style={{ fontFamily: "'Poppins', system-ui", fontWeight: 700, fontSize: 20, color: '#0F172A', margin: 0 }}>
              Configurator Fields
            </h1>
          </div>
          <button onClick={handleSave} style={{
            padding: '9px 20px', backgroundColor: saved ? '#10B981' : '#1D4ED8',
            color: 'white', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, fontFamily: 'system-ui', cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px' }}>
          <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#1E40AF', fontFamily: 'system-ui', lineHeight: 1.5 }}>
            <strong>How it works:</strong> Fields appear on the customer-facing product page. For Dropdown / Radio / Checkbox fields, add options below and set a price modifier — this amount is added to the base price when the customer selects that option.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
            {fields.map(f => (
              <FieldCard key={f.id} field={f}
                onUpdate={updateField}
                onRemove={removeField}
                onAddOption={addOption}
                onUpdateOption={updateOption}
                onRemoveOption={removeOption}
              />
            ))}
          </div>

          <button onClick={addField} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '13px', borderRadius: 10,
            border: '2px dashed #CBD5E1', backgroundColor: 'transparent',
            fontSize: 14, fontWeight: 600, color: '#64748B', fontFamily: 'system-ui',
            cursor: 'pointer', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1D4ED8'; (e.currentTarget as HTMLElement).style.color = '#1D4ED8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.color = '#64748B' }}
          >
            + Add Field
          </button>
        </div>
      </div>
    </div>
  )
}
