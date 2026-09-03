import { useEffect, useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 700, color: DARK, fontFamily: FONT }}>{title}</h3>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', maxWidth: 440, padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT,
}

interface Settings {
  company: { name: string; registrationNo: string }
  settings: Record<string, string>
}

export function SettingsPage() {
  const [form, setForm]     = useState<Settings>({ company: { name: '', registrationNo: '' }, settings: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.get<Settings>('/settings').then(data => {
      setForm({
        company: { name: data.company?.name ?? '', registrationNo: data.company?.registrationNo ?? '' },
        settings: data.settings ?? {},
      })
    }).finally(() => setLoading(false))
  }, [])

  const setSetting = (key: string, value: string) =>
    setForm(f => ({ ...f, settings: { ...f.settings, [key]: value } }))

  const setCompany = (key: keyof Settings['company'], value: string) =>
    setForm(f => ({ ...f, company: { ...f.company, [key]: value } }))

  const save = async () => {
    setSaving(true); setError('')
    try {
      await api.patch('/settings', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { setError('Failed to save settings') }
    finally { setSaving(false) }
  }

  const s = form.settings

  if (loading) return (
    <AdminLayout title="Settings" actions={<></>}>
      <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="Company Settings" actions={
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {error && <span style={{ color: '#EF4444', fontSize: 13, fontFamily: FONT }}>{error}</span>}
        <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saved ? '#10B981' : DARK, color: '#fff', fontSize: 13, fontFamily: FONT, fontWeight: 600, cursor: 'pointer' }}>
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div>
          <Section title="Company Info">
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Company Name</span>
              <input style={inputStyle} value={form.company.name} onChange={e => setCompany('name', e.target.value)} placeholder="e.g. MyPrintingWorld LLC" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Trade License No.</span>
              <input style={inputStyle} value={form.company.registrationNo} onChange={e => setCompany('registrationNo', e.target.value)} placeholder="e.g. CN-1234567" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>VAT / TRN Number</span>
              <input style={inputStyle} value={s.vatNumber ?? ''} onChange={e => setSetting('vatNumber', e.target.value)} placeholder="e.g. TRN100284765300001" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Address</span>
              <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={s.address ?? ''} onChange={e => setSetting('address', e.target.value)} placeholder="Unit 14, Al Quoz Industrial Area 2, Dubai, UAE" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Phone</span>
              <input style={inputStyle} value={s.phone ?? ''} onChange={e => setSetting('phone', e.target.value)} placeholder="+971 4 XXX XXXX" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Support Email</span>
              <input type="email" style={inputStyle} value={s.supportEmail ?? ''} onChange={e => setSetting('supportEmail', e.target.value)} placeholder="support@myprintingworld.ae" />
            </label>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <span style={labelStyle}>Website</span>
              <input style={inputStyle} value={s.website ?? ''} onChange={e => setSetting('website', e.target.value)} placeholder="https://myprintingworld.ae" />
            </label>
          </Section>

          <Section title="Finance">
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Default Currency</span>
              <select style={inputStyle} value={s.currency ?? 'AED'} onChange={e => setSetting('currency', e.target.value)}>
                {['AED', 'USD', 'EUR', 'GBP'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>VAT Rate (%)</span>
              <input type="number" style={inputStyle} value={s.vatRate ?? '5'} onChange={e => setSetting('vatRate', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Fiscal Year Start</span>
              <select style={inputStyle} value={s.fiscalYearStart ?? 'January'} onChange={e => setSetting('fiscalYearStart', e.target.value)}>
                {['January', 'April', 'July', 'October'].map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Payment Terms (days)</span>
              <input type="number" style={inputStyle} value={s.paymentTerms ?? '30'} onChange={e => setSetting('paymentTerms', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Invoice Prefix</span>
              <input style={inputStyle} value={s.invoicePrefix ?? 'INV-'} onChange={e => setSetting('invoicePrefix', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <span style={labelStyle}>Quotation Prefix</span>
              <input style={inputStyle} value={s.quotationPrefix ?? 'QUO-'} onChange={e => setSetting('quotationPrefix', e.target.value)} />
            </label>
          </Section>
        </div>

        <div>
          <Section title="System">
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Date Format</span>
              <select style={inputStyle} value={s.dateFormat ?? 'DD/MM/YYYY'} onChange={e => setSetting('dateFormat', e.target.value)}>
                {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map(f => <option key={f}>{f}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Time Zone</span>
              <select style={inputStyle} value={s.timezone ?? 'Asia/Dubai'} onChange={e => setSetting('timezone', e.target.value)}>
                {['Asia/Dubai', 'Asia/Riyadh', 'UTC'].map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <span style={labelStyle}>Language</span>
              <select style={inputStyle} value={s.language ?? 'English'} onChange={e => setSetting('language', e.target.value)}>
                {['English', 'Arabic'].map(l => <option key={l}>{l}</option>)}
              </select>
            </label>
          </Section>

          <Section title="Order & Printing Defaults">
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Default Production Lead Time (days)</span>
              <input type="number" style={inputStyle} value={s.leadTimeDays ?? '3'} onChange={e => setSetting('leadTimeDays', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Low Stock Alert Threshold (units)</span>
              <input type="number" style={inputStyle} value={s.lowStockThreshold ?? '10'} onChange={e => setSetting('lowStockThreshold', e.target.value)} />
            </label>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <span style={labelStyle}>Order Number Prefix</span>
              <input style={inputStyle} value={s.orderPrefix ?? 'MPW-'} onChange={e => setSetting('orderPrefix', e.target.value)} />
            </label>
          </Section>

          <Section title="Social & Online">
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>Instagram</span>
              <input style={inputStyle} value={s.instagram ?? ''} onChange={e => setSetting('instagram', e.target.value)} placeholder="@myprintingworld" />
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>
              <span style={labelStyle}>WhatsApp Business Number</span>
              <input style={inputStyle} value={s.whatsapp ?? ''} onChange={e => setSetting('whatsapp', e.target.value)} placeholder="+971 50 XXX XXXX" />
            </label>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <span style={labelStyle}>Google Maps Link</span>
              <input style={inputStyle} value={s.mapsLink ?? ''} onChange={e => setSetting('mapsLink', e.target.value)} placeholder="https://maps.google.com/..." />
            </label>
          </Section>
        </div>
      </div>
    </AdminLayout>
  )
}
