import { useState } from 'react'
import { AdminLayout, Btn } from '../components/AdminLayout'

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

function Field({ label, value, type = 'text', options }: { label: string; value: string; type?: string; options?: string[] }) {
  const [v, setV] = useState(value)
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4, fontFamily: FONT }}>{label}</span>
      {options
        ? <select value={v} onChange={e => setV(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none', maxWidth: 420 }}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        : <input type={type} value={v} onChange={e => setV(e.target.value)} style={{ width: '100%', maxWidth: 420, padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
      }
    </label>
  )
}

function Toggle({ label, sub, defaultOn }: { label: string; sub: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: DARK, fontFamily: FONT }}>{label}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: FONT }}>{sub}</div>
      </div>
      <button onClick={() => setOn(o => !o)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: on ? '#1D4ED8' : '#CBD5E1', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <AdminLayout title="Settings" actions={<Btn label={saved ? '✓ Saved' : 'Save Changes'} onClick={save} />}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <div>
          <Section title="Company">
            <Field label="Company Name"   value="MyPrintingWorld LLC" />
            <Field label="Trade License"  value="CN-1234567" />
            <Field label="VAT Number"     value="TRN100284765300001" />
            <Field label="Address"        value="Unit 14, Al Quoz Industrial Area 2, Dubai, UAE" />
            <Field label="Phone"          value="+971 4 XXX XXXX" />
            <Field label="Support Email"  value="support@myprintingworld.ae" />
          </Section>

          <Section title="Finance">
            <Field label="Default Currency" value="AED" options={['AED','USD','EUR','GBP']} />
            <Field label="VAT Rate (%)"      value="5" type="number" />
            <Field label="Fiscal Year Start" value="January" options={['January','April','July','October']} />
            <Field label="Payment Terms (days)" value="30" type="number" />
            <Field label="Invoice Prefix"    value="INV-" />
            <Field label="Quotation Prefix"  value="QUO-" />
          </Section>
        </div>

        <div>
          <Section title="Notifications">
            <Toggle label="New order alert"       sub="Notify when a new order is placed"            defaultOn />
            <Toggle label="Low stock alert"       sub="Notify when stock falls below threshold"      defaultOn />
            <Toggle label="Payment received"      sub="Notify when customer payment is confirmed"    defaultOn />
            <Toggle label="Overdue invoices"      sub="Daily digest of overdue invoices"             defaultOn />
            <Toggle label="New lead assigned"     sub="Notify assigned salesperson"                  defaultOn />
            <Toggle label="Manufacturing update"  sub="Notify when MO status changes" />
            <Toggle label="Payroll processed"     sub="Notify HR manager when payroll runs" />
          </Section>

          <Section title="System">
            <Field label="Date Format"     value="DD/MM/YYYY" options={['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD']} />
            <Field label="Time Zone"       value="Asia/Dubai (GMT+4)" options={['Asia/Dubai (GMT+4)','Asia/Riyadh (GMT+3)','UTC']} />
            <Field label="Language"        value="English" options={['English','Arabic']} />
            <Toggle label="Maintenance mode" sub="Disable storefront for visitors" />
            <Toggle label="Two-factor auth"  sub="Require 2FA for all admin logins" defaultOn />
          </Section>

          <Section title="Integrations">
            <div style={{ fontSize: 13, color: '#64748B', fontFamily: FONT, marginBottom: 12 }}>Connect external services to automate your workflow.</div>
            {[
              { name: 'Supabase (Database)', connected: true  },
              { name: 'Stripe (Payments)',   connected: false },
              { name: 'Mailchimp (Email)',   connected: false },
              { name: 'WhatsApp Business',  connected: true  },
              { name: 'Aramex (Shipping)',   connected: false },
            ].map(({ name, connected }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, color: DARK, fontFamily: FONT }}>{name}</span>
                <button style={{ fontSize: 12, padding: '4px 12px', border: `1px solid ${connected ? '#10B981' : '#E2E8F0'}`, borderRadius: 6, background: connected ? '#ECFDF5' : '#fff', color: connected ? '#059669' : '#64748B', cursor: 'pointer', fontFamily: FONT }}>
                  {connected ? 'Connected' : 'Connect'}
                </button>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </AdminLayout>
  )
}
