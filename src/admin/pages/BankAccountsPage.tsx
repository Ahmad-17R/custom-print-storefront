import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Branch { id: string; name: string }
interface BankAccount {
  id: string; accountName: string; accountNumber: string; iban: string | null
  bankName: string; currency: string; balance: string; isActive: boolean; createdAt: string
  branch?: { id: string; name: string }
}

const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD']

function Modal({ item, branches, onClose, onSaved }: { item: Partial<BankAccount> | null; branches: Branch[]; onClose: () => void; onSaved: () => void }) {
  const [branchId, setBranch]   = useState(item?.branch?.id ?? branches[0]?.id ?? '')
  const [bankName, setBank]     = useState(item?.bankName ?? '')
  const [accountNumber, setNum] = useState(item?.accountNumber ?? '')
  const [iban, setIban]         = useState(item?.iban ?? '')
  const [currency, setCurrency] = useState(item?.currency ?? 'AED')
  const [isActive, setActive]   = useState(item?.isActive ?? true)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const body = { branchId, bankName, accountNumber, iban: iban || null, currency, isActive }
      if (item?.id) await api.patch(`/bank-accounts/${item.id}`, body)
      else          await api.post('/bank-accounts', body)
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{item?.id ? 'Edit Bank Account' : 'Add Bank Account'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <label>{lbl('Branch *')}<select style={inp} value={branchId} onChange={e => setBranch(e.target.value)}>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>{lbl('Bank Name *')}<input style={inp} value={bankName} onChange={e => setBank(e.target.value)} placeholder="e.g. Emirates NBD" /></label>
            <label>{lbl('Currency')}<select style={inp} value={currency} onChange={e => setCurrency(e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <label>{lbl('Account Number *')}<input style={inp} value={accountNumber} onChange={e => setNum(e.target.value)} placeholder="e.g. 1234567890" /></label>
          <label>{lbl('IBAN')}<input style={inp} value={iban} onChange={e => setIban(e.target.value)} placeholder="e.g. AE07 0331 2345 6789 0123 456" /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} /> Active
          </label>
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
  { key: 'bankName', label: 'Bank', width: 160 }, { key: 'accountName', label: 'Account Name' },
  { key: 'accountNumber', label: 'Account #', width: 160 }, { key: 'currency', label: 'Currency', width: 90 },
  { key: 'balance', label: 'Balance', width: 140 }, { key: 'status', label: 'Status', width: 90 },
  { key: 'actions', label: '', width: 130 },
]

export function BankAccountsPage() {
  const [data, setData]       = useState<BankAccount[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [modal, setModal]     = useState<Partial<BankAccount> | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [r, b] = await Promise.all([
        api.get<{ data: BankAccount[] }>('/bank-accounts?pageSize=200'),
        api.get<{ data: Branch[] }>('/branches?pageSize=100'),
      ])
      setData(r.data); setBranches(b.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete bank account "${name}"?`)) return
    try { await api.delete(`/bank-accounts/${id}`); load() }
    catch (e: any) { alert(e?.message ?? 'Delete failed') }
  }

  const filtered = data.filter(r =>
    r.bankName.toLowerCase().includes(q.toLowerCase()) ||
    r.accountNumber.toLowerCase().includes(q.toLowerCase()) ||
    (r.iban ?? '').toLowerCase().includes(q.toLowerCase())
  )
  const totalAED = data.filter(r => r.currency === 'AED' && r.isActive).reduce((s, r) => s + Number(r.balance), 0)
  const btnS: React.CSSProperties = { fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: FONT }

  const rows = filtered.map(r => ({
    bankName: r.bankName,
    accountName: r.accountName ?? r.bankName,
    accountNumber: <code style={{ fontSize: 12 }}>{r.accountNumber}</code>,
    currency: r.currency,
    balance: <strong>{r.currency} {Number(r.balance).toLocaleString()}</strong>,
    status: <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#64748B'} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModal(r)} style={{ ...btnS, border: '1px solid #E2E8F0', background: '#fff' }}>Edit</button>
        <button onClick={() => del(r.id, r.bankName)} style={{ ...btnS, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' }}>Delete</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Bank Accounts" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search bank, account…" /><Btn label="+ Add Account" onClick={() => setModal({})} /></>}>
      <StatGrid>
        <StatCard label="Total Accounts" value={String(data.length)} sub="All bank accounts" />
        <StatCard label="Active" value={String(data.filter(r => r.isActive).length)} sub="Active accounts" color="#10B981" />
        <StatCard label="AED Balance" value={`AED ${totalAED.toLocaleString()}`} sub="Active AED accounts" color="#1D4ED8" />
        <StatCard label="Currencies" value={String(new Set(data.map(r => r.currency)).size)} sub="Unique currencies" color="#8B5CF6" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {modal !== null && <Modal item={modal} branches={branches} onClose={() => setModal(null)} onSaved={load} />}
    </AdminLayout>
  )
}
