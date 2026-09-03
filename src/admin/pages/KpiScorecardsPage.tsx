import { useEffect, useState } from 'react'
import { AdminLayout } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// ── Date helpers ──────────────────────────────────────────────────────────────
function monthRange(offset = 0) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + offset
  const from = new Date(y, m, 1)
  const to   = new Date(y, m + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
    label: from.toLocaleString('default', { month: 'long', year: 'numeric' }),
  }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  revenue:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  profit:       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  customers:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  transactions: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
}

function KpiCard({ label, value, sub, color = '#1D4ED8', trend, icon }: {
  label: string; value: string; sub?: string; color?: string; trend?: { value: number; label: string }; icon: keyof typeof ICONS
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
        <span style={{ color }}>{ICONS[icon]}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: DARK, fontFamily: FONT, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: FONT }}>{sub}</div>}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: trend.value >= 0 ? '#10B981' : '#EF4444', fontFamily: FONT }}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: FONT }}>{trend.label}</span>
        </div>
      )}
      <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, marginTop: 4 }}>
        <div style={{ height: '100%', width: '60%', background: color, borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ── Revenue Bar Chart ─────────────────────────────────────────────────────────
function RevenueBreakdown({ online, pos, walkin }: { online: number; pos: number; walkin: number }) {
  const total = online + pos + walkin || 1
  const bars = [
    { label: 'Online Orders', value: online, color: '#6366F1' },
    { label: 'POS Sales',     value: pos,    color: '#10B981' },
    { label: 'Walk-in',       value: walkin, color: '#F59E0B' },
  ]
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, marginBottom: 20 }}>Revenue by Channel</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontFamily: FONT, color: '#475569' }}>{b.label}</span>
              <span style={{ fontSize: 13, fontFamily: FONT, fontWeight: 600, color: DARK }}>AED {b.value.toLocaleString()}</span>
            </div>
            <div style={{ height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(b.value / total) * 100}%`, background: b.color, borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, marginTop: 2 }}>{((b.value / total) * 100).toFixed(1)}% of total</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── VAT Summary Card ──────────────────────────────────────────────────────────
function VatCard({ collected, paid, payable }: { collected: number; paid: number; payable: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, marginBottom: 16 }}>VAT Summary — This Month</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'VAT Collected (Output)', value: collected, color: '#10B981' },
          { label: 'VAT Paid (Input)',        value: paid,      color: '#3B82F6' },
          { label: 'Net Payable to FTA',      value: payable,   color: payable > 0 ? '#EF4444' : '#10B981' },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontFamily: FONT, color: '#475569' }}>{r.label}</span>
            <span style={{ fontSize: 14, fontFamily: FONT, fontWeight: 700, color: r.color }}>AED {r.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
interface PLData { totalRevenue: number; totalExpenses: number; netProfit: number; revenue: { code: string; net: number }[] }
interface VatData { vatCollected: number; vatPaid: number; vatPayable: number }

export function KpiScorecardsPage() {
  const [period, setPeriod] = useState<'this' | 'last'>('this')
  const [pl, setPL]         = useState<PLData | null>(null)
  const [prevPL, setPrevPL] = useState<PLData | null>(null)
  const [vat, setVat]       = useState<VatData | null>(null)
  const [counts, setCounts] = useState({ customers: 0, pos: 0, walkIn: 0, pos_prev: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cur  = monthRange(0)
    const prev = monthRange(-1)
    setLoading(true)
    Promise.all([
      api.get<PLData>(`/reports/pl?from=${cur.from}&to=${cur.to}`),
      api.get<PLData>(`/reports/pl?from=${prev.from}&to=${prev.to}`),
      api.get<VatData>(`/tax-filings/calculate?from=${cur.from}&to=${cur.to}`),
      api.get<{ meta: { total: number } }>('/walk-in-customers?pageSize=1'),
      api.get<{ meta: { total: number } }>('/pos/orders?pageSize=1'),
      api.get<{ meta: { total: number } }>('/walk-in-sales?pageSize=1'),
    ]).then(([curPL, prevPLRes, vatRes, custRes, posRes, walkRes]) => {
      setPL(curPL)
      setPrevPL(prevPLRes)
      setVat(vatRes)
      setCounts({
        customers: custRes.meta.total,
        pos: posRes.meta.total,
        walkIn: walkRes.meta.total,
        pos_prev: 0,
      })
    }).finally(() => setLoading(false))
  }, [])

  const cur  = monthRange(0)
  const prev = monthRange(-1)

  const revenueNow  = pl?.totalRevenue ?? 0
  const revenuePrev = prevPL?.totalRevenue ?? 0
  const revTrend    = revenuePrev > 0 ? ((revenueNow - revenuePrev) / revenuePrev) * 100 : 0

  const profitNow   = pl?.netProfit ?? 0
  const profitPrev  = prevPL?.netProfit ?? 0
  const profitTrend = profitPrev > 0 ? ((profitNow - profitPrev) / profitPrev) * 100 : 0

  const online  = pl?.revenue.find(r => r.code === '4001')?.net ?? 0
  const pos     = pl?.revenue.find(r => r.code === '4002')?.net ?? 0
  const walkin  = pl?.revenue.find(r => r.code === '4003')?.net ?? 0

  const margin  = revenueNow > 0 ? ((profitNow / revenueNow) * 100).toFixed(1) : '0.0'

  if (loading) return (
    <AdminLayout title="KPI Scorecards" actions={<></>}>
      <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading KPIs…</div>
    </AdminLayout>
  )

  return (
    <AdminLayout title="KPI Scorecards" actions={
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontSize: 13, color: '#64748B', alignSelf: 'center' }}>Showing:</span>
        <button onClick={() => setPeriod('this')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: period === 'this' ? DARK : '#F1F5F9', color: period === 'this' ? '#fff' : '#64748B', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>{cur.label}</button>
        <button onClick={() => setPeriod('last')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: period === 'last' ? DARK : '#F1F5F9', color: period === 'last' ? '#fff' : '#64748B', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>{prev.label}</button>
      </div>
    }>

      {/* Top KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon="revenue"      label="Total Revenue"      value={`AED ${revenueNow.toLocaleString()}`}          sub={cur.label}                                        color="#6366F1" trend={{ value: revTrend,    label: 'vs last month' }} />
        <KpiCard icon="profit"       label="Net Profit"         value={`AED ${profitNow.toLocaleString()}`}           sub={`Margin: ${margin}%`}                             color="#10B981" trend={{ value: profitTrend, label: 'vs last month' }} />
        <KpiCard icon="customers"    label="Total Customers"    value={String(counts.customers)}                      sub="Walk-in customer accounts"                        color="#F59E0B" />
        <KpiCard icon="transactions" label="Total Transactions" value={String(counts.pos + counts.walkIn)}            sub={`${counts.pos} POS · ${counts.walkIn} Walk-in`}   color="#EF4444" />
      </div>

      {/* Revenue breakdown + VAT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <RevenueBreakdown online={online} pos={pos} walkin={walkin} />
        <VatCard
          collected={vat?.vatCollected ?? 0}
          paid={vat?.vatPaid ?? 0}
          payable={vat?.vatPayable ?? 0}
        />
      </div>

      {/* Expense summary */}
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, marginBottom: 16 }}>Expense Summary — {cur.label}</div>
        {(pl?.expenses ?? []).filter(e => e.net > 0).length === 0
          ? <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: FONT }}>No expenses recorded this month yet.</div>
          : (pl?.expenses ?? []).filter(e => e.net > 0).map((e: { code: string; name: string; net: number }) => (
            <div key={e.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: '#475569' }}>{e.name}</span>
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: '#EF4444' }}>AED {e.net.toLocaleString()}</span>
            </div>
          ))
        }
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: DARK }}>Total Expenses</span>
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: '#EF4444' }}>AED {(pl?.totalExpenses ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </AdminLayout>
  )
}
