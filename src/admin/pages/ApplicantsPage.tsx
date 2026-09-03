import { useEffect, useState } from 'react'
import { AdminLayout, Table, SearchInput, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

type AppStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
interface Applicant { id: string; name: string; email: string; phone: string | null; position: string; status: AppStatus; appliedAt: string; createdAt: string }

const STATUS_LABEL: Record<AppStatus, string> = { new: 'New', screening: 'Screening', interview: 'Interview', offer: 'Offer', hired: 'Hired', rejected: 'Rejected' }
const STATUS_COLOR: Record<AppStatus, string> = { new: '#64748B', screening: '#8B5CF6', interview: '#F59E0B', offer: '#1D4ED8', hired: '#10B981', rejected: '#EF4444' }
const STATUSES: AppStatus[] = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected']
const COLS = [
  { key: 'name', label: 'Name', width: 180 }, { key: 'email', label: 'Email', width: 220 },
  { key: 'position', label: 'Position' }, { key: 'status', label: 'Status', width: 120 },
  { key: 'appliedAt', label: 'Applied', width: 110 },
]

export function ApplicantsPage() {
  const [data, setData] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [statusFilter, setFilter] = useState<AppStatus | 'all'>('all')

  const load = async () => { setLoading(true); try { const r = await api.get<{ data: Applicant[] }>('/applicants?pageSize=200'); setData(r.data) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])

  const filtered = data.filter(r => (statusFilter === 'all' || r.status === statusFilter) && (r.name.toLowerCase().includes(q.toLowerCase()) || r.email.toLowerCase().includes(q.toLowerCase()) || r.position.toLowerCase().includes(q.toLowerCase())))
  const rows = filtered.map(r => ({
    name: r.name, email: r.email, position: r.position,
    status: <Badge label={STATUS_LABEL[r.status]} color={STATUS_COLOR[r.status]} />,
    appliedAt: r.appliedAt.slice(0, 10),
  }))

  return (
    <AdminLayout title="Applicants" actions={<></>}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, fontFamily: FONT }}>
          <div style={{ marginBottom: 16, color: "#991B1B" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#991B1B', marginBottom: 8 }}>Temporarily Unavailable</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            This module has been made unavailable by <strong>Ahmad</strong> — the Applicants &amp; Recruitment pipeline is not yet connected to the system and will be built out in a later phase.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
