import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

// ── Types ─────────────────────────────────────────────────────────────────────
type ProjStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

interface Project {
  id: string; name: string; description: string | null
  status: ProjStatus; startDate: string | null; endDate: string | null
  createdAt: string; department: { id: string; name: string } | null
  _count: { tasks: number }
}

interface Task {
  id: string; projectId: string; title: string; description: string | null
  status: TaskStatus; priority: TaskPriority; dueDate: string | null
  assignedToId: string | null; completedAt: string | null; createdAt: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PROJ_STATUS_LABEL: Record<ProjStatus, string> = { planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed', cancelled: 'Cancelled' }
const PROJ_STATUS_COLOR: Record<ProjStatus, string> = { planning: '#8B5CF6', active: '#10B981', on_hold: '#F59E0B', completed: '#1D4ED8', cancelled: '#EF4444' }
const PROJ_STATUSES: ProjStatus[] = ['planning', 'active', 'on_hold', 'completed', 'cancelled']

const TASK_STATUS_LABEL: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', cancelled: 'Cancelled' }
const TASK_STATUS_COLOR: Record<TaskStatus, string> = { todo: '#94A3B8', in_progress: '#3B82F6', review: '#F59E0B', done: '#10B981', cancelled: '#EF4444' }
const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done', 'cancelled']

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }
const PRIORITY_COLOR: Record<TaskPriority, string>  = { low: '#94A3B8', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' }

// ── Shared Styles ─────────────────────────────────────────────────────────────
const btn = (variant: 'primary' | 'ghost' | 'danger' = 'ghost'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: 'none',
  background: variant === 'primary' ? DARK : variant === 'danger' ? '#FEF2F2' : '#F1F5F9',
  color: variant === 'primary' ? '#fff' : variant === 'danger' ? '#EF4444' : '#374151',
})

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
  fontSize: 13, fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: FONT, display: 'block', marginBottom: 4 }

// ── Overlay Modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Create / Edit Project Modal ───────────────────────────────────────────────
function ProjectModal({ project, onClose, onSaved }: { project?: Project; onClose: () => void; onSaved: () => void }) {
  const [name, setName]         = useState(project?.name ?? '')
  const [description, setDesc]  = useState(project?.description ?? '')
  const [status, setStatus]     = useState<ProjStatus>(project?.status ?? 'planning')
  const [startDate, setStart]   = useState(project?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEnd]       = useState(project?.endDate?.slice(0, 10) ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const save = async () => {
    if (!name.trim()) return setError('Project name is required')
    setSaving(true); setError('')
    try {
      const payload = { name: name.trim(), description: description.trim() || null, status, startDate: startDate || null, endDate: endDate || null }
      if (project) await api.patch(`/projects/${project.id}`, payload)
      else await api.post('/projects', payload)
      onSaved()
    } catch { setError('Failed to save project') } finally { setSaving(false) }
  }

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Project Name *</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ramadan Campaign Print" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={description} onChange={e => setDesc(e.target.value)} placeholder="What is this project about?" />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as ProjStatus)}>
            {PROJ_STATUSES.map(s => <option key={s} value={s}>{PROJ_STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Start Date</label>
            <input type="date" style={inputStyle} value={startDate} onChange={e => setStart(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input type="date" style={inputStyle} value={endDate} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>
        {error && <div style={{ color: '#EF4444', fontSize: 12, fontFamily: FONT }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Project'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Add Task Modal ────────────────────────────────────────────────────────────
function TaskModal({ projectId, task, onClose, onSaved }: { projectId: string; task?: Task; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle]       = useState(task?.title ?? '')
  const [description, setDesc]  = useState(task?.description ?? '')
  const [status, setStatus]     = useState<TaskStatus>(task?.status ?? 'todo')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium')
  const [dueDate, setDue]       = useState(task?.dueDate?.slice(0, 10) ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const save = async () => {
    if (!title.trim()) return setError('Title is required')
    setSaving(true); setError('')
    try {
      const payload = { title: title.trim(), description: description.trim() || null, status, priority, dueDate: dueDate || null }
      if (task) await api.patch(`/projects/tasks/${task.id}`, payload)
      else await api.post(`/projects/${projectId}/tasks`, payload)
      onSaved()
    } catch { setError('Failed to save task') } finally { setSaving(false) }
  }

  return (
    <Modal title={task ? 'Edit Task' : 'Add Task'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={labelStyle}>Task Title *</label>
          <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Design business card artwork" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={description} onChange={e => setDesc(e.target.value)} placeholder="Task details or notes…" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map(s => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select style={inputStyle} value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Due Date</label>
          <input type="date" style={inputStyle} value={dueDate} onChange={e => setDue(e.target.value)} />
        </div>
        {error && <div style={{ color: '#EF4444', fontSize: 12, fontFamily: FONT }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button style={btn('ghost')} onClick={onClose}>Cancel</button>
          <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Task'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({ project, onBack, onRefresh }: { project: Project; onBack: () => void; onRefresh: () => void }) {
  const [tasks, setTasks]         = useState<Task[]>([])
  const [loading, setLoading]     = useState(true)
  const [taskFilter, setTFilter]  = useState<TaskStatus | 'all'>('all')
  const [showTaskModal, setShowTask] = useState(false)
  const [editTask, setEditTask]   = useState<Task | undefined>()
  const [editProject, setEditProject] = useState(false)
  const [fullProject, setFullProject] = useState(project)

  const loadTasks = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: Task[] }>(`/projects/${project.id}/tasks?pageSize=200`); setTasks(r.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTasks() }, [project.id])

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await api.delete(`/projects/tasks/${id}`)
    loadTasks()
  }

  const quickStatus = async (task: Task, newStatus: TaskStatus) => {
    await api.patch(`/projects/tasks/${task.id}`, { status: newStatus })
    loadTasks()
  }

  const filtered = tasks.filter(t => taskFilter === 'all' || t.status === taskFilter)
  const done  = tasks.filter(t => t.status === 'done').length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const isOverdue = (t: Task) => t.dueDate && t.status !== 'done' && t.status !== 'cancelled' && new Date(t.dueDate) < new Date()

  return (
    <AdminLayout
      title={fullProject.name}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn('ghost')} onClick={onBack}>← Back to Projects</button>
          <button style={btn('ghost')} onClick={() => setEditProject(true)}>Edit Project</button>
          <button style={btn('primary')} onClick={() => { setEditTask(undefined); setShowTask(true) }}>+ Add Task</button>
        </div>
      }
    >
      {/* Project info bar */}
      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</span>
          <div style={{ marginTop: 4 }}><Badge label={PROJ_STATUS_LABEL[fullProject.status]} color={PROJ_STATUS_COLOR[fullProject.status]} /></div>
        </div>
        {fullProject.startDate && <div>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start</span>
          <div style={{ fontFamily: FONT, fontSize: 13, color: DARK, marginTop: 4 }}>{fullProject.startDate.slice(0, 10)}</div>
        </div>}
        {fullProject.endDate && <div>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due</span>
          <div style={{ fontFamily: FONT, fontSize: 13, color: new Date(fullProject.endDate) < new Date() && fullProject.status !== 'completed' ? '#EF4444' : DARK, marginTop: 4 }}>{fullProject.endDate.slice(0, 10)}</div>
        </div>}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Progress</span>
            <span style={{ fontSize: 12, fontFamily: FONT, color: DARK, fontWeight: 600 }}>{done}/{total} tasks done ({pct}%)</span>
          </div>
          <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : '#3B82F6', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>

      {fullProject.description && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontFamily: FONT, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          {fullProject.description}
        </div>
      )}

      {/* Task filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK, marginRight: 8 }}>Tasks</span>
        {(['all', ...TASK_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setTFilter(s)} style={{ padding: '4px 10px', borderRadius: 16, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: taskFilter === s ? DARK : '#fff', color: taskFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? `All (${tasks.length})` : `${TASK_STATUS_LABEL[s]} (${tasks.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>
          {tasks.length === 0 ? 'No tasks yet — click "+ Add Task" to create one.' : 'No tasks match this filter.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ background: '#fff', border: `1px solid ${isOverdue(t) ? '#FECACA' : '#E2E8F0'}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Status quick-toggle circle */}
              <button
                onClick={() => {
                  const next: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'review', review: 'done', done: 'todo', cancelled: 'todo' }
                  quickStatus(t, next[t.status])
                }}
                title="Click to advance status"
                style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${TASK_STATUS_COLOR[t.status]}`, background: t.status === 'done' ? TASK_STATUS_COLOR[t.status] : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: t.status === 'done' ? '#94A3B8' : DARK, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                  <Badge label={TASK_STATUS_LABEL[t.status]} color={TASK_STATUS_COLOR[t.status]} />
                  <Badge label={PRIORITY_LABEL[t.priority]} color={PRIORITY_COLOR[t.priority]} />
                  {isOverdue(t) && <Badge label="Overdue" color="#EF4444" />}
                </div>
                {t.description && <div style={{ fontFamily: FONT, fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{t.description}</div>}
                {t.dueDate && <div style={{ fontFamily: FONT, fontSize: 11, color: isOverdue(t) ? '#EF4444' : '#94A3B8', marginTop: 4 }}>Due: {t.dueDate.slice(0, 10)}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => { setEditTask(t); setShowTask(true) }}>Edit</button>
                <button style={{ ...btn('danger'), padding: '4px 10px', fontSize: 12 }} onClick={() => deleteTask(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          projectId={project.id}
          task={editTask}
          onClose={() => { setShowTask(false); setEditTask(undefined) }}
          onSaved={() => { setShowTask(false); setEditTask(undefined); loadTasks() }}
        />
      )}

      {editProject && (
        <ProjectModal
          project={fullProject}
          onClose={() => setEditProject(false)}
          onSaved={async () => {
            setEditProject(false)
            const updated = await api.get<Project & { tasks: Task[] }>(`/projects/${project.id}`)
            setFullProject(updated as unknown as Project)
            onRefresh()
          }}
        />
      )}
    </AdminLayout>
  )
}

// ── Projects List ─────────────────────────────────────────────────────────────
const LIST_COLS = [
  { key: 'name', label: 'Project Name' },
  { key: 'tasks', label: 'Tasks', width: 80 },
  { key: 'progress', label: 'Progress', width: 160 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'endDate', label: 'Due Date', width: 110 },
  { key: 'action', label: '', width: 80 },
]

export function ProjectsPage() {
  const [data, setData]           = useState<Project[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [statusFilter, setFilter] = useState<ProjStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail]       = useState<Project | null>(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get<{ data: Project[] }>('/projects?pageSize=200'); setData(r.data) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (detail) return <ProjectDetail project={detail} onBack={() => setDetail(null)} onRefresh={load} />

  const filtered = data.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    r.name.toLowerCase().includes(q.toLowerCase())
  )

  const rows = filtered.map(r => {
    const taskCount = r._count.tasks
    return {
      name: (
        <button onClick={() => setDetail(r)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#1D4ED8', textAlign: 'left' }}>
          {r.name}
        </button>
      ),
      tasks: <span style={{ fontFamily: FONT, fontSize: 13 }}>{taskCount}</span>,
      progress: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: r.status === 'completed' ? '100%' : '0%', background: '#3B82F6', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: FONT, minWidth: 28 }}>{r.status === 'completed' ? '100%' : '—'}</span>
        </div>
      ),
      status: <Badge label={PROJ_STATUS_LABEL[r.status]} color={PROJ_STATUS_COLOR[r.status]} />,
      endDate: r.endDate ? r.endDate.slice(0, 10) : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
      action: <button style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => setDetail(r)}>Open</button>,
    }
  })

  return (
    <AdminLayout
      title="Projects"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search project…" />
          <button style={btn('primary')} onClick={() => setShowCreate(true)}>+ New Project</button>
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total"     value={String(data.length)}                                         sub="All projects" />
        <StatCard label="Active"    value={String(data.filter(r => r.status === 'active').length)}      sub="Active projects"    color="#10B981" />
        <StatCard label="Tasks"     value={String(data.reduce((s, r) => s + r._count.tasks, 0))}        sub="Total tasks"        color="#8B5CF6" />
        <StatCard label="Completed" value={String(data.filter(r => r.status === 'completed').length)}   sub="Completed"          color="#1D4ED8" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', ...PROJ_STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: statusFilter === s ? DARK : '#fff', color: statusFilter === s ? '#fff' : '#64748B' }}>
            {s === 'all' ? 'All' : PROJ_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading
        ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : data.length === 0
          ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No projects yet. Click "+ New Project" to start one.</div>
          : <><div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} projects</div><Table columns={LIST_COLS} rows={rows} /></>
      }

      {showCreate && (
        <ProjectModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />
      )}
    </AdminLayout>
  )
}
