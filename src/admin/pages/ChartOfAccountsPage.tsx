import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'

interface Account {
  id: string
  code: string
  name: string
  type: AccountType
  isActive: boolean
}

// What each system account code is used for — shown to admin as context
const ACCOUNT_USAGE: Record<string, string> = {
  '1001': 'Debited on: walk-in cash sales, expense payments, payroll',
  '1002': 'Debited on: bank transfer receipts; credited on: bank payments to suppliers',
  '1003': 'Debited on: POS sales',
  '1100': 'Debited on: online order delivered; credited on: customer payment received',
  '1200': 'Debited on: stock received from supplier; credited on: depreciation entries',
  '2001': 'Credited on: purchase order confirmed; debited on: supplier payment',
  '2002': 'Credited on: VAT collected from customers (used for FTA filing)',
  '2003': 'Credited on: payroll processed',
  '3001': 'Owner capital account',
  '3002': 'Retained profits carried forward',
  '4001': 'Credited on: online order delivered',
  '4002': 'Credited on: POS sale completed',
  '4003': 'Credited on: walk-in sale completed',
  '5001': 'Debited on: payroll paid',
  '5002': 'Debited on: expense claim paid, depreciation',
  '5003': 'Debited on: purchase order confirmed (cost of goods)',
}

const TYPE_LABEL: Record<AccountType, string> = { asset: 'Asset', liability: 'Liability', equity: 'Equity', revenue: 'Revenue', expense: 'Expense' }
const TYPE_COLOR: Record<AccountType, string> = { asset: '#1D4ED8', liability: '#EF4444', equity: '#8B5CF6', revenue: '#10B981', expense: '#F59E0B' }
const TYPES: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense']

const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }

function RenameModal({ acc, onClose, onSaved }: { acc: Account; onClose: () => void; onSaved: () => void }) {
  const [name, setName]     = useState(acc.name)
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const submit = async () => {
    if (!name.trim()) { setErr('Name cannot be empty'); return }
    setSaving(true)
    try {
      await api.patch(`/chart-of-accounts/${acc.id}`, { name: name.trim() })
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const usage = ACCOUNT_USAGE[acc.code]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, fontFamily: FONT, boxSizing: 'border-box' }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: DARK, marginBottom: 6 }}>Rename Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <code style={{ fontSize: 13, background: '#F1F5F9', padding: '3px 8px', borderRadius: 6, color: '#475569' }}>{acc.code}</code>
          <Badge label={TYPE_LABEL[acc.type]} color={TYPE_COLOR[acc.type]} />
        </div>

        {usage && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0369A1', marginBottom: 16 }}>
            <strong>Used for:</strong> {usage}
          </div>
        )}

        <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#64748B' }}>Display Name</div>
        <input style={{ ...inp, marginBottom: 6 }} value={name} onChange={e => setName(e.target.value)} autoFocus />
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 20 }}>
          Only the name changes. The account code and type are fixed — the system uses them to route transactions automatically.
        </div>

        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  )
}

const COLS = [
  { key: 'code',    label: 'Code',         width: 80  },
  { key: 'name',    label: 'Name'                     },
  { key: 'usage',   label: 'Used For'                 },
  { key: 'type',    label: 'Type',         width: 110 },
  { key: 'actions', label: '',             width: 80  },
]

export function ChartOfAccountsPage() {
  const [data, setData]         = useState<Account[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [typeFilter, setFilter] = useState<AccountType | 'all'>('all')
  const [editing, setEditing]   = useState<Account | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Account[] }>('/chart-of-accounts?pageSize=500')
      setData(res.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = data.filter(a =>
    (typeFilter === 'all' || a.type === typeFilter) &&
    (a.code.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(a => ({
    code:  <code style={{ fontSize: 12, background: '#F1F5F9', padding: '2px 7px', borderRadius: 5, color: '#475569' }}>{a.code}</code>,
    name:  <span style={{ fontWeight: 600 }}>{a.name}</span>,
    usage: <span style={{ fontSize: 12, color: '#64748B' }}>{ACCOUNT_USAGE[a.code] ?? '—'}</span>,
    type:  <Badge label={TYPE_LABEL[a.type]} color={TYPE_COLOR[a.type]} />,
    actions: (
      <button onClick={() => setEditing(a)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>
        Rename
      </button>
    ),
  }))

  return (
    <AdminLayout title="Chart of Accounts" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Search code or name…" />
      </div>
    }>
      {/* Info banner */}
      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontFamily: FONT, fontSize: 13, color: '#0369A1' }}>
        These accounts are <strong>fixed by the system</strong> and automatically receive journal entries on every transaction. You can rename them to match your preferred terminology, but the codes and types cannot be changed.
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...TYPES] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer',
            border: '1px solid #E2E8F0',
            background: typeFilter === t ? DARK : '#fff',
            color: typeFilter === t ? '#fff' : '#64748B',
          }}>
            {t === 'all' ? `All (${data.length})` : `${TYPE_LABEL[t]} (${data.filter(a => a.type === t).length})`}
          </button>
        ))}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No accounts found. Run the seed script on the server to create system accounts.</div>
          : <Table columns={COLS} rows={rows} />
      }

      {editing && <RenameModal acc={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </AdminLayout>
  )
}
