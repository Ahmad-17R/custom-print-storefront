import { useState } from 'react'
import { AdminLayout, Table, Btn, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type InvStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled'

interface Invoice {
  id: string; soId: string; customer: string
  total: number; paid: number; due: number
  status: InvStatus; issueDate: string; dueDate: string
}

const statusColor: Record<InvStatus, string> = {
  Draft:           '#64748B',
  Sent:            '#1D4ED8',
  Paid:            '#10B981',
  'Partially Paid':'#8B5CF6',
  Overdue:         '#EF4444',
  Cancelled:       '#94A3B8',
}

const SEED: Invoice[] = [
  { id: 'INV-0031', soId: 'SO-0021', customer: 'Al Noor Trading LLC', total: 840,  paid: 840,  due: 0,   status: 'Paid',           issueDate: '2026-08-08', dueDate: '2026-08-22' },
  { id: 'INV-0030', soId: 'SO-0018', customer: 'TechHub DXB',         total: 4987, paid: 2000, due: 2987,status: 'Partially Paid', issueDate: '2026-08-01', dueDate: '2026-08-15' },
  { id: 'INV-0029', soId: 'SO-0016', customer: 'Desert Rose Café',    total: 577,  paid: 577,  due: 0,   status: 'Paid',           issueDate: '2026-07-28', dueDate: '2026-08-11' },
  { id: 'INV-0028', soId: 'SO-0019', customer: 'Gulf Ventures',       total: 1260, paid: 0,    due: 1260,status: 'Overdue',        issueDate: '2026-07-20', dueDate: '2026-08-03' },
  { id: 'INV-0027', soId: 'SO-0020', customer: 'Apex Events',         total: 8820, paid: 0,    due: 8820,status: 'Sent',           issueDate: '2026-08-03', dueDate: '2026-08-17' },
  { id: 'INV-0026', soId: 'SO-0017', customer: 'Pearl Hospitality',   total: 9450, paid: 4725, due: 4725,status: 'Partially Paid', issueDate: '2026-07-30', dueDate: '2026-08-13' },
]

const STATUSES: InvStatus[] = ['Draft','Sent','Paid','Partially Paid','Overdue','Cancelled']
const COLS = [
  { key: 'id',        label: 'Invoice #',    width: 110 },
  { key: 'soId',      label: 'Sales Order',  width: 110 },
  { key: 'customer',  label: 'Customer' },
  { key: 'total',     label: 'Total',        width: 110 },
  { key: 'paid',      label: 'Paid',         width: 100 },
  { key: 'due',       label: 'Balance Due',  width: 110 },
  { key: 'status',    label: 'Status',       width: 140 },
  { key: 'issueDate', label: 'Issued',       width: 100 },
  { key: 'dueDate',   label: 'Due Date',     width: 100 },
  { key: 'actions',   label: '',             width: 80 },
]

export function SalesInvoicesPage() {
  const [data]          = useState<Invoice[]>(SEED)
  const [q, setQ]       = useState('')
  const [status, setStatus] = useState<InvStatus | 'All'>('All')

  const filtered = data.filter(r =>
    (status === 'All' || r.status === status) &&
    (r.id.toLowerCase().includes(q.toLowerCase()) || r.customer.toLowerCase().includes(q.toLowerCase()))
  )

  const totalDue    = data.reduce((s,r) => s + r.due,  0)
  const totalPaid   = data.reduce((s,r) => s + r.paid, 0)
  const overdue     = data.filter(r => r.status === 'Overdue').length

  const rows = filtered.map(r => ({
    ...r,
    total:  `AED ${r.total.toLocaleString()}`,
    paid:   <span style={{ color: '#10B981', fontWeight: 600 }}>AED {r.paid.toLocaleString()}</span>,
    due:    r.due > 0 ? <span style={{ color: '#EF4444', fontWeight: 600 }}>AED {r.due.toLocaleString()}</span> : <span style={{ color: '#94A3B8' }}>—</span>,
    status: <Badge label={r.status} color={statusColor[r.status]} />,
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>PDF</button>
      </div>
    ),
  }))

  return (
    <AdminLayout title="Sales Invoices"
      actions={<div style={{ display: 'flex', gap: 8 }}><SearchInput value={q} onChange={setQ} placeholder="Search invoices…" /><Btn label="+ New Invoice" onClick={() => {}} /></div>}>
      <StatGrid>
        <StatCard label="Total Invoiced" value={`AED ${data.reduce((s,r)=>s+r.total,0).toLocaleString()}`} sub="All invoices" color="#1D4ED8" />
        <StatCard label="Total Collected" value={`AED ${totalPaid.toLocaleString()}`} sub="Payments received" color="#10B981" />
        <StatCard label="Outstanding"    value={`AED ${totalDue.toLocaleString()}`}  sub="Awaiting payment" color="#F59E0B" />
        <StatCard label="Overdue"        value={String(overdue)} sub="Past due date" color="#EF4444" />
      </StatGrid>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['All',...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: status===s ? DARK : '#fff', color: status===s ? '#fff' : '#64748B' }}>{s}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>{filtered.length} invoices</div>
      <Table columns={COLS} rows={rows} />
    </AdminLayout>
  )
}
