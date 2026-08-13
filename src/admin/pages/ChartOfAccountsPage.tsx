import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type AccType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'

interface Account {
  id: string; code: string; name: string; type: AccType
  balance: number; currency: string; active: boolean; parent?: string
}

const typeColor: Record<AccType, string> = {
  Asset:     '#1D4ED8',
  Liability: '#EF4444',
  Equity:    '#8B5CF6',
  Revenue:   '#10B981',
  Expense:   '#F59E0B',
}

const SEED: Account[] = [
  { id: '1', code: '1000', name: 'Cash & Bank',           type: 'Asset',     balance: 485200, currency: 'AED', active: true },
  { id: '2', code: '1100', name: 'Accounts Receivable',   type: 'Asset',     balance: 48720,  currency: 'AED', active: true },
  { id: '3', code: '1200', name: 'Inventory',             type: 'Asset',     balance: 123400, currency: 'AED', active: true },
  { id: '4', code: '1300', name: 'Fixed Assets',          type: 'Asset',     balance: 320000, currency: 'AED', active: true },
  { id: '5', code: '2000', name: 'Accounts Payable',      type: 'Liability', balance: 62100,  currency: 'AED', active: true },
  { id: '6', code: '2100', name: 'VAT Payable',           type: 'Liability', balance: 14820,  currency: 'AED', active: true },
  { id: '7', code: '2200', name: 'Accrued Expenses',      type: 'Liability', balance: 18500,  currency: 'AED', active: true },
  { id: '8', code: '3000', name: 'Owner Equity',          type: 'Equity',    balance: 500000, currency: 'AED', active: true },
  { id: '9', code: '3100', name: 'Retained Earnings',     type: 'Equity',    balance: 381900, currency: 'AED', active: true },
  { id:'10', code: '4000', name: 'Sales Revenue',         type: 'Revenue',   balance: 892100, currency: 'AED', active: true },
  { id:'11', code: '4100', name: 'Service Revenue',       type: 'Revenue',   balance: 134500, currency: 'AED', active: true },
  { id:'12', code: '5000', name: 'Cost of Goods Sold',    type: 'Expense',   balance: 421000, currency: 'AED', active: true },
  { id:'13', code: '5100', name: 'Salaries & Wages',      type: 'Expense',   balance: 199000, currency: 'AED', active: true },
  { id:'14', code: '5200', name: 'Rent & Utilities',      type: 'Expense',   balance: 84000,  currency: 'AED', active: true },
  { id:'15', code: '5300', name: 'Marketing & Advertising',type:'Expense',   balance: 42000,  currency: 'AED', active: true },
  { id:'16', code: '5400', name: 'Depreciation',          type: 'Expense',   balance: 32000,  currency: 'AED', active: true },
]

const TYPES: AccType[] = ['Asset','Liability','Equity','Revenue','Expense']
const COLS = [
  { key: 'code',     label: 'Code',    width: 90 },
  { key: 'name',     label: 'Account Name' },
  { key: 'type',     label: 'Type',    width: 110 },
  { key: 'balance',  label: 'Balance', width: 140 },
  { key: 'currency', label: 'CCY',     width: 70 },
  { key: 'active',   label: 'Status',  width: 90 },
  { key: 'actions',  label: '',        width: 80 },
]

function Modal({ acc, onClose, onSave }: { acc: Partial<Account> | null; onClose: () => void; onSave: (a: Partial<Account>) => void }) {
  const [form, setForm] = useState<Partial<Account>>(acc ?? { code: '', name: '', type: 'Asset', balance: 0, currency: 'AED', active: true })
  if (!acc) return null
  const f = <K extends keyof Account>(k: K, v: Account[K]) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, fontFamily: FONT }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit Account' : 'New Account'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Account Code *</span>
            <input value={form.code ?? ''} onChange={e => f('code', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Type</span>
            <select value={form.type ?? 'Asset'} onChange={e => f('type', e.target.value as AccType)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Account Name *</span>
          <input value={form.name ?? ''} onChange={e => f('name', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Opening Balance</span>
            <input type="number" value={form.balance ?? 0} onChange={e => f('balance', Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Currency</span>
            <select value={form.currency ?? 'AED'} onChange={e => f('currency', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['AED','USD','EUR','GBP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active ?? true} onChange={e => f('active', e.target.checked)} />
          <span style={{ fontSize: 13 }}>Active</span>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save Account" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function ChartOfAccountsPage() {
  const [data, setData]   = useState<Account[]>(SEED)
  const [q, setQ]         = useState('')
  const [type, setType]   = useState<AccType | 'All'>('All')
  const [modal, setModal] = useState<Partial<Account> | null>(null)

  const filtered = data.filter(a =>
    (type === 'All' || a.type === type) &&
    (a.name.toLowerCase().includes(q.toLowerCase()) || a.code.includes(q))
  )

  const save = (form: Partial<Account>) => {
    if (form.id) setData(d => d.map(a => a.id === form.id ? { ...a, ...form } as Account : a))
    else setData(d => [...d, { id: String(d.length + 1), ...form } as Account])
  }

  const totalAssets     = data.filter(a => a.type === 'Asset').reduce((s,a) => s + a.balance, 0)
  const totalRevenue    = data.filter(a => a.type === 'Revenue').reduce((s,a) => s + a.balance, 0)
  const totalExpenses   = data.filter(a => a.type === 'Expense').reduce((s,a) => s + a.balance, 0)

  const rows = filtered.map(a => ({
    ...a,
    balance: <span style={{ fontVariantNumeric: 'tabular-nums' }}>AED {a.balance.toLocaleString()}</span>,
    type:    <Badge label={a.type} color={typeColor[a.type]} />,
    active:  <Badge label={a.active ? 'Active' : 'Inactive'} color={a.active ? '#10B981' : '#64748B'} />,
    actions: <button onClick={() => setModal(a)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Chart of Accounts"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search accounts…" /><Btn label="+ New Account" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total Assets"    value={`AED ${totalAssets.toLocaleString()}`}   sub="Asset accounts"   color="#1D4ED8" />
        <StatCard label="Total Revenue"   value={`AED ${totalRevenue.toLocaleString()}`}  sub="Revenue accounts" color="#10B981" />
        <StatCard label="Total Expenses"  value={`AED ${totalExpenses.toLocaleString()}`} sub="Expense accounts" color="#F59E0B" />
        <StatCard label="Net Profit"      value={`AED ${(totalRevenue - totalExpenses).toLocaleString()}`} sub="Revenue − Expenses" color={totalRevenue > totalExpenses ? '#10B981' : '#EF4444'} />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All',...TYPES] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: type===t ? DARK : '#fff', color: type===t ? '#fff' : '#64748B' }}>{t}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} accounts</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal acc={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
