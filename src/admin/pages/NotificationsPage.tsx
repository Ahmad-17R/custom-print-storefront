import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout, Btn, StatCard, StatGrid } from '../components/AdminLayout'
import { api } from '../../lib/api'

const FONT = "'Poppins', system-ui, sans-serif"
const DARK = '#0F172A'

interface Alert { id: string; title: string; body: string; type: 'info' | 'warning' | 'success' | 'error'; isRead: boolean; link: string | null; createdAt: string }
const COLOR: Record<Alert['type'], string> = { info: '#3B82F6', warning: '#F59E0B', success: '#10B981', error: '#EF4444' }
const LABEL: Record<Alert['type'], string> = { info: 'Info', warning: 'Warning', success: 'Done', error: 'Urgent' }

// Admin alerts: new online orders, requisitions awaiting approval, overdue POs and walk-in
// orders, low stock, deposits received, paid orders cancelled, goods returned, quotes accepted.
export function NotificationsPage() {
  const navigate = useNavigate()
  const [data, setData]       = useState<Alert[]>([])
  const [unread, setUnread]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread' | Alert['type']>('all')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get<{ data: Alert[]; unreadCount: number }>('/alerts?pageSize=200')
      setData(r.data); setUnread(r.unreadCount)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const markRead = async (a: Alert) => { if (!a.isRead) { await api.post(`/alerts/${a.id}/read`, {}); load() } }
  const remove   = async (a: Alert) => { await api.delete(`/alerts/${a.id}`).catch(() => {}); load() }
  const readAll  = async () => { await api.post('/alerts/read-all', {}); load() }

  const shown = data.filter(a => filter === 'all' || (filter === 'unread' ? !a.isRead : a.type === filter))

  return (
    <AdminLayout title="Alerts & Notifications" actions={unread > 0 ? <Btn label="Mark all read" variant="secondary" onClick={readAll} /> : <></>}>
      <StatGrid>
        <StatCard label="Unread"   value={String(unread)}                                        sub="Need attention" color="#EF4444" />
        <StatCard label="Urgent"   value={String(data.filter(a => a.type === 'error').length)}   sub="Out of stock etc." color="#EF4444" />
        <StatCard label="Warnings" value={String(data.filter(a => a.type === 'warning').length)} sub="Overdue / cancelled / low stock" color="#F59E0B" />
        <StatCard label="Total"    value={String(data.length)}                                   sub="Latest 200" />
      </StatGrid>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'unread', 'error', 'warning', 'info', 'success'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: FONT, fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: filter === f ? DARK : '#fff', color: filter === f ? '#fff' : '#64748B' }}>
            {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unread})` : LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>Loading…</div>
        : shown.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8', fontFamily: FONT }}>No alerts here.</div>
        : (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', fontFamily: FONT }}>
            {shown.map(a => (
              <div key={a.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: a.isRead ? '#fff' : '#F8FAFF', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLOR[a.type], background: COLOR[a.type] + '18', padding: '2px 8px', borderRadius: 999, flexShrink: 0, marginTop: 2 }}>{LABEL[a.type]}</span>
                <div style={{ flex: 1, minWidth: 0, cursor: a.link ? 'pointer' : 'default' }} onClick={() => { markRead(a); if (a.link) navigate(a.link) }}>
                  <div style={{ fontSize: 14, fontWeight: a.isRead ? 500 : 700, color: DARK }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{a.body}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!a.isRead && <button onClick={() => markRead(a)} style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #E2E8F0', borderRadius: 6, background: '#fff', cursor: 'pointer', fontFamily: FONT }}>Mark read</button>}
                  <button onClick={() => remove(a)} title="Dismiss" style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #FECACA', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontFamily: FONT }}>Dismiss</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </AdminLayout>
  )
}
