import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid, Btn } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t}</div>

interface Account { id: string; code: string; name: string }
interface JournalEntry {
  id: string; reference: string | null; description: string | null; debit: string; credit: string
  status: string; entryDate: string; createdBy: string; createdAt: string
  account: { id: string; code: string; name: string }
}

const STATUS_COLOR: Record<string, string> = { draft: '#64748B', posted: '#10B981', reversed: '#EF4444' }

function Modal({ accounts, onClose, onSaved }: { accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [accountId, setAccount] = useState(accounts[0]?.id ?? '')
  const [reference, setRef]     = useState('')
  const [description, setDesc]  = useState('')
  const [debit, setDebit]       = useState('')
  const [credit, setCredit]     = useState('')
  const [entryDate, setDate]    = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const save = async () => {
    if (!debit && !credit) { setErr('Enter either a debit or credit amount'); return }
    setSaving(true); setErr('')
    try {
      await api.post('/journals', {
        accountId, reference: reference || null, description: description || null,
        debit: debit ? Number(debit) : 0, credit: credit ? Number(credit) : 0,
        entryDate, createdBy: 'admin',
      })
      onSaved(); onClose()
    } catch (e: any) { setErr(e?.message ?? 'Error') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: 500, padding: 28, fontFamily: FONT }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>New Journal Entry</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <label>{lbl('Account *')}<select style={inp} value={accountId} onChange={e => setAccount(e.target.value)}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
          </select></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>{lbl('Reference')}<input style={inp} value={reference} onChange={e => setRef(e.target.value)} placeholder="e.g. INV-001" /></label>
            <label>{lbl('Entry Date *')}<input type="date" style={inp} value={entryDate} onChange={e => setDate(e.target.value)} /></label>
            <label>{lbl('Debit (AED)')}<input type="number" min="0" step="0.01" style={inp} value={debit} onChange={e => { setDebit(e.target.value); if (e.target.value) setCredit('') }} placeholder="0.00" /></label>
            <label>{lbl('Credit (AED)')}<input type="number" min="0" step="0.01" style={inp} value={credit} onChange={e => { setCredit(e.target.value); if (e.target.value) setDebit('') }} placeholder="0.00" /></label>
          </div>
          <label>{lbl('Description')}<textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }} value={description} onChange={e => setDesc(e.target.value)} placeholder="What is this entry for?" /></label>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : 'Save Entry'} onClick={save} />
        </div>
      </div>
    </div>
  )
}

const COLS = [
  { key: 'account', label: 'Account', width: 200 }, { key: 'reference', label: 'Ref #', width: 120 },
  { key: 'description', label: 'Description' }, { key: 'debit', label: 'Debit', width: 120 },
  { key: 'credit', label: 'Credit', width: 120 }, { key: 'status', label: 'Status', width: 90 },
  { key: 'entryDate', label: 'Date', width: 110 },
]

export function JournalEntriesPage() {
  const [data, setData]       = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ]             = useState('')
  const [showModal, setModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, a] = await Promise.all([
        api.get<{ data: JournalEntry[] }>('/journals?pageSize=200'),
        api.get<{ data: Account[] }>('/chart-of-accounts?pageSize=500'),
      ])
      setData(r.data); setAccounts(a.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    (r.reference ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(q.toLowerCase()) ||
    r.account.name.toLowerCase().includes(q.toLowerCase())
  )
  const totalPostedDebit = data.filter(r => r.status === 'posted').reduce((s, r) => s + Number(r.debit), 0)

  const rows = filtered.map(r => ({
    account: `${r.account.code} — ${r.account.name}`,
    reference: r.reference ? <code style={{ fontSize: 12 }}>{r.reference}</code> : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    description: r.description ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    debit: Number(r.debit) > 0 ? <span style={{ color: '#1D4ED8', fontWeight: 600 }}>AED {Number(r.debit).toLocaleString()}</span> : <span style={{ color: '#94A3B8' }}>—</span>,
    credit: Number(r.credit) > 0 ? <span style={{ color: '#10B981', fontWeight: 600 }}>AED {Number(r.credit).toLocaleString()}</span> : <span style={{ color: '#94A3B8' }}>—</span>,
    status: <Badge label={r.status} color={STATUS_COLOR[r.status] ?? '#64748B'} />,
    entryDate: r.entryDate.slice(0, 10),
  }))

  return (
    <AdminLayout title="Journal Entries" actions={<><SearchInput value={q} onChange={setQ} placeholder="Search account, reference…" /><Btn label="+ New Entry" onClick={() => setModal(true)} /></>}>
      <StatGrid>
        <StatCard label="Total Entries" value={String(data.length)} sub="All journal entries" />
        <StatCard label="Posted" value={String(data.filter(r => r.status === 'posted').length)} sub="Posted entries" color="#10B981" />
        <StatCard label="Drafts" value={String(data.filter(r => r.status === 'draft').length)} sub="Draft entries" color="#F59E0B" />
        <StatCard label="Posted Debits" value={`AED ${totalPostedDebit.toLocaleString()}`} sub="Total posted debits" color="#1D4ED8" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : <Table columns={COLS} rows={rows} />}
      {showModal && <Modal accounts={accounts} onClose={() => setModal(false)} onSaved={load} />}
    </AdminLayout>
  )
}
