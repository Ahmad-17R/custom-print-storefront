import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type RunStatus = 'Draft' | 'Processing' | 'Approved' | 'Paid'

interface PayrollRun {
  id: string; period: string; employees: number
  gross: number; deductions: number; net: number
  status: RunStatus; processedAt: string
}

const statusColor: Record<RunStatus, string> = {
  Draft:      '#64748B',
  Processing: '#F59E0B',
  Approved:   '#8B5CF6',
  Paid:       '#10B981',
}

const SEED: PayrollRun[] = [
  { id: 'PR-2026-07', period: 'July 2026',  employees: 10, gross: 99500,  deductions: 9950, net: 89550, status: 'Paid',       processedAt: '2026-07-28' },
  { id: 'PR-2026-06', period: 'June 2026',  employees: 10, gross: 99500,  deductions: 9950, net: 89550, status: 'Paid',       processedAt: '2026-06-28' },
  { id: 'PR-2026-08', period: 'August 2026',employees: 10, gross: 99500,  deductions: 9950, net: 89550, status: 'Draft',      processedAt: '' },
]

const RUN_COLS = [
  { key: 'id',          label: 'Run ID',     width: 120 },
  { key: 'period',      label: 'Period' },
  { key: 'employees',   label: 'Employees',  width: 100 },
  { key: 'gross',       label: 'Gross',      width: 120 },
  { key: 'deductions',  label: 'Deductions', width: 120 },
  { key: 'net',         label: 'Net Pay',    width: 120 },
  { key: 'status',      label: 'Status',     width: 120 },
  { key: 'processedAt', label: 'Processed',  width: 110 },
  { key: 'actions',     label: '',           width: 120 },
]

interface Payslip {
  id: string; runId: string; employee: string; employeeNo: string
  basic: number; allowances: number; deductions: number; net: number
}

const PAYSLIPS: Payslip[] = [
  { id: 'PS-001', runId: 'PR-2026-07', employee: 'Ahmed Al Mansouri', employeeNo: 'MPW-001', basic: 12000, allowances: 2000, deductions: 1400, net: 12600 },
  { id: 'PS-002', runId: 'PR-2026-07', employee: 'Sara Khalid',       employeeNo: 'MPW-002', basic: 8500,  allowances: 1500, deductions: 1000, net: 9000  },
  { id: 'PS-003', runId: 'PR-2026-07', employee: 'Mohammed Rashid',   employeeNo: 'MPW-003', basic: 9000,  allowances: 1500, deductions: 1050, net: 9450  },
  { id: 'PS-004', runId: 'PR-2026-07', employee: 'Priya Nair',        employeeNo: 'MPW-004', basic: 10000, allowances: 1800, deductions: 1180, net: 10620 },
  { id: 'PS-005', runId: 'PR-2026-07', employee: 'Liu Wei',           employeeNo: 'MPW-005', basic: 7500,  allowances: 1200, deductions: 870, net: 7830   },
]

const SLIP_COLS = [
  { key: 'employeeNo', label: 'Emp #',      width: 100 },
  { key: 'employee',   label: 'Employee' },
  { key: 'basic',      label: 'Basic',      width: 110 },
  { key: 'allowances', label: 'Allowances', width: 110 },
  { key: 'deductions', label: 'Deductions', width: 110 },
  { key: 'net',        label: 'Net Pay',    width: 120 },
  { key: 'actions',    label: '',           width: 80  },
]

export function PayrollPage() {
  const [runs]             = useState<PayrollRun[]>(SEED)
  const [q, setQ]          = useState('')
  const [selectedRun, setSelectedRun] = useState<string | null>(null)

  const slips = PAYSLIPS.filter(p => p.runId === selectedRun)
    .filter(p => p.employee.toLowerCase().includes(q.toLowerCase()))

  const runRows = runs.map(r => ({
    ...r,
    gross:      `AED ${r.gross.toLocaleString()}`,
    deductions: `AED ${r.deductions.toLocaleString()}`,
    net:        <strong>AED {r.net.toLocaleString()}</strong>,
    processedAt: r.processedAt || '—',
    status:     <Badge label={r.status} color={statusColor[r.status]} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setSelectedRun(r.id)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: selectedRun===r.id ? DARK : '#fff', color: selectedRun===r.id ? '#fff' : '#0F172A', cursor: 'pointer', fontFamily: FONT }}>View</button>
        {r.status === 'Draft' && <button style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #8B5CF6', borderRadius: 6, background: '#EDE9FE', color: '#7C3AED', cursor: 'pointer', fontFamily: FONT }}>Process</button>}
      </div>
    ),
  }))

  const slipRows = slips.map(p => ({
    ...p,
    basic:      `AED ${p.basic.toLocaleString()}`,
    allowances: `AED ${p.allowances.toLocaleString()}`,
    deductions: `AED ${p.deductions.toLocaleString()}`,
    net:        <strong style={{ color: '#1D4ED8' }}>AED {p.net.toLocaleString()}</strong>,
    actions:    <button style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>PDF</button>,
  }))

  const latestPaid = runs.find(r => r.status === 'Paid')

  return (
    <AdminLayout title="Payroll"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search employees…" /><Btn label="+ New Run" onClick={() => {}} /></div>}>
      <StatGrid>
        <StatCard label="Monthly Gross"    value={`AED ${latestPaid?.gross.toLocaleString() ?? '0'}`} sub="Last payroll run"    color="#1D4ED8" />
        <StatCard label="Net Paid"         value={`AED ${latestPaid?.net.toLocaleString() ?? '0'}`}   sub="After deductions"  color="#10B981" />
        <StatCard label="Total Deductions" value={`AED ${latestPaid?.deductions.toLocaleString() ?? '0'}`} sub="Tax & social" color="#F59E0B" />
        <StatCard label="Employees Paid"   value={String(latestPaid?.employees ?? 0)}                 sub="On last run" />
      </StatGrid>

      <h3 style={{ fontSize: 14, fontWeight: 600, color: DARK, margin: '0 0 12px', fontFamily: FONT }}>Payroll Runs</h3>
      <Table columns={RUN_COLS} rows={runRows} />

      {selectedRun && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: DARK, margin: 0, fontFamily: FONT }}>Payslips — {selectedRun}</h3>
            <button onClick={() => setSelectedRun(null)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Close</button>
          </div>
          {slipRows.length > 0
            ? <Table columns={SLIP_COLS} rows={slipRows} />
            : <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontFamily: FONT }}>No payslips for this run yet.</div>
          }
        </div>
      )}
    </AdminLayout>
  )
}
