import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { Btn } from './AdminLayout'
import { printStatement } from '../lib/printDoc'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const money = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const ymd = (d: Date) => d.toLocaleDateString('en-CA')

interface Line { date: string; type: string; reference: string; description: string; charge: number; credit: number; vat: number; balance: number }
interface Statement {
  kind: 'supplier' | 'customer'
  company: { name: string; trn: string | null; corporateTaxNo: string | null; address: string | null }
  party: { id: string; name: string; trn: string | null; corporateTaxNo: string | null; phone: string | null; email: string | null }
  from: string; to: string; balanceMeaning: string
  opening: number; closing: number
  totals: { charges: number; credits: number; vat: number }
  lines: Line[]
}

// Account statement for tax purposes — supplier (what we owe) or customer (what they owe)
export function StatementModal({ kind, id, name, onClose }: { kind: 'supplier' | 'customer'; id: string; name: string; onClose: () => void }) {
  const now = new Date()
  const [from, setFrom] = useState(ymd(new Date(now.getFullYear(), 0, 1)))
  const [to, setTo] = useState(ymd(now))
  const [st, setSt] = useState<Statement | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const labels = kind === 'supplier'
    ? { charge: 'Purchases', credit: 'Paid / Returned' }
    : { charge: 'Invoiced', credit: 'Received' }

  const load = () => {
    setLoading(true); setErr('')
    api.get<Statement>(`/statements/${kind}/${id}?from=${from}&to=${to}`).then(setSt).catch(e => setErr(e.message)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const quick = (f: Date, t: Date) => { setFrom(ymd(f)); setTo(ymd(t)) }
  const q = Math.floor(now.getMonth() / 3)

  const print = () => {
    if (!st) return
    printStatement({
      title: kind === 'supplier' ? 'SUPPLIER STATEMENT' : 'CUSTOMER STATEMENT',
      issuer: { name: st.company.name, trn: st.company.trn, address: st.company.address, extra: st.company.corporateTaxNo ? `Corporate Tax No. ${st.company.corporateTaxNo}` : null },
      party: st.party, from, to, balanceMeaning: st.balanceMeaning,
      opening: st.opening, closing: st.closing, totals: st.totals,
      lines: st.lines.map(l => ({ ...l, date: l.date.slice(0, 10) })),
      chargeLabel: labels.charge, creditLabel: labels.credit,
    })
  }

  const csv = () => {
    if (!st) return
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = [
      [`${kind === 'supplier' ? 'Supplier' : 'Customer'} statement`, st.party.name, 'TRN', st.party.trn ?? ''],
      ['Period', `${from} to ${to}`, 'Issued by', `${st.company.name} (TRN ${st.company.trn ?? '-'})`],
      [],
      ['Date', 'Type', 'Reference', 'Details', labels.charge, labels.credit, 'VAT', 'Balance'],
      ['', 'Opening balance', '', '', '', '', '', st.opening.toFixed(2)],
      ...st.lines.map(l => [l.date.slice(0, 10), l.type, l.reference, l.description, l.charge ? l.charge.toFixed(2) : '', l.credit ? l.credit.toFixed(2) : '', l.vat ? l.vat.toFixed(2) : '', l.balance.toFixed(2)]),
      ['', 'Totals', '', '', st.totals.charges.toFixed(2), st.totals.credits.toFixed(2), st.totals.vat.toFixed(2), st.closing.toFixed(2)],
    ]
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `statement-${st.party.name.replace(/[^\w]+/g, '-').toLowerCase()}-${from}-to-${to}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }

  const inp = { padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT } as const
  const chip = { padding: '5px 10px', borderRadius: 20, fontSize: 12, fontFamily: FONT, cursor: 'pointer', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B' } as const

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 1040, maxWidth: '100%', fontFamily: FONT }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: DARK }}>{kind === 'supplier' ? 'Supplier' : 'Customer'} Statement — {name}</h2>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              {st?.party.trn ? `TRN ${st.party.trn}` : 'No TRN on file'}{st?.party.corporateTaxNo ? ` · Corporate Tax ${st.party.corporateTaxNo}` : ''} · {st?.balanceMeaning ?? ''}
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#94A3B8' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp} />
          <span style={{ color: '#94A3B8' }}>→</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inp} />
          <Btn label={loading ? 'Loading…' : 'Show'} onClick={load} />
          <button style={chip} onClick={() => quick(new Date(now.getFullYear(), q * 3, 1), now)}>This quarter</button>
          <button style={chip} onClick={() => quick(new Date(now.getFullYear(), q * 3 - 3, 1), new Date(now.getFullYear(), q * 3, 0))}>Last quarter</button>
          <button style={chip} onClick={() => quick(new Date(now.getFullYear(), 0, 1), now)}>This year</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn label="Print / PDF" variant="secondary" onClick={print} />
            <Btn label="Download CSV" variant="secondary" onClick={csv} />
          </div>
        </div>
        {err && <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 10 }}>{err}</div>}

        {st && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
              {[
                ['Opening', st.opening, DARK], [labels.charge, st.totals.charges, '#1D4ED8'], [labels.credit, st.totals.credits, '#10B981'],
                ['VAT in period', st.totals.vat, '#7C3AED'], ['Closing balance', st.closing, st.closing > 0 ? '#EF4444' : '#10B981'],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{l}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: c as string }}>AED {money(v as number)}</div>
                </div>
              ))}
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 820 }}>
                <thead>
                  <tr style={{ background: '#253A72', color: '#fff' }}>
                    {['Date', 'Type', 'Reference', 'Details', labels.charge, labels.credit, 'VAT', 'Balance'].map((h, i) => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: i >= 4 ? 'right' : 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ background: '#F8FAFC' }}><td colSpan={7} style={{ padding: '7px 10px', fontWeight: 600 }}>Opening balance ({from})</td><td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{money(st.opening)}</td></tr>
                  {st.lines.length === 0 && <tr><td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>No transactions in this period</td></tr>}
                  {st.lines.map((l, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{l.date.slice(0, 10)}</td>
                      <td style={{ padding: '7px 10px' }}>{l.type}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>{l.reference}</td>
                      <td style={{ padding: '7px 10px', color: '#475569' }}>{l.description}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right' }}>{l.charge ? money(l.charge) : ''}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#10B981' }}>{l.credit ? money(l.credit) : ''}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#7C3AED' }}>{l.vat ? money(l.vat) : ''}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{money(l.balance)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#EEF2FF', fontWeight: 700 }}>
                    <td colSpan={4} style={{ padding: '8px 10px' }}>Totals for the period</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{money(st.totals.charges)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{money(st.totals.credits)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{money(st.totals.vat)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{money(st.closing)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
