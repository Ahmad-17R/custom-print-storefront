import type React from 'react'

const FONT = "'Poppins', system-ui, sans-serif"

// Editor for a person's additional phone numbers (the primary number stays in its own field).
export function PhoneList({ phones, onChange, inputStyle, placeholder = '+971 …' }: {
  phones: string[]
  onChange: (phones: string[]) => void
  inputStyle: React.CSSProperties
  placeholder?: string
}) {
  const set = (i: number, v: string) => onChange(phones.map((p, idx) => idx === i ? v : p))
  return (
    <div>
      {phones.map((p, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <input value={p} onChange={e => set(i, e.target.value)} placeholder={placeholder} style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => onChange(phones.filter((_, idx) => idx !== i))} title="Remove number"
            style={{ border: 'none', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...phones, ''])}
        style={{ background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#64748B', fontFamily: FONT }}>
        + Add another number
      </button>
    </div>
  )
}

// Clean up before saving: trim, drop blanks and duplicates
export const tidyPhones = (phones: string[]) => [...new Set(phones.map(p => p.trim()).filter(Boolean))]

// "primary · extra1 · extra2" for tables / detail views
export const allPhones = (primary?: string | null, extra?: string[] | null) =>
  [primary, ...(extra ?? [])].filter(Boolean).join(' · ')
