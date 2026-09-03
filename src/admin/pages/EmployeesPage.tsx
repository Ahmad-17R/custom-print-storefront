import { useEffect, useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { PAGE_RIGHTS, FEATURE_RIGHTS, PRESETS } from '../lib/rights'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Warehouse  { id: string; name: string; city: string | null }
interface Department { id: string; name: string; warehouseId: string | null }
interface Shift      { id: string; name: string }
interface PosRegister { id: string; name: string; assignedEmployeeId: string | null }

interface Employee {
  id: string; employeeNo: string; name: string; jobTitle: string | null
  phone: string | null; email: string | null; nationalId: string | null
  contractType: string | null; salary: string | null; joinDate: string | null
  isActive: boolean; createdAt: string; role: string
  isOwner?: boolean; permissions?: string[] | null
  warehouse: Warehouse | null; department: Department | null; shift: Shift | null
}

const ROLES = ['staff', 'cashier', 'pos_operator', 'fulfillment', 'accountant', 'hr', 'admin']
const ROLE_LABEL: Record<string, string> = {
  staff: 'Staff', cashier: 'Cashier', pos_operator: 'POS Operator',
  fulfillment: 'Fulfillment', accountant: 'Accountant', hr: 'HR', admin: 'Admin',
}
const ROLE_COLOR: Record<string, string> = {
  admin: '#7C3AED', hr: '#0EA5E9', accountant: '#F59E0B',
  cashier: '#10B981', pos_operator: '#10B981', fulfillment: '#3B82F6', staff: '#94A3B8',
}

const CONTRACT_LABEL: Record<string, string> = {
  full_time: 'Full-Time', part_time: 'Part-Time', contract: 'Contract', intern: 'Intern',
}

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0',
  borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' as const, outline: 'none',
}
const lbl = (t: string) => <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, fontFamily: FONT }}>{t}</div>

interface ModalProps {
  emp: Employee | null; isNew: boolean
  warehouses: Warehouse[]; departments: Department[]; shifts: Shift[]
  onClose: () => void; onSaved: () => void
}

function Modal({ emp, isNew, warehouses, departments, shifts, onClose, onSaved }: ModalProps) {
  const [name, setName]             = useState(emp?.name ?? '')
  const [employeeNo, setNo]         = useState(emp?.employeeNo ?? '')
  const [jobTitle, setTitle]        = useState(emp?.jobTitle ?? '')
  const [phone, setPhone]           = useState(emp?.phone ?? '')
  const [email, setEmail]           = useState(emp?.email ?? '')
  const [nationalId, setNatId]      = useState(emp?.nationalId ?? '')
  const [contractType, setContract] = useState(emp?.contractType ?? 'full_time')
  const [warehouseId, setWarehouse] = useState(emp?.warehouse?.id ?? '')
  const [departmentId, setDept]     = useState(emp?.department?.id ?? '')
  const [shiftId, setShift]         = useState(emp?.shift?.id ?? '')
  const [joinDate, setJoinDate]     = useState(emp?.joinDate?.slice(0, 10) ?? '')
  const [salary, setSalary]         = useState(emp?.salary ? String(Number(emp.salary)) : '')
  const [isActive, setActive]       = useState(emp?.isActive ?? true)
  const [saving, setSaving]         = useState(false)
  const [err, setErr]               = useState('')

  // Filter departments by selected warehouse
  const filteredDepts = warehouseId
    ? departments.filter(d => d.warehouseId === warehouseId)
    : departments

  const handleWarehouseChange = (wId: string) => {
    setWarehouse(wId)
    // Clear department if it doesn't belong to new warehouse
    const stillValid = departments.find(d => d.id === departmentId && (!wId || d.warehouseId === wId))
    if (!stillValid) setDept('')
  }

  const submit = async () => {
    if (!name.trim())       { setErr('Name is required'); return }
    if (!employeeNo.trim()) { setErr('Employee # is required'); return }
    setSaving(true)
    try {
      const body = {
        name: name.trim(), jobTitle: jobTitle.trim() || null,
        phone: phone.trim() || null, email: email.trim() || null,
        nationalId: nationalId.trim() || null, contractType,
        warehouseId: warehouseId || null,
        departmentId: departmentId || null, shiftId: shiftId || null,
        joinDate: joinDate || null,
        salary: salary ? Number(salary) : null, isActive,
        ...(isNew && { employeeNo: employeeNo.trim() }),
      }
      if (isNew) await api.post('/employees', body)
      else       await api.patch(`/employees/${emp!.id}`, body)
      onSaved(); onClose()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 580, maxHeight: '90vh', overflowY: 'auto', padding: 28, fontFamily: FONT }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: DARK }}>{isNew ? 'Add Employee' : 'Edit Employee'}</div>
        {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label><div>{lbl('Full Name *')}</div><input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Ahmed Al-Rashid" /></label>
          <label><div>{lbl('Employee # *')}</div><input style={inp} value={employeeNo} onChange={e => setNo(e.target.value)} placeholder="EMP-001" disabled={!isNew} /></label>
          <label><div>{lbl('Job Title')}</div><input style={inp} value={jobTitle} onChange={e => setTitle(e.target.value)} placeholder="Print Operator" /></label>
          <label>
            <div>{lbl('Contract Type')}</div>
            <select style={inp} value={contractType} onChange={e => setContract(e.target.value)}>
              <option value="full_time">Full-Time</option>
              <option value="part_time">Part-Time</option>
              <option value="contract">Contract</option>
              <option value="intern">Intern</option>
            </select>
          </label>

          {/* Warehouse first → Department cascades */}
          <label>
            <div>{lbl('Warehouse / Branch')}</div>
            <select style={inp} value={warehouseId} onChange={e => handleWarehouseChange(e.target.value)}>
              <option value="">— select location —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}{w.city ? ` — ${w.city}` : ''}</option>)}
            </select>
          </label>
          <label>
            <div>{lbl('Department')}</div>
            <select style={inp} value={departmentId} onChange={e => setDept(e.target.value)}>
              <option value="">— none —</option>
              {filteredDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {warehouseId && filteredDepts.length === 0 && (
              <div style={{ fontSize: 11, color: '#F59E0B', marginTop: 4 }}>No departments assigned to this location yet</div>
            )}
          </label>

          <label><div>{lbl('Phone')}</div><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+971 50 123 4567" /></label>
          <label><div>{lbl('Email')}</div><input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmed@company.com" /></label>
          <label><div>{lbl('National ID / Emirates ID')}</div><input style={inp} value={nationalId} onChange={e => setNatId(e.target.value)} placeholder="784-XXXX-XXXXXXX-X" /></label>
          <label><div>{lbl('Join Date')}</div><input type="date" style={inp} value={joinDate} onChange={e => setJoinDate(e.target.value)} /></label>
          <label><div>{lbl('Monthly Salary (AED)')}</div><input type="number" min={0} step="0.01" style={inp} value={salary} onChange={e => setSalary(e.target.value)} placeholder="0.00" /></label>
          <label>
            <div>{lbl('Shift')}</div>
            <select style={inp} value={shiftId} onChange={e => setShift(e.target.value)}>
              <option value="">— none —</option>
              {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
            <input type="checkbox" checked={isActive} onChange={e => setActive(e.target.checked)} />
            <span style={{ fontSize: 13, color: DARK }}>Active</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: DARK, color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : isNew ? 'Add Employee' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AccessModal({ emp, registers, onClose, onSaved }: { emp: Employee; registers: PosRegister[]; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail]     = useState(emp.email ?? '')
  const [password, setPassword] = useState('')
  const [pin, setPin]         = useState('')
  const [isOwner, setOwner]   = useState(!!emp.isOwner)
  const [granted, setGranted] = useState<Set<string>>(new Set(emp.permissions ?? []))
  const [posRegisterId, setPosReg] = useState(registers.find(r => r.assignedEmployeeId === emp.id)?.id ?? '')
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')
  const [ok, setOk]           = useState('')

  const toggle = (key: string) => setGranted(g => { const n = new Set(g); n.has(key) ? n.delete(key) : n.add(key); return n })
  const toggleSection = (keys: string[], on: boolean) => setGranted(g => { const n = new Set(g); keys.forEach(k => on ? n.add(k) : n.delete(k)); return n })
  const applyPreset = (keys: string[]) => setGranted(new Set(keys))

  const submit = async () => {
    setSaving(true); setErr(''); setOk('')
    try {
      await api.patch(`/employees/${emp.id}/credentials`, {
        isOwner,
        permissions: Array.from(granted),
        // Only send fields that were actually provided — never wipe email/password/counter by accident
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(password ? { password } : {}),
        ...(pin      ? { pin }      : {}),
        // Only touch the counter assignment when the registers list has loaded
        ...(registers.length > 0 ? { posRegisterId: posRegisterId || null } : {}),
      })
      setOk('Rights saved.'); onSaved()
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const ov: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
  const box: React.CSSProperties = { background: '#fff', borderRadius: 16, width: 720, maxWidth: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', fontFamily: FONT }
  const chk: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: DARK, cursor: 'pointer', padding: '3px 0' }

  return (
    <div style={ov} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>Rights & Access — {emp.name}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{emp.employeeNo} · choose exactly what this person can see and do</div>
        </div>

        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {err && <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{err}</div>}
          {ok  && <div style={{ background: '#F0FDF4', color: '#166534', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{ok}</div>}

          {/* Login */}
          <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>Login</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            <label>{lbl('Login Email')}<input style={inp} value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@company.ae" /></label>
            <label>{lbl('Password (blank = keep)')}<input type="password" style={inp} value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" /></label>
            <label>{lbl('PIN (quick POS login)')}<input type="password" maxLength={4} style={inp} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" /></label>
          </div>

          {/* POS counter assignment */}
          <div style={{ marginBottom: 16 }}>
            {lbl('POS Cash Counter')}
            <select style={{ ...inp, maxWidth: 340 }} value={posRegisterId} onChange={e => setPosReg(e.target.value)}>
              <option value="">— No counter —</option>
              {registers.map(r => {
                const takenByOther = r.assignedEmployeeId && r.assignedEmployeeId !== emp.id
                return <option key={r.id} value={r.id} disabled={!!takenByOther}>{r.name}{takenByOther ? ' (assigned to someone else)' : ''}</option>
              })}
            </select>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              Their POS password starts as the account password above; they can change it themselves. Each counter belongs to one operator.
            </div>
          </div>

          {/* Owner */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isOwner ? '#FEF3C7' : '#F8FAFC', border: `1px solid ${isOwner ? '#FDE047' : '#E2E8F0'}`, borderRadius: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={isOwner} onChange={e => setOwner(e.target.checked)} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>Owner / Full Access</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>Sees everything and can do all sensitive actions (edit confirmed orders, refunds, delete). Overrides the checkboxes below.</div>
            </div>
          </label>

          {!isOwner && (
            <>
              {/* Presets */}
              <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 6 }}>Quick start (then tweak)</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.entries(PRESETS).map(([name, keys]) => (
                  <button key={name} onClick={() => applyPreset(keys)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#fff', fontSize: 12, fontFamily: FONT, cursor: 'pointer', color: '#374151' }}>{name}</button>
                ))}
                <button onClick={() => setGranted(new Set())} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #FCA5A5', background: '#FEF2F2', fontSize: 12, fontFamily: FONT, cursor: 'pointer', color: '#DC2626' }}>Clear all</button>
              </div>

              {/* Page access */}
              <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>Pages this person can open</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 18 }}>
                {PAGE_RIGHTS.map(group => {
                  const keys = group.items.map(i => i.key)
                  const allOn = keys.every(k => granted.has(k))
                  return (
                    <div key={group.section}>
                      <label style={{ ...chk, fontWeight: 700, color: '#475569', borderBottom: '1px solid #F1F5F9', paddingBottom: 4, marginBottom: 4 }}>
                        <input type="checkbox" checked={allOn} onChange={e => toggleSection(keys, e.target.checked)} />
                        {group.section}
                      </label>
                      {group.items.map(it => (
                        <label key={it.key} style={chk}>
                          <input type="checkbox" checked={granted.has(it.key)} onChange={() => toggle(it.key)} />
                          {it.label}
                        </label>
                      ))}
                    </div>
                  )
                })}
              </div>

              {/* Feature toggles */}
              <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>Sensitive actions <span style={{ color: '#94A3B8', fontWeight: 400 }}>(off by default — fraud controls)</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 16px' }}>
                {FEATURE_RIGHTS.map(f => (
                  <label key={f.key} style={chk}>
                    <input type="checkbox" checked={granted.has(f.key)} onChange={() => toggle(f.key)} />
                    {f.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 24px', borderTop: '1px solid #F1F5F9' }}>
          <span style={{ marginRight: 'auto', fontSize: 12, color: '#94A3B8', alignSelf: 'center' }}>{isOwner ? 'Full access' : `${Array.from(granted).filter(k => !k.startsWith('feature.')).length} pages · ${Array.from(granted).filter(k => k.startsWith('feature.')).length} actions`}</span>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Close</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#fff', fontFamily: FONT, fontSize: 13, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Rights'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmployeesPage() {
  const [data, setData]               = useState<Employee[]>([])
  const [warehouses, setWarehouses]   = useState<Warehouse[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [registers, setRegisters] = useState<PosRegister[]>([])
  const [shifts, setShifts]           = useState<Shift[]>([])
  const [loading, setLoading]         = useState(true)
  const [q, setQ]                     = useState('')
  const [modal, setModal]             = useState<{ emp: Employee | null; isNew: boolean } | null>(null)
  const [accessModal, setAccessModal] = useState<Employee | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [emps, whs, depts, shfts, regs] = await Promise.all([
        api.get<{ data: Employee[] }>('/employees?pageSize=200'),
        api.get<{ data: Warehouse[] }>('/warehouses?pageSize=100&isActive=true'),
        api.get<{ data: Department[] }>('/departments?pageSize=200'),
        api.get<{ data: Shift[] }>('/shifts?pageSize=200'),
        api.get<{ data: PosRegister[] }>('/pos/registers?pageSize=200').catch(() => ({ data: [] as PosRegister[] })),
      ])
      setData(emps.data)
      setWarehouses(whs.data)
      setDepartments(depts.data)
      setShifts(shfts.data)
      setRegisters(regs.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.employeeNo.toLowerCase().includes(q.toLowerCase()) ||
    (r.jobTitle ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (r.email ?? '').toLowerCase().includes(q.toLowerCase())
  )

  const fmt = (v: any) => Number(v).toFixed(2)

  const rows = filtered.map(r => ({
    employeeNo: r.employeeNo,
    name:       r.name,
    jobTitle:   r.jobTitle ?? '—',
    location:   r.warehouse ? `${r.warehouse.name}${r.warehouse.city ? ` — ${r.warehouse.city}` : ''}` : '—',
    department: r.department?.name ?? '—',
    shift:      r.shift?.name ?? '—',
    contract:   CONTRACT_LABEL[r.contractType ?? ''] ?? r.contractType ?? '—',
    salary:     r.salary ? `AED ${fmt(r.salary)}` : '—',
    joinDate:   r.joinDate ? r.joinDate.slice(0, 10) : '—',
    status:     <Badge label={r.isActive ? 'Active' : 'Inactive'} color={r.isActive ? '#10B981' : '#EF4444'} />,
    role:       <Badge label={ROLE_LABEL[r.role] ?? r.role} color={ROLE_COLOR[r.role] ?? '#94A3B8'} />,
    actions:    <div style={{ display: 'flex', gap: 4 }}>
      <button onClick={e => { e.stopPropagation(); setModal({ emp: r, isNew: false }) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer' }}>Edit</button>
      <button onClick={e => { e.stopPropagation(); setAccessModal(r) }} style={{ padding: '4px 10px', fontSize: 12, fontFamily: FONT, borderRadius: 6, border: 'none', background: '#7C3AED', color: '#fff', cursor: 'pointer' }}>Access</button>
    </div>,
  }))

  const COLS = [
    { key: 'employeeNo', label: 'Emp #',            width: 100 },
    { key: 'name',       label: 'Name',             width: 160 },
    { key: 'jobTitle',   label: 'Job Title',        width: 140 },
    { key: 'location',   label: 'Warehouse/Branch', width: 160 },
    { key: 'department', label: 'Department',       width: 120 },
    { key: 'shift',      label: 'Shift',       width: 100 },
    { key: 'contract',   label: 'Contract',    width: 110 },
    { key: 'salary',     label: 'Salary',      width: 130 },
    { key: 'joinDate',   label: 'Joined',      width: 110 },
    { key: 'status',     label: 'Status',      width: 90  },
    { key: 'role',       label: 'Role',        width: 120 },
    { key: 'actions',    label: '',            width: 130 },
  ]

  const active   = data.filter(r => r.isActive).length
  const withSalary = data.filter(r => r.salary).length
  const totalPayroll = data.filter(r => r.salary).reduce((s, r) => s + Number(r.salary), 0)

  return (
    <AdminLayout
      title="Employees"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search name, ID, title…" />
          <Btn label="+ Add Employee" onClick={() => setModal({ emp: null, isNew: true })} />
        </div>
      }
    >
      <StatGrid>
        <StatCard label="Total Employees" value={String(data.length)}        sub="All records" />
        <StatCard label="Active"          value={String(active)}             sub="Currently employed"   color="#10B981" />
        <StatCard label="On Payroll"      value={String(withSalary)}         sub="With salary set"      color="#1D4ED8" />
        <StatCard label="Monthly Payroll" value={`AED ${totalPayroll.toLocaleString('en', { minimumFractionDigits: 0 })}`} sub="Total salaries" color="#F59E0B" />
      </StatGrid>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12, fontFamily: FONT }}>{filtered.length} employees</div>
          <Table columns={COLS} rows={rows} />
        </>
      )}

      {modal && (
        <Modal
          emp={modal.emp} isNew={modal.isNew}
          warehouses={warehouses} departments={departments} shifts={shifts}
          onClose={() => setModal(null)} onSaved={load}
        />
      )}
      {accessModal && (
        <AccessModal emp={accessModal} registers={registers} onClose={() => setAccessModal(null)} onSaved={load} />
      )}
    </AdminLayout>
  )
}
