import { AdminLayout } from '../components/AdminLayout'

const FONT = "'Poppins', system-ui, sans-serif"

export function NotificationsPage() {
  return (
    <AdminLayout title="Notifications" actions={<></>}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', maxWidth: 420, fontFamily: FONT }}>
          <div style={{ marginBottom: 16, color: "#991B1B" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#991B1B', marginBottom: 8 }}>Temporarily Unavailable</div>
          <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
            This module has been made unavailable by <strong>Ahmad</strong> — Notifications will be built out in a later phase alongside the employee and customer dashboards.
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
