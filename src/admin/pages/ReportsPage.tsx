import { useState } from 'react'
import { AdminLayout, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }
const lbl = (t: string) => <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, marginRight: 6 }}>{t}</span>

function fmt(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TYPE_COLOR: Record<string, string> = {
  asset: '#3B82F6', liability: '#F59E0B', equity: '#8B5CF6',
  revenue: '#10B981', expense: '#EF4444',
}

// ─── P&L ─────────────────────────────────────────────────────────────────────

interface PlRow { code: string; name: string; net: number }
interface PlData {
  from: string | null; to: string | null
  revenue: PlRow[]; expenses: PlRow[]
  totalRevenue: number; totalExpenses: number; netProfit: number
}

function PLReport({ from, to }: { from: string; to: string }) {
  const [data, setData]     = useState<PlData | null>(null)
  const [loading, setLoad]  = useState(false)
  const [err, setErr]       = useState('')

  const load = async () => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      const r = await api.get<PlData>(`/reports/pl?${params}`)
      setData(r)
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setLoad(false) }
  }

  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '1px solid #F1F5F9', fontFamily: FONT, fontSize: 13 }
  const headStyle: React.CSSProperties = { ...rowStyle, fontWeight: 700, background: '#F8FAFC', color: '#475569', fontSize: 12 }
  const totalStyle: React.CSSProperties = { ...rowStyle, fontWeight: 700, background: '#EFF6FF', color: DARK, fontSize: 14 }

  return (
    <div>
      <Btn label={loading ? 'Loading…' : 'Run Report'} onClick={load} />
      {err && <div style={{ color: '#B91C1C', marginTop: 8, fontSize: 13, fontFamily: FONT }}>{err}</div>}
      {data && (
        <div style={{ marginTop: 20, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Revenue */}
          <div style={headStyle}><span>REVENUE</span><span>AED</span></div>
          {data.revenue.map(r => (
            <div key={r.code} style={rowStyle}>
              <span style={{ color: '#475569' }}>{r.code} — {r.name}</span>
              <span style={{ color: '#10B981', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.net)}</span>
            </div>
          ))}
          {data.revenue.length === 0 && <div style={{ ...rowStyle, color: '#94A3B8' }}>No revenue entries in this period</div>}
          <div style={{ ...rowStyle, fontWeight: 700, background: '#F0FDF4', color: '#15803D' }}>
            <span>Total Revenue</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(data.totalRevenue)}</span>
          </div>

          {/* Expenses */}
          <div style={{ ...headStyle, marginTop: 8 }}><span>EXPENSES</span><span>AED</span></div>
          {data.expenses.map(r => (
            <div key={r.code} style={rowStyle}>
              <span style={{ color: '#475569' }}>{r.code} — {r.name}</span>
              <span style={{ color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.net)}</span>
            </div>
          ))}
          {data.expenses.length === 0 && <div style={{ ...rowStyle, color: '#94A3B8' }}>No expense entries in this period</div>}
          <div style={{ ...rowStyle, fontWeight: 700, background: '#FEF2F2', color: '#B91C1C' }}>
            <span>Total Expenses</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(data.totalExpenses)}</span>
          </div>

          {/* Net */}
          <div style={{ ...totalStyle, borderTop: '2px solid #CBD5E1' }}>
            <span>NET PROFIT / (LOSS)</span>
            <span style={{ color: data.netProfit >= 0 ? '#15803D' : '#B91C1C', fontVariantNumeric: 'tabular-nums' }}>
              {data.netProfit < 0 ? `(${fmt(Math.abs(data.netProfit))})` : fmt(data.netProfit)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── General Ledger ───────────────────────────────────────────────────────────

interface LedgerEntry { id: string; entryDate: string; description: string | null; reference: string | null; debit: number; credit: number; balance: number }
interface LedgerAccount { id: string; code: string; name: string; type: string; entries: LedgerEntry[]; totalDebit: number; totalCredit: number; closingBalance: number }
interface LedgerData { from: string | null; to: string | null; accounts: LedgerAccount[] }

function LedgerReport({ from, to }: { from: string; to: string }) {
  const [data, setData]    = useState<LedgerData | null>(null)
  const [loading, setLoad] = useState(false)
  const [err, setErr]      = useState('')
  const [expanded, setExp] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      const r = await api.get<LedgerData>(`/reports/ledger?${params}`)
      setData(r)
      setExp(new Set(r.accounts.map(a => a.id)))  // expand all by default
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setLoad(false) }
  }

  const toggle = (id: string) => setExp(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div>
      <Btn label={loading ? 'Loading…' : 'Run Report'} onClick={load} />
      {err && <div style={{ color: '#B91C1C', marginTop: 8, fontSize: 13, fontFamily: FONT }}>{err}</div>}
      {data && data.accounts.length === 0 && (
        <div style={{ marginTop: 20, color: '#94A3B8', fontSize: 13, fontFamily: FONT }}>No journal entries found for this period.</div>
      )}
      {data && data.accounts.map(acc => (
        <div key={acc.id} style={{ marginTop: 16, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Account header */}
          <div
            onClick={() => toggle(acc.id)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: TYPE_COLOR[acc.type] + '22', color: TYPE_COLOR[acc.type], padding: '2px 8px', borderRadius: 20, fontFamily: FONT }}>
                {acc.type.toUpperCase()}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: DARK, fontFamily: FONT }}>{acc.code} — {acc.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: '#64748B' }}>Dr: <b>{fmt(acc.totalDebit)}</b></span>
              <span style={{ color: '#64748B' }}>Cr: <b>{fmt(acc.totalCredit)}</b></span>
              <span style={{ color: acc.closingBalance >= 0 ? DARK : '#B91C1C', fontWeight: 700 }}>Bal: {fmt(acc.closingBalance)}</span>
              <span style={{ color: '#94A3B8', fontSize: 18, lineHeight: 1 }}>{expanded.has(acc.id) ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* Entries table */}
          {expanded.has(acc.id) && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#F1F5F9' }}>
                  {['Date', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '6px 12px', textAlign: h === 'Date' || h === 'Reference' || h === 'Description' ? 'left' : 'right', color: '#64748B', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {acc.entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '6px 12px', color: '#64748B' }}>{e.entryDate.slice(0, 10)}</td>
                    <td style={{ padding: '6px 12px', color: '#3B82F6' }}>{e.reference ?? '—'}</td>
                    <td style={{ padding: '6px 12px', color: DARK }}>{e.description ?? '—'}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: e.debit > 0 ? DARK : '#CBD5E1' }}>{e.debit > 0 ? fmt(e.debit) : '—'}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: e.credit > 0 ? DARK : '#CBD5E1' }}>{e.credit > 0 ? fmt(e.credit) : '—'}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: e.balance >= 0 ? DARK : '#B91C1C' }}>{fmt(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Trial Balance ────────────────────────────────────────────────────────────

interface TbRow { code: string; name: string; type: string; totalDebit: number; totalCredit: number }
interface TbData { from: string | null; to: string | null; rows: TbRow[]; grandDebit: number; grandCredit: number }

function TrialBalanceReport({ from, to }: { from: string; to: string }) {
  const [data, setData]    = useState<TbData | null>(null)
  const [loading, setLoad] = useState(false)
  const [err, setErr]      = useState('')

  const load = async () => {
    setLoad(true); setErr('')
    try {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to)   params.set('to', to)
      const r = await api.get<TbData>(`/reports/trial-balance?${params}`)
      setData(r)
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed')
    } finally { setLoad(false) }
  }

  const cell: React.CSSProperties = { padding: '7px 12px', fontFamily: FONT, fontSize: 13 }

  return (
    <div>
      <Btn label={loading ? 'Loading…' : 'Run Report'} onClick={load} />
      {err && <div style={{ color: '#B91C1C', marginTop: 8, fontSize: 13, fontFamily: FONT }}>{err}</div>}
      {data && (
        <div style={{ marginTop: 20, border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ ...cell, textAlign: 'left', color: '#64748B', fontWeight: 600, width: 80 }}>Code</th>
                <th style={{ ...cell, textAlign: 'left', color: '#64748B', fontWeight: 600 }}>Account</th>
                <th style={{ ...cell, textAlign: 'left', color: '#64748B', fontWeight: 600, width: 90 }}>Type</th>
                <th style={{ ...cell, textAlign: 'right', color: '#64748B', fontWeight: 600, width: 140 }}>Debit (AED)</th>
                <th style={{ ...cell, textAlign: 'right', color: '#64748B', fontWeight: 600, width: 140 }}>Credit (AED)</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(r => (
                <tr key={r.code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...cell, color: '#64748B' }}>{r.code}</td>
                  <td style={{ ...cell, color: DARK, fontWeight: 500 }}>{r.name}</td>
                  <td style={{ ...cell }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: TYPE_COLOR[r.type] + '22', color: TYPE_COLOR[r.type], padding: '2px 7px', borderRadius: 20 }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.totalDebit > 0 ? DARK : '#CBD5E1' }}>{r.totalDebit > 0 ? fmt(r.totalDebit) : '—'}</td>
                  <td style={{ ...cell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.totalCredit > 0 ? DARK : '#CBD5E1' }}>{r.totalCredit > 0 ? fmt(r.totalCredit) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#F8FAFC', borderTop: '2px solid #CBD5E1' }}>
                <td colSpan={3} style={{ ...cell, fontWeight: 700, color: DARK }}>TOTAL</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: DARK }}>{fmt(data.grandDebit)}</td>
                <td style={{ ...cell, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: DARK }}>{fmt(data.grandCredit)}</td>
              </tr>
              {Math.abs(data.grandDebit - data.grandCredit) > 0.01 && (
                <tr>
                  <td colSpan={5} style={{ ...cell, color: '#B91C1C', fontSize: 12 }}>
                    ⚠ Trial balance does not balance — difference: {fmt(Math.abs(data.grandDebit - data.grandCredit))}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ReportTab = 'pl' | 'ledger' | 'trial'

export function ReportsPage() {
  const today   = new Date().toISOString().slice(0, 10)
  const firstOfMonth = today.slice(0, 8) + '01'

  const [tab,  setTab]  = useState<ReportTab>('pl')
  const [from, setFrom] = useState(firstOfMonth)
  const [to,   setTo]   = useState(today)

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'pl',     label: 'Profit & Loss' },
    { key: 'ledger', label: 'General Ledger' },
    { key: 'trial',  label: 'Trial Balance' },
  ]

  const tabBtn = (t: typeof tabs[0]) => (
    <button
      key={t.key}
      onClick={() => setTab(t.key)}
      style={{
        padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600,
        background: tab === t.key ? DARK : '#F1F5F9',
        color:      tab === t.key ? '#fff' : '#64748B',
        transition: 'all .15s',
      }}
    >{t.label}</button>
  )

  return (
    <AdminLayout title="Financial Reports" actions={null}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(tabBtn)}
      </div>

      {/* Date range picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '14px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {lbl('From')}
          <input type="date" style={inp} value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {lbl('To')}
          <input type="date" style={inp} value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {[
            { label: 'This Month', f: firstOfMonth, t: today },
            { label: 'This Year',  f: today.slice(0, 4) + '-01-01', t: today },
            { label: 'All Time',   f: '', t: '' },
          ].map(p => (
            <button key={p.label} onClick={() => { setFrom(p.f); setTo(p.t) }}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 12, cursor: 'pointer', color: '#475569' }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active report */}
      {tab === 'pl'     && <PLReport     from={from} to={to} />}
      {tab === 'ledger' && <LedgerReport from={from} to={to} />}
      {tab === 'trial'  && <TrialBalanceReport from={from} to={to} />}
    </AdminLayout>
  )
}
