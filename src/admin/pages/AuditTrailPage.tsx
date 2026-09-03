import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"

interface AuditLog { id: string; action: string; module: string; recordId: string | null; userId: string | null; ipAddress: string | null; createdAt: string; newValues: Record<string, unknown> | null }
const COLS = [
  { key: 'action',   label: 'Action',    width: 100 },
  { key: 'module',   label: 'Module',    width: 160 },
  { key: 'recordId', label: 'Record ID', width: 130 },
  { key: 'ipAddress', label: 'IP',       width: 130 },
  { key: 'createdAt', label: 'Timestamp', width: 170 },
]

const ACTION_COLOR: Record<string, string> = { create: '#10B981', update: '#1D4ED8', delete: '#EF4444', login: '#8B5CF6', logout: '#64748B' }

export function AuditTrailPage() {
  const [data, setData] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: AuditLog[] }>('/audit?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => r.module.toLowerCase().includes(q.toLowerCase()) || r.action.toLowerCase().includes(q.toLowerCase()))
  const rows = filtered.map(r => ({
    action:   <span style={{ color: ACTION_COLOR[r.action.toLowerCase()] ?? '#64748B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{r.action}</span>,
    module:   <span style={{ fontFamily: FONT, fontSize: 13 }}>{r.module.replace(/_/g, ' ')}</span>,
    recordId: r.recordId ? <code style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>{r.recordId.slice(0, 8)}…</code> : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    ipAddress: r.ipAddress ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    createdAt: new Date(r.createdAt).toLocaleString(),
  }))

  return (
    <AdminLayout title="Audit Trail" actions={<SearchInput value={q} onChange={setQ} placeholder="Search entity, action, user…" />}>
      <StatGrid>
        <StatCard label="Total Logs" value={String(data.length)} sub="All audit logs" />
        <StatCard label="Today" value={String(data.filter(r => r.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length)} sub="Today's events" color="#1D4ED8" />
        <StatCard label="Creates" value={String(data.filter(r => r.action.toLowerCase() === 'create').length)} sub="Create actions" color="#10B981" />
        <StatCard label="Deletes" value={String(data.filter(r => r.action.toLowerCase() === 'delete').length)} sub="Delete actions" color="#EF4444" />
      </StatGrid>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No audit logs yet. Actions you take will appear here automatically.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} logs</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
