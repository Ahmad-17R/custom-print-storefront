import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Account { id: string; code: string; name: string }
interface FiscalPeriod { id: string; name: string }
interface Budget {
  id: string; amount: string; spentAmount: string; notes: string | null; createdAt: string
  account: { id: string; code: string; name: string }
  fiscalPeriod: { id: string; name: string }
}

function Modal({ item, accounts, periods, onClose, onSaved }: {
  item: Partial<Budget> | null; accounts: Account[]; periods: FiscalPeriod[]; onClose: () => void; onSaved: () => void
}) {
  const [accountId, setAccount]   = useState(item?.account?.id ?? accounts[0]?.id ?? '')
  const [fiscalPeriodId, setPeriod] = useState(item?.fiscalPeriod?.id ?? periods[0]?.id ?? '')
  const [amount, setAmount]       = useState(item?.amount ? String(Number(item.amount)) : '')
  const [notes, setNotes]         = useState(item?.notes ?? '')
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      if (item?.id) await api.patch(`/budgets/${item.id}`, { amount: Number(amount), notes: notes || null })
      else          await api.post('/budgets', { accountId, fiscalPeriodId, amount: Number(amount), notes: notes || null })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 460, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Budget' : 'New Budget'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {!item?.id && <>
            <label>{lbl('Account *')}<select style={inp} value={accountId} onChange={e => setAccount(e.target.value)}>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select></label>
            <label>{lbl('Fiscal Period *')}<select style={inp} value={fiscalPeriodId} onChange={e => setPeriod(e.target.value)}>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
          </>}
          <label>{lbl('Budget Amount (AED) *')}<input type="number" min="0" step="0.01" style={inp} value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 50000" /></label>
          <label>{lbl('Notes')}<textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const COLS = [
  { key: 'account', label: 'Account' }, { key: 'period', label: 'Fiscal Period', width: 160 },
  { key: 'amount', label: 'Budget', width: 130 }, { key: 'spent', label: 'Spent', width: 130 },
  { key: 'utilization', label: 'Utilization', width: 110 }, { key: 'actions', label: '', width: 130 },
]

interface ActualRow { accountId: string; accountCode: string; accountName: string; budgeted: number; actual: number; variance: number; variancePct: number | null }
interface ActualsData { rows: ActualRow[]; period: { name: string } }

export function BudgetsPage() {
  const [data, setData]       = useState<Budget[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [periods, setPeriods] = useState<FiscalPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [modal, setModal]     = useState<Partial<Budget> | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'actuals'>('list')
  const [actualsPeriod, setActualsPeriod] = useState('')
  const [actuals, setActuals] = useState<ActualsData | null>(null)
  const [actualsLoading, setActualsLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, a, p] = await Promise.all([
        api.get<{ data: Budget[] }>('/budgets?pageSize=200'),
        api.get<{ data: Account[] }>('/chart-of-accounts?pageSize=500'),
        api.get<{ data: FiscalPeriod[] }>('/fiscal-periods?pageSize=100'),
      ])
      setData(r.data); setAccounts(a.data); setPeriods(p.data)
      if (!actualsPeriod && p.data.length) setActualsPeriod(p.data[0].id)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const loadActuals = async (periodId: string) => {
    if (!periodId) return
    setActualsLoading(true)
    try {
      const r = await api.get<ActualsData>(`/budgets/actuals?fiscalPeriodId=${periodId}`)
      setActuals(r)
    } catch { setActuals(null) }
    finally { setActualsLoading(false) }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    try { await api.delete(`/budgets/${id}`); load() }
    catch (e: any) { alert(e?.message ?? 'Delete failed') }
  }

  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }
  const filtered = data.filter(r =>
    r.account.name.toLowerCase().includes(q.toLowerCase()) ||
    r.account.code.toLowerCase().includes(q.toLowerCase()) ||
    r.fiscalPeriod.name.toLowerCase().includes(q.toLowerCase())
  )
  const totalBudget = data.reduce((s, r) => s + Number(r.amount), 0)
  const totalSpent  = data.reduce((s, r) => s + Number(r.spentAmount), 0)

  const rows = filtered.map(r => {
    const pct = Number(r.amount) > 0 ? (Number(r.spentAmount) / Number(r.amount)) * 100 : 0
    return {
      account: `${r.account.code} — ${r.account.name}`,
      period: r.fiscalPeriod.name,
      amount: `AED ${Number(r.amount).toLocaleString()}`,
      spent: `AED ${Number(r.spentAmount).toLocaleString()}`,
      utilization: <span style={{ color: pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>{pct.toFixed(1)}%</span>,
      actions: (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
          <button onClick={() => del(r.id)} style={{ ...btnS, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
        </div>
      ),
    }
  })

  const ACTUALS_COLS = [
    { key: 'account', label: 'Account' },
    { key: 'budgeted', label: 'Budgeted (AED)', width: 140 },
    { key: 'actual', label: 'Actual (AED)', width: 140 },
    { key: 'variance', label: 'Variance', width: 140 },
    { key: 'pct', label: '% Used', width: 90 },
  ]
  const actualsRows = (actuals?.rows ?? []).map(r => {
    const pct = r.variancePct !== null ? (r.actual / r.budgeted * 100) : null
    const over = r.variance < 0
    return {
      account:  `${r.accountCode} — ${r.accountName}`,
      budgeted: r.budgeted.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
      actual:   r.actual.toLocaleString('en-AE', { minimumFractionDigits: 2 }),
      variance: <span style={{ color: over ? '#EF4444' : '#10B981', fontWeight: 600 }}>{over ? '' : '+'}{r.variance.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</span>,
      pct: pct !== null ? <span style={{ color: pct > 100 ? '#EF4444' : pct > 80 ? '#F59E0B' : '#10B981', fontWeight: 600 }}>{pct.toFixed(1)}%</span> : '—',
    }
  })

  return (
    <AdminLayout title="Budgets" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setViewMode('list')} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, background: viewMode === 'list' ? DARK : '#F1F5F9', color: viewMode === 'list' ? '#fff' : '#64748B' }}>List</button>
        <button onClick={() => { setViewMode('actuals'); if (actualsPeriod) loadActuals(actualsPeriod) }} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, background: viewMode === 'actuals' ? DARK : '#F1F5F9', color: viewMode === 'actuals' ? '#fff' : '#64748B' }}>Budget vs Actuals</button>
        {viewMode === 'list' && <><SearchInput value={q} onChange={setQ} placeholder="Search account, period…" /><Btn label="+ New Budget" onClick={() => setModal({})} /></>}
      </div>
    }>
      {viewMode === 'list' ? (
        <>
          <StatGrid>
            <StatCard label="Total Budgets" value={String(data.length)} sub="Budget entries" />
            <StatCard label="Total Budget" value={`AED ${totalBudget.toLocaleString()}`} sub="Combined budget" color="#1D4ED8" />
            <StatCard label="Total Spent" value={`AED ${totalSpent.toLocaleString()}`} sub="Combined spent" color="#F59E0B" />
            <StatCard label="Utilization" value={totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'} sub="Overall utilization" color="#8B5CF6" />
          </StatGrid>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
            : <Table columns={COLS} rows={rows} />}
        </>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 13, fontFamily: FONT, color: '#64748B', fontWeight: 600 }}>Fiscal Period:</span>
            <select style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none' }}
              value={actualsPeriod} onChange={e => { setActualsPeriod(e.target.value); loadActuals(e.target.value) }}>
              <option value="">— select period —</option>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Btn label="Load" onClick={() => loadActuals(actualsPeriod)} />
          </div>
          {actualsLoading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading actuals…</div>
            : actuals ? (
              actuals.rows.length === 0
                ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No budgets set for this period.</div>
                : <Table columns={ACTUALS_COLS} rows={actualsRows} />
            ) : <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Select a fiscal period and click Load.</div>}
        </div>
      )}
      {modal !== null && <Modal item={modal} accounts={accounts} periods={periods} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
