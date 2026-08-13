import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Role       { id: string; name: string; isActive: boolean }
interface Department { id: string; name: string }

interface AppUser {
  id: string
  fullName: string
  email: string
  isActive: boolean
  roleId: string | null
  departmentId: string | null
  role: Role | null
  department: { id: string; name: string } | null
}

const ROLE_COLORS: Record<string, string> = {
  'Super Admin':  '#EF4444',
  'Admin':        '#8B5CF6',
  'Manager':      '#1D4ED8',
  'Staff':        '#10B981',
  'Sales Staff':  '#10B981',
  'Viewer':       '#64748B',
}

const COLS = [
  { key: 'fullName',   label: 'Name' },
  { key: 'email',      label: 'Email' },
  { key: 'role',       label: 'Role',    width: 140 },
  { key: 'branch',     label: 'Dept',    width: 140 },
  { key: 'status',     label: 'Status',  width: 90  },
  { key: 'actions',    label: '',        width: 80  },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
}

interface ModalProps {
  user: AppUser | null
  isNew: boolean
  roles: Role[]
  departments: Department[]
  onClose: () => void
  onSaved: () => void
}

function Modal({ user, isNew, roles, departments, onClose, onSaved }: ModalProps) {
  const [fullName, setFullName]     = useState(user?.fullName ?? '')
  const [email, setEmail]           = useState(user?.email ?? '')
  const [roleId, setRoleId]         = useState(user?.roleId ?? '')
  const [departmentId, setDeptId]   = useState(user?.departmentId ?? '')
  const [isActive, setActive]       = useState(user?.isActive ?? true)
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) { setErr('Name and email are required'); return }
    setSaving(true)
    try {
      const body = {
        fullName: fullName.trim(),
        email: email.trim(),
        roleId: roleId || null,
        departmentId: departmentId || null,
        isActive,
      }
      if (isNew) {
        await api.post('/users', body)
      } else {
        await api.patch(`/users/${user!.id}`, body)
      }
      onSaved()
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 460, fontFamily: FONT, maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{isNew ? 'Invite User' : 'Edit User'}</h2>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Full Name *</span>
          <input value={fullName} onChange={e => setFullName(e.target.value)} style={inp} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Email Address *</span>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" style={inp} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Role</span>
            <select value={roleId} onChange={e => setRoleId(e.target.value)} style={inp}>
              <option value="">— No Role —</option>
              {roles.filter(r => r.isActive).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Department</span>
            <select value={departmentId} onChange={e => setDeptId(e.target.value)} style={inp}>
              <option value="">— None —</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
          <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
          <span style={{ fontSize: 13 }}>Active</span>
        </label>

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label={saving ? 'Saving…' : (isNew ? 'Create User' : 'Save')} onClick={submit} />
        </div>
      </div>
    </div>
  )
}

export function UsersPage() {
  const [users, setUsers]       = useState<AppUser[]>([])
  const [roles, setRoles]             = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading]   = useState(true)
  const [q, setQ]               = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState<{ user: AppUser | null; isNew: boolean } | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes, deptRes] = await Promise.all([
        api.get<{ data: AppUser[] }>('/users?pageSize=200'),
        api.get<{ data: Role[] }>('/roles?pageSize=100'),
        api.get<{ data: Department[] }>('/departments?pageSize=100'),
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
      setDepartments(deptRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u =>
    (!roleFilter || u.roleId === roleFilter) &&
    (u.fullName.toLowerCase().includes(q.toLowerCase()) ||
     u.email.toLowerCase().includes(q.toLowerCase()))
  )

  const rows = filtered.map(u => ({
    fullName: u.fullName,
    email:    u.email,
    role:     u.role
      ? <Badge label={u.role.name} color={ROLE_COLORS[u.role.name] ?? '#64748B'} />
      : <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    branch:   u.department?.name ?? <span style={{ color: '#94A3B8', fontSize: 12 }}>—</span>,
    status:   <Badge label={u.isActive ? 'Active' : 'Inactive'} color={u.isActive ? '#10B981' : '#64748B'} />,
    actions:  <button onClick={() => setModal({ user: u, isNew: false })} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  const activeRoles = roles.filter(r => r.isActive)

  return (
    <AdminLayout
      title="Users & Roles"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search users…" />
          <Btn label="+ Invite User" onClick={() => setModal({ user: null, isNew: true })} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Users" value={String(users.length)}                          sub="All accounts"     />
        <StatCard label="Active"      value={String(users.filter(u => u.isActive).length)}  sub="Currently active"  color="#10B981" />
        <StatCard label="Roles"       value={String(activeRoles.length)}                     sub="Defined roles"     color="#8B5CF6" />
        <StatCard label="Inactive"    value={String(users.filter(u => !u.isActive).length)} sub="Suspended"         color="#EF4444" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setRoleFilter('')} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: !roleFilter ? DARK : '#fff', color: !roleFilter ? '#fff' : '#64748B' }}>All</button>
        {activeRoles.map(r => (
          <button key={r.id} onClick={() => setRoleFilter(r.id)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: roleFilter === r.id ? DARK : '#fff', color: roleFilter === r.id ? '#fff' : '#64748B' }}>{r.name}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} users</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal && (
        <Modal
          user={modal.user}
          isNew={modal.isNew}
          roles={roles}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </AdminLayout>
  )
}
