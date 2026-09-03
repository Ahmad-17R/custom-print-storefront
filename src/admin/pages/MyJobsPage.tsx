import { useEffect, useState, useCallback } from 'react'
import { AdminLayout, Badge, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'
import { useAuth } from '../lib/AuthContext'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'
const fmt = (n: number) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })

interface JobMat { id: string; name: string; materialId?: string | null; quantity: number; totalCost: number }
interface MyJob {
  id: string; source: 'walkin' | 'online'; orderRef: string; orderStatus: string
  warehouseId?: string | null; customer: string; productName?: string | null; stepName: string; status: string
  materials: JobMat[]
}
interface Material { id: string; name: string; unit: string }

const JOB_LABEL: Record<string, string> = { pending: 'To Do', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' }
const JOB_COLOR: Record<string, string> = { pending: '#94A3B8', in_progress: '#3B82F6', done: '#10B981', cancelled: '#EF4444' }
const FLOW: Record<string, { next: string; label: string; color: string } | null> = {
  pending:     { next: 'in_progress', label: 'Start', color: '#3B82F6' },
  in_progress: { next: 'done',        label: 'Mark Done', color: '#10B981' },
  done:        null,
}
const inp: React.CSSProperties = { padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none' }

// ── One job card with its materials ───────────────────────────────────────────
function JobCard({ job, materials, onChanged }: { job: MyJob; materials: Material[]; onChanged: () => void }) {
  const [open, setOpen]     = useState(false)
  const [stock, setStock]   = useState<Record<string, number>>({})
  const [busy, setBusy]     = useState(false)
  const [err, setErr]       = useState('')
  const [mId, setMId]       = useState(''); const [mName, setMName] = useState(''); const [mQty, setMQty] = useState('1')
  const [advBusy, setAdvBusy] = useState(false)
  const step = FLOW[job.status]

  const loadStock = useCallback(() => {
    if (!job.warehouseId) { setStock({}); return }
    api.get<{ data: Record<string, number> }>(`/production/warehouse-stock?warehouseId=${job.warehouseId}`).then(r => setStock(r.data))
  }, [job.warehouseId])
  useEffect(() => { if (open) loadStock() }, [open, loadStock])

  const advance = async (next: string) => {
    setAdvBusy(true)
    try { await api.patch(`/production/my-jobs/${job.id}`, { source: job.source, status: next }); onChanged() }
    catch (e: any) { alert(e?.message ?? 'Could not update') } finally { setAdvBusy(false) }
  }
  const addMat = async () => {
    if (!mName.trim()) return
    setBusy(true); setErr('')
    try {
      await api.post(`/production/my-jobs/${job.id}/materials`, { source: job.source, name: mName.trim(), materialId: mId || undefined, quantity: parseFloat(mQty) || 1 })
      setMId(''); setMName(''); setMQty('1'); onChanged(); loadStock()
    } catch (e: any) { setErr(e?.message ?? 'Could not add') } finally { setBusy(false) }
  }
  const delMat = async (id: string) => {
    await api.delete(`/production/my-jobs/${job.id}/materials/${id}?source=${job.source}`); onChanged(); loadStock()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>
            <span style={{ color: '#94A3B8', marginRight: 6 }}>{open ? '▾' : '▸'}</span>
            {job.productName ? `${job.productName} → ` : ''}{job.stepName}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: '#64748B', marginTop: 2, paddingLeft: 18 }}>
            {job.orderRef} · {job.customer}
            <span style={{ marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 999, background: '#F1F5F9', color: '#64748B' }}>{job.source === 'online' ? 'Online' : 'Walk-in'}</span>
            {job.materials.length > 0 && <span style={{ marginLeft: 6, fontSize: 11, color: '#7C3AED' }}>· {job.materials.length} material{job.materials.length === 1 ? '' : 's'}</span>}
          </div>
        </div>
        <Badge label={JOB_LABEL[job.status] ?? job.status} color={JOB_COLOR[job.status] ?? '#64748B'} />
        {step ? (
          <button onClick={() => advance(step.next)} disabled={advBusy} style={{ background: step.color, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>
            {advBusy ? '…' : step.label}
          </button>
        ) : <span style={{ fontFamily: FONT, fontSize: 13, color: '#10B981', fontWeight: 700 }}>✓ Done</span>}
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 18px', background: '#F8FAFC' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 8 }}>Materials used {job.warehouseId ? '' : '(no warehouse set on this order yet)'}</div>
          {job.materials.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fff', borderRadius: 8, marginBottom: 6, fontSize: 12 }}>
              <span style={{ flex: 1, fontWeight: 600, color: DARK }}>{m.name}{m.materialId ? '' : ' (custom)'} × {m.quantity}</span>
              {Number(m.totalCost) > 0 && <span style={{ color: '#7C3AED', fontWeight: 600 }}>AED {fmt(m.totalCost)}</span>}
              <button onClick={() => delMat(m.id)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 15 }}>×</button>
            </div>
          ))}
          {err && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 6 }}>{err}</div>}
          {job.warehouseId && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 8, marginTop: 8, alignItems: 'end' }}>
              <label>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>Material (from your warehouse)</span>
                <select value={mId} onChange={e => { setMId(e.target.value); const mm = materials.find(x => x.id === e.target.value); if (mm) setMName(mm.name) }} style={{ ...inp, width: '100%' }}>
                  <option value="">— custom name —</option>
                  {materials.map(m => { const a = stock[m.id] ?? 0; return <option key={m.id} value={m.id} disabled={a <= 0}>{m.name} ({m.unit}) — {a} in stock{a <= 0 ? ' (out)' : ''}</option> })}
                </select>
              </label>
              <label>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>Qty</span>
                <input type="number" min={0.01} step="0.01" value={mQty} onChange={e => setMQty(e.target.value)} style={{ ...inp, width: '100%' }} />
              </label>
              <button onClick={addMat} disabled={busy} style={{ background: DARK, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>{busy ? '…' : 'Add'}</button>
            </div>
          )}
          {!mId && job.warehouseId && <input value={mName} onChange={e => setMName(e.target.value)} placeholder="…or type a custom material name" style={{ ...inp, width: '100%', marginTop: 8 }} />}
        </div>
      )}
    </div>
  )
}

export function MyJobsPage() {
  const { user } = useAuth()
  const [jobs, setJobs]     = useState<MyJob[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoad]  = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const load = useCallback(async () => {
    setLoad(true)
    try { const r = await api.get<{ data: MyJob[] }>('/production/my-jobs'); setJobs(r.data) }
    finally { setLoad(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { api.get<{ data: Material[] }>('/materials?pageSize=500').then(r => setMaterials(r.data)) }, [])

  const shown = jobs.filter(j => filter === 'all' || j.status !== 'done')
  const todo  = jobs.filter(j => j.status === 'pending').length
  const doing = jobs.filter(j => j.status === 'in_progress').length
  const done  = jobs.filter(j => j.status === 'done').length

  return (
    <AdminLayout title="My Jobs" actions={
      <div style={{ display: 'flex', gap: 6 }}>
        {(['active', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: filter === f ? DARK : '#F1F5F9', color: filter === f ? '#fff' : '#64748B' }}>{f === 'active' ? 'Active' : 'All'}</button>
        ))}
      </div>
    }>
      <div style={{ fontFamily: FONT, fontSize: 14, color: '#64748B', marginBottom: 16 }}>
        Jobs assigned to you, {user?.name?.split(' ')[0] ?? 'there'}. Update the status and log any materials you use — they come out of the order's warehouse.
      </div>
      <StatGrid>
        <StatCard label="To Do"       value={String(todo)}  sub="Waiting to start" color="#94A3B8" />
        <StatCard label="In Progress" value={String(doing)} sub="You're working on" color="#3B82F6" />
        <StatCard label="Done"        value={String(done)}  sub="Completed" color="#10B981" />
        <StatCard label="Total"       value={String(jobs.length)} sub="Assigned to you" />
      </StatGrid>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
      ) : shown.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT, border: '2px dashed #E2E8F0', borderRadius: 12 }}>
          {jobs.length === 0 ? 'No jobs assigned to you yet.' : 'No active jobs — all done! 🎉'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shown.map(j => <JobCard key={j.id} job={j} materials={materials} onChanged={load} />)}
        </div>
      )}
    </AdminLayout>
  )
}
