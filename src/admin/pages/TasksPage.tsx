import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
interface Task {
  id: string; title: string; status: TaskStatus; priority: TaskPriority; dueDate: string | null; createdAt: string
  project: { id: string; name: string }
  assignee: { id: string; email: string } | null
}

const STATUS_LABEL: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' }
const STATUS_COLOR: Record<TaskStatus, string> = { todo: '#64748B', in_progress: '#F59E0B', done: '#10B981', cancelled: '#EF4444' }
const PRIORITY_COLOR: Record<TaskPriority, string> = { low: '#64748B', medium: '#1D4ED8', high: '#F59E0B', urgent: '#EF4444' }
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled']
const COLS = [
  { key: 'title', label: 'Task' }, { key: 'project', label: 'Project', width: 160 },
  { key: 'priority', label: 'Priority', width: 100 }, { key: 'status', label: 'Status', width: 120 },
  { key: 'assignee', label: 'Assignee', width: 180 }, { key: 'dueDate', label: 'Due', width: 110 },
]

export function TasksPage() {
  const [data, setData] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<TaskStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Task[] }>('/projects/tasks?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && (r.title.toLowerCase().includes(q.toLowerCase()) || r.project.name.toLowerCase().includes(q.toLowerCase())))
  const rows = filtered.map(r => ({
    title: r.title, project: r.project.name,
    priority: <Badge label={r.priority} color={PRIORITY_COLOR[r.priority]} />,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    assignee: r.assignee ? r.assignee.email : <span style={{ color: '#94A3B8', fontSize: 12 }}>Unassigned</span>,
    dueDate: r.dueDate ? r.dueDate.slice(0, 10) : '—',
  }))

  return (
    <AdminLayout title="Tasks" actions={<SearchInput value={q} onChange={setQ} placeholder="Search task, project…" />}>
      <StatGrid>
        <StatCard label="Total Tasks" value={String(data.length)} sub="All tasks" />
        <StatCard label="In Progress" value={String(data.filter(r => r.status === 'in_progress').length)} sub="Active tasks" color="#F59E0B" />
        <StatCard label="Done" value={String(data.filter(r => r.status === 'done').length)} sub="Completed" color="#10B981" />
        <StatCard label="Urgent" value={String(data.filter(r => r.priority === 'urgent').length)} sub="Urgent priority" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</button>)}
      </div>
      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No tasks yet.</div>
        : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} tasks</div><Table columns={COLS} rows={rows} /></>}
    </AdminLayout>
  )
}
