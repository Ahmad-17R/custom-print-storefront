import { AdminLayout } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"

export function ScheduledReportsPage() {
  return (
    <AdminLayout title="Scheduled Reports" actions={<></>}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, fontFamily: FONT }}>
          <div style={{ marginBottom: 16, color: "#991B1B" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#991B1B', marginBottom: 8 }}>Temporarily Unavailable</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            This module has been made unavailable by <strong>Ahmad</strong> — Scheduled Reports require an email server and cron scheduler that will be configured in a later phase when the system goes live.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
