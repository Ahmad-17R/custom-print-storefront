import React, { useEffect, useState } from 'react'
import { AdminLayout, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const BLUE = '#3B82F6'
const GREEN = '#10B981'
const AMBER = '#F59E0B'
const RED = '#EF4444'
const PURPLE = '#8B5CF6'

interface PO {
  id: string; poNumber: string; totalAmount: number; status: string
  createdAt: string; supplierId: string
  supplier: { id: string; name: string }
  _count: { items: number; receipts: number }
}
interface PurchaseReturn {
  id: string; createdAt: string; supplierId: string
  supplier: { id: string; name: string }
  _count: { items: number }
}
interface RFQ { id: string; status: string; createdAt: string }

// ── Mini bar chart ────────────────────────────────────────────────────────────
function BarChart({ data, color = BLUE }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: FONT, lineHeight: 1 }}>
            {d.value > 0 ? d.value.toLocaleString() : ''}
          </div>
          <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${Math.max((d.value / max) * 60, d.value > 0 ? 4 : 0)}px`, opacity: 0.85, transition: 'height 0.3s' }} />
          <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: FONT, whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 100 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 8} fill="none" stroke="#E2E8F0" strokeWidth={16} />
      </svg>
    )
  }
  const r = size / 2 - 10
  const cx = size / 2, cy = size / 2
  let offset = 0
  const circumference = 2 * Math.PI * r
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {slices.filter(sl => sl.value > 0).map((sl, i) => {
        const dash = (sl.value / total) * circumference
        const gap = circumference - dash
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={sl.color} strokeWidth={16}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transition: 'all 0.3s' }}
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, fontFamily: FONT, ...style }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  )
}

// ── Pill ──────────────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: color + '20', color }}>
      {label}
    </span>
  )
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#94A3B8', confirmed: BLUE, partially_received: AMBER,
  fully_received: GREEN, cancelled: RED, closed: '#6B7280',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function monthKey(iso: string) { return iso.slice(0, 7) }
function last6Months() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[d.getMonth()] }
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ProcurementAnalyticsPage() {
  const [pos,     setPos]     = useState<PO[]>([])
  const [returns, setReturns] = useState<PurchaseReturn[]>([])
  const [rfqs,    setRfqs]    = useState<RFQ[]>([])
  const [loading, setLoad]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ data: PO[] }>('/purchase-orders?pageSize=500'),
      api.get<{ data: PurchaseReturn[] }>('/purchase-returns?pageSize=500'),
      api.get<{ data: RFQ[] }>('/rfqs?pageSize=500'),
    ]).then(([p, r, q]) => {
      setPos(p.data); setReturns(r.data); setRfqs(q.data)
    }).finally(() => setLoad(false))
  }, [])

  if (loading) return (
    <AdminLayout title="Procurement Analytics" actions={<></>}>
      <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading analytics…</div>
    </AdminLayout>
  )

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalSpend     = pos.filter(p => p.status !== 'cancelled').reduce((s, p) => s + Number(p.totalAmount), 0)
  const activePos      = pos.filter(p => !['cancelled', 'fully_received', 'closed'].includes(p.status)).length
  const returnCount    = returns.length
  const rfqConvRate    = rfqs.length > 0
    ? Math.round((rfqs.filter(r => ['closed'].includes(r.status)).length / rfqs.length) * 100)
    : 0

  const thisMonth = new Date().toISOString().slice(0, 7)
  const spendThisMonth = pos
    .filter(p => p.status !== 'cancelled' && p.createdAt.slice(0, 7) === thisMonth)
    .reduce((s, p) => s + Number(p.totalAmount), 0)

  // ── Monthly spend (last 6 months) ─────────────────────────────────────────
  const months = last6Months()
  const monthlySpend = months.map(m => ({
    label: m.label,
    value: Math.round(
      pos.filter(p => p.status !== 'cancelled' && monthKey(p.createdAt) === m.key)
         .reduce((s, p) => s + Number(p.totalAmount), 0)
    ),
  }))

  // ── Monthly PO count ──────────────────────────────────────────────────────
  const monthlyPOs = months.map(m => ({
    label: m.label,
    value: pos.filter(p => monthKey(p.createdAt) === m.key).length,
  }))

  // ── PO status breakdown ───────────────────────────────────────────────────
  const statusGroups: Record<string, number> = {}
  pos.forEach(p => { statusGroups[p.status] = (statusGroups[p.status] ?? 0) + 1 })
  const statusSlices = Object.entries(statusGroups).map(([status, count]) => ({
    label: status.replace(/_/g, ' '), value: count, color: STATUS_COLORS[status] ?? '#CBD5E1',
  }))

  // ── Top suppliers by spend ────────────────────────────────────────────────
  const supplierSpend: Record<string, { name: string; spend: number; orders: number }> = {}
  pos.filter(p => p.status !== 'cancelled').forEach(p => {
    if (!supplierSpend[p.supplier.id]) supplierSpend[p.supplier.id] = { name: p.supplier.name, spend: 0, orders: 0 }
    supplierSpend[p.supplier.id].spend  += Number(p.totalAmount)
    supplierSpend[p.supplier.id].orders += 1
  })
  const topSuppliers = Object.values(supplierSpend)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6)

  // ── RFQ funnel ────────────────────────────────────────────────────────────
  const rfqDraft    = rfqs.filter(r => r.status === 'draft').length
  const rfqSent     = rfqs.filter(r => r.status === 'sent').length
  const rfqQuoted   = rfqs.filter(r => r.status === 'quoted').length
  const rfqConverted = rfqs.filter(r => r.status === 'closed').length
  const rfqCancelled = rfqs.filter(r => r.status === 'cancelled').length

  // ── Recent POs ────────────────────────────────────────────────────────────
  const recentPos = [...pos].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)

  const fmt = (n: number) => n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <AdminLayout title="Procurement Analytics" actions={<></>}>

      {/* KPI row */}
      <StatGrid>
        <StatCard label="Total Spend"      value={`AED ${fmt(totalSpend)}`}         sub="All non-cancelled POs"           />
        <StatCard label="This Month"       value={`AED ${fmt(spendThisMonth)}`}      sub="Current month spend"  color={PURPLE} />
        <StatCard label="Active POs"       value={String(activePos)}                 sub="Confirmed / in progress"  color={AMBER} />
        <StatCard label="RFQ → PO Rate"    value={rfqs.length > 0 ? `${rfqConvRate}%` : '—'} sub="RFQs converted to PO"  color={GREEN} />
      </StatGrid>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        <Card title="Monthly Spend (AED)" style={{ gridColumn: 'span 2' }}>
          <BarChart data={monthlySpend} color={BLUE} />
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 8, fontFamily: FONT }}>
            Last 6 months — non-cancelled purchase orders
          </div>
        </Card>

        <Card title="PO Status Breakdown">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DonutChart slices={statusSlices} size={90} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statusSlices.map(sl => (
                <div key={sl.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sl.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748B', fontFamily: FONT, textTransform: 'capitalize' }}>{sl.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: DARK, fontFamily: FONT, marginLeft: 'auto' }}>{sl.value}</span>
                </div>
              ))}
              {statusSlices.length === 0 && <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: FONT }}>No POs yet</span>}
            </div>
          </div>
        </Card>
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Top suppliers */}
        <Card title="Top Suppliers by Spend">
          {topSuppliers.length === 0
            ? <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: FONT }}>No data yet</div>
            : topSuppliers.map((s, i) => {
              const pct = totalSpend > 0 ? (s.spend / totalSpend) * 100 : 0
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DARK, fontFamily: FONT }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: '#64748B', fontFamily: FONT }}>AED {fmt(s.spend)}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: BLUE, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, fontFamily: FONT }}>{s.orders} order{s.orders !== 1 ? 's' : ''} · {pct.toFixed(1)}% of total</div>
                </div>
              )
            })
          }
        </Card>

        {/* RFQ funnel */}
        <Card title="RFQ Pipeline">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Draft',      value: rfqDraft,      color: '#94A3B8' },
              { label: 'Sent',       value: rfqSent,       color: BLUE     },
              { label: 'Quoted',     value: rfqQuoted,     color: AMBER    },
              { label: 'Converted → PO', value: rfqConverted, color: GREEN },
              { label: 'Cancelled',  value: rfqCancelled,  color: RED      },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontFamily: FONT, minWidth: 110 }}>{row.label}</span>
                <div style={{ flex: 1, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: rfqs.length > 0 ? `${(row.value / rfqs.length) * 100}%` : '0%', background: row.color, borderRadius: 5, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: DARK, fontFamily: FONT, minWidth: 24, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
            {rfqs.length === 0 && <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: FONT }}>No RFQs yet</div>}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', gap: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: DARK, fontFamily: FONT }}>{rfqs.length}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>Total RFQs</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: RED, fontFamily: FONT }}>{returnCount}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>Purchase Returns</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: GREEN, fontFamily: FONT }}>{pos.filter(p => p.status === 'fully_received').length}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT }}>Fully Received POs</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Monthly PO count */}
      <div style={{ marginBottom: 16 }}>
        <Card title="Monthly Purchase Orders (count)">
          <BarChart data={monthlyPOs} color={PURPLE} />
        </Card>
      </div>

      {/* Recent POs table */}
      <Card title="Recent Purchase Orders">
        {recentPos.length === 0
          ? <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: FONT }}>No purchase orders yet</div>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['PO #', 'Supplier', 'Items', 'Amount (AED)', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPos.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: DARK }}>{p.poNumber}</td>
                      <td style={{ padding: '8px 12px', color: '#374151' }}>{p.supplier.name}</td>
                      <td style={{ padding: '8px 12px', color: '#64748B', textAlign: 'center' }}>{p._count.items}</td>
                      <td style={{ padding: '8px 12px', fontVariantNumeric: 'tabular-nums', color: DARK, fontWeight: 600 }}>{fmt(Number(p.totalAmount))}</td>
                      <td style={{ padding: '8px 12px' }}><Pill label={p.status.replace(/_/g, ' ')} color={STATUS_COLORS[p.status] ?? '#94A3B8'} /></td>
                      <td style={{ padding: '8px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>{p.createdAt.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </AdminLayout>
  )
}
