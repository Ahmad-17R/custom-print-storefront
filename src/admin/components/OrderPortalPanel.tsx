import { useEffect, useRef, useState } from 'react'
import { api, catalogImageUrl, getToken, API_ORIGIN } from '../../lib/api'

// Online order drawer: send an artwork proof for the customer to approve in their portal,
// see their answer, and message the customer about the order.

const DARK = '#0F172A'
interface Msg { id: string; sender: 'customer' | 'staff'; authorName: string; body: string; fileUrl: string | null; fileName: string | null; createdAt: string }
export interface ProofInfo { id: string; proofStatus?: string | null; proofFileUrl?: string | null; proofFileName?: string | null; proofComment?: string | null; proofSentAt?: string | null; proofApprovedAt?: string | null; placedByName?: string | null }

const PROOF: Record<string, [string, string]> = {
  sent: ['#D97706', 'Waiting for customer approval'],
  approved: ['#059669', 'Approved by customer — OK to print'],
  changes_requested: ['#EA580C', 'Customer asked for changes'],
}

export function OrderPortalPanel({ order, onChanged }: { order: ProofInfo; onChanged: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const load = () => { api.get<Msg[]>(`/orders/${order.id}/messages`).then(setMsgs).catch(() => {}) }
  useEffect(load, [order.id, order.proofStatus])

  const sendProof = async (file: File) => {
    setBusy(true); setErr('')
    try {
      const form = new FormData()
      form.append('file', file); form.append('note', note)
      const token = getToken()
      const res = await fetch(`${API_ORIGIN}/api/v1/orders/${order.id}/proof`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Upload failed')
      setNote(''); onChanged(); load()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') } finally { setBusy(false) }
  }
  const send = async () => {
    if (!text.trim()) return
    try { await api.post(`/orders/${order.id}/messages`, { body: text.trim() }); setText(''); load() } catch (e) { setErr(e instanceof Error ? e.message : 'Failed') }
  }
  const st = order.proofStatus ? PROOF[order.proofStatus] : null

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9', fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {order.placedByName && <div style={{ fontSize: 12, color: '#7C3AED', marginBottom: 8 }}>Placed by authorised user: <b>{order.placedByName}</b></div>}
      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 8 }}>Artwork proof (customer approval)</div>
      {st && <div style={{ fontSize: 12, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, color: st[0], background: st[0] + '18', padding: '2px 9px', borderRadius: 999 }}>{st[1]}</span>
        {order.proofFileUrl && <a href={catalogImageUrl(order.proofFileUrl)} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: '#1D4ED8' }}>{order.proofFileName}</a>}
        {order.proofStatus === 'changes_requested' && order.proofComment && <div style={{ marginTop: 6, color: '#9A3412', background: '#FFF7ED', padding: '6px 10px', borderRadius: 6 }}>“{order.proofComment}”</div>}
      </div>}
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note to customer (optional)" style={{ flex: 1, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12 }} />
        <button disabled={busy} onClick={() => fileRef.current?.click()} style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: DARK, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{busy ? 'Sending…' : order.proofStatus ? 'Send new proof' : 'Send proof'}</button>
        <input ref={fileRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e => { const f = e.target.files?.[0]; if (f) sendProof(f); e.target.value = '' }} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: DARK, margin: '16px 0 8px' }}>Messages with customer</div>
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 6, marginBottom: 8 }}>
        {msgs.length === 0 && <div style={{ fontSize: 12, color: '#94A3B8' }}>No messages yet.</div>}
        {msgs.map(m => (
          <div key={m.id} style={{ justifySelf: m.sender === 'staff' ? 'end' : 'start', maxWidth: '85%', background: m.sender === 'staff' ? '#F1F5F9' : '#EFF6FF', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}>
            <div style={{ color: '#64748B', fontSize: 11 }}><b>{m.authorName}</b>{m.sender === 'customer' ? ' (customer)' : ''} · {new Date(m.createdAt).toLocaleString()}</div>
            <div style={{ whiteSpace: 'pre-wrap', color: DARK }}>{m.body}</div>
            {m.fileUrl && <a href={catalogImageUrl(m.fileUrl)} target="_blank" rel="noreferrer" style={{ color: '#1D4ED8' }}>📎 {m.fileName}</a>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Reply to the customer…" style={{ flex: 1, padding: '7px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12 }} />
        <button onClick={send} style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Send</button>
      </div>
      {err && <div style={{ color: '#DC2626', fontSize: 12, marginTop: 6 }}>{err}</div>}
    </div>
  )
}
