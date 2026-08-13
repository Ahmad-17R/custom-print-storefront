import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Employee {
  id: string; name: string; employeeNo: string; jobTitle: string
  department: string; shift: string; joinDate: string
  salary: number; active: boolean
}

const SEED: Employee[] = [
  { id: 'EMP-001', name: 'Ahmed Al Mansouri',  employeeNo: 'MPW-001', jobTitle: 'Production Manager',   department: 'Operations',  shift: 'Morning', joinDate: '2022-03-15', salary: 12000, active: true  },
  { id: 'EMP-002', name: 'Sara Khalid',        employeeNo: 'MPW-002', jobTitle: 'Sales Executive',      department: 'Sales',       shift: 'Morning', joinDate: '2023-01-10', salary: 8500,  active: true  },
  { id: 'EMP-003', name: 'Mohammed Rashid',    employeeNo: 'MPW-003', jobTitle: 'Graphic Designer',     department: 'Design',      shift: 'Morning', joinDate: '2021-07-20', salary: 9000,  active: true  },
  { id: 'EMP-004', name: 'Priya Nair',         employeeNo: 'MPW-004', jobTitle: 'Finance Officer',      department: 'Finance',     shift: 'Morning', joinDate: '2022-11-05', salary: 10000, active: true  },
  { id: 'EMP-005', name: 'Liu Wei',            employeeNo: 'MPW-005', jobTitle: 'Warehouse Supervisor', department: 'Operations',  shift: 'Evening', joinDate: '2023-04-01', salary: 7500,  active: true  },
  { id: 'EMP-006', name: 'Raj Patel',          employeeNo: 'MPW-006', jobTitle: 'IT Manager',           department: 'IT',          shift: 'Morning', joinDate: '2022-06-12', salary: 11000, active: true  },
  { id: 'EMP-007', name: 'Fatima Al Zaabi',    employeeNo: 'MPW-007', jobTitle: 'HR Coordinator',       department: 'HR',          shift: 'Morning', joinDate: '2024-01-15', salary: 8000,  active: true  },
  { id: 'EMP-008', name: 'Hassan Qureshi',     employeeNo: 'MPW-008', jobTitle: 'Press Operator',       department: 'Operations',  shift: 'Evening', joinDate: '2020-09-01', salary: 6500,  active: false },
  { id: 'EMP-009', name: 'Elena Popescu',      employeeNo: 'MPW-009', jobTitle: 'Customer Support',     department: 'Sales',       shift: 'Morning', joinDate: '2024-03-10', salary: 7000,  active: true  },
  { id: 'EMP-010', name: 'Mehmet Yilmaz',      employeeNo: 'MPW-010', jobTitle: 'Procurement Officer',  department: 'Procurement', shift: 'Morning', joinDate: '2023-08-20', salary: 9500,  active: true  },
]

const DEPTS = ['All', ...Array.from(new Set(SEED.map(e => e.department)))]
const COLS = [
  { key: 'employeeNo', label: 'Emp #',      width: 100 },
  { key: 'name',       label: 'Name' },
  { key: 'jobTitle',   label: 'Job Title' },
  { key: 'department', label: 'Department', width: 130 },
  { key: 'shift',      label: 'Shift',      width: 90 },
  { key: 'joinDate',   label: 'Joined',     width: 110 },
  { key: 'salary',     label: 'Salary',     width: 110 },
  { key: 'active',     label: 'Status',     width: 100 },
  { key: 'actions',    label: '',           width: 80 },
]

function Modal({ emp, onClose, onSave }: { emp: Partial<Employee> | null; onClose: () => void; onSave: (e: Partial<Employee>) => void }) {
  const [form, setForm] = useState<Partial<Employee>>(emp ?? { name: '', jobTitle: '', department: 'Operations', shift: 'Morning', joinDate: '', salary: 0, active: true })
  if (!emp) return null
  const f = <K extends keyof Employee>(k: K, v: Employee[K]) => setForm(p => ({ ...p, [k]: v }))
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 500, fontFamily: FONT, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: DARK }}>{form.id ? 'Edit Employee' : 'New Employee'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {([['name','Full Name'],['jobTitle','Job Title']] as [keyof Employee, string][]).map(([k, label]) => (
            <label key={k as string} style={{ display: 'block', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>{label} *</span>
              <input value={(form[k] as string) ?? ''} onChange={e => f(k, e.target.value as Employee[typeof k])}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
            </label>
          ))}
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Department</span>
            <select value={form.department ?? ''} onChange={e => f('department', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['Operations','Sales','Design','Finance','IT','HR','Procurement'].map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Shift</span>
            <select value={form.shift ?? 'Morning'} onChange={e => f('shift', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, outline: 'none' }}>
              {['Morning','Evening','Night'].map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Join Date</span>
            <input type="date" value={form.joinDate ?? ''} onChange={e => f('joinDate', e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
          <label style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }}>Basic Salary (AED)</span>
            <input type="number" value={form.salary ?? 0} onChange={e => f('salary', Number(e.target.value))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }} />
          </label>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active ?? true} onChange={e => f('active', e.target.checked)} />
          <span style={{ fontSize: 13 }}>Active</span>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Btn label="Cancel" variant="secondary" onClick={onClose} />
          <Btn label="Save Employee" onClick={() => { onSave(form); onClose() }} />
        </div>
      </div>
    </div>
  )
}

export function EmployeesPage() {
  const [data, setData]   = useState<Employee[]>(SEED)
  const [q, setQ]         = useState('')
  const [dept, setDept]   = useState('All')
  const [modal, setModal] = useState<Partial<Employee> | null>(null)

  const filtered = data.filter(e =>
    (dept === 'All' || e.department === dept) &&
    (e.name.toLowerCase().includes(q.toLowerCase()) || e.jobTitle.toLowerCase().includes(q.toLowerCase()))
  )

  const save = (form: Partial<Employee>) => {
    const n = data.length + 1
    if (form.id) setData(d => d.map(e => e.id === form.id ? { ...e, ...form } as Employee : e))
    else setData(d => [...d, { id: `EMP-${String(n).padStart(3,'0')}`, employeeNo: `MPW-${String(n).padStart(3,'0')}`, ...form } as Employee])
  }

  const totalPayroll = data.filter(e => e.active).reduce((s,e) => s + e.salary, 0)

  const rows = filtered.map(e => ({
    ...e,
    salary: `AED ${e.salary.toLocaleString()}`,
    active: <Badge label={e.active ? 'Active' : 'Inactive'} color={e.active ? '#10B981' : '#64748B'} />,
    actions: <button onClick={() => setModal(e)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Edit</button>,
  }))

  return (
    <AdminLayout title="Employees"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search employees…" /><Btn label="+ New Employee" onClick={() => setModal({})} /></div>}>
      <StatGrid>
        <StatCard label="Total Staff"      value={String(data.length)}                  sub="All employees" />
        <StatCard label="Active"           value={String(data.filter(e=>e.active).length)} sub="Currently employed" color="#10B981" />
        <StatCard label="Monthly Payroll"  value={`AED ${totalPayroll.toLocaleString()}`} sub="Gross salaries"    color="#1D4ED8" />
        <StatCard label="Departments"      value={String(DEPTS.length - 1)}             sub="Teams" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {DEPTS.map(d => (
          <button key={d} onClick={() => setDept(d)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: dept===d ? DARK : '#fff', color: dept===d ? '#fff' : '#64748B' }}>{d}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} employees</div>
      <Table columns={COLS} rows={rows} />
      {modal !== null && <Modal emp={modal} onClose={() => setModal(null)} onSave={save} />}
    </AdminLayout>
  )
}
