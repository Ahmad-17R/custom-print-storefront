import { useEffect, useRef, useState } from 'react'
import { portal, API_ORIGIN, type CustomerOrder, type OrderMessage } from '../../lib/api'

// Order page extras for the customer portal: progress tracker, artwork proof approval
// and the message thread with our team.

const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 13 }
const btn = (bg: string, color = '#fff', border = bg): React.CSSProperties => ({ background: bg, color, border: `1px solid ${border}`, borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' })
const errText = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong'

const STAGES = [
  { key: 'placed', label: 'Placed' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'proof', label: 'Proof approved' },
  { key: 'in_production', label: 'In production' }, { key: 'ready', label: 'Ready' }, { key: 'out_for_delivery', label: 'Out for delivery' }, { key: 'delivered', label: 'Delivered' },
]
const RANK: Record<string, number> = { pending: 0, confirmed: 1, in_production: 3, ready: 4, out_for_delivery: 5, delivered: 6 }

export function OrderTracker({ order }: { order: CustomerOrder }) {
  if (['cancelled', 'refunded'].includes(order.status)) {
    return <section style={{ ...card, color: '#DC2626', fontWeight: 700 }}>This order was {order.status}.</section>
  }
  // The proof step only shows when we sent a proof for this order
  const stages = STAGES.filter(s => s.key !== 'proof' || order.proofStatus)
  const rank = RANK[order.status] ?? 0
  const done = (key: string) => key === 'placed' ? true : key === 'proof' ? order.proofStatus === 'approved' || rank >= 3 : rank >= (RANK[key] ?? 99)
  const current = stages.findIndex(s => !done(s.key))
  return (
    <section style={card}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>Order progress</h2>
      <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 4 }}>
        {stages.map((s, i) => {
          const ok = done(s.key)
          const now = i === current
          return (
            <div key={s.key} style={{ flex: 1, minWidth: 82, textAlign: 'center', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', top: 13, right: '50%', width: '100%', height: 3, background: ok ? '#10B981' : '#E2E8F0' }} />}
              <div style={{ position: 'relative', width: 28, height: 28, margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800,
                background: ok ? '#10B981' : now ? '#FEF3C7' : '#F1F5F9', color: ok ? '#fff' : now ? '#D97706' : '#94A3B8', border: now ? '2px solid #F59E0B' : 'none', boxSizing: 'border-box' }}>{ok ? '✓' : i + 1}</div>
              <div style={{ fontSize: 11, marginTop: 6, fontWeight: now ? 800 : 600, color: ok ? '#047857' : now ? '#B45309' : '#94A3B8' }}>{s.label}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ProofBox({ order, token, onChange }: { order: CustomerOrder; token: string; onChange: () => void }) {
  const [comment, setComment] = useState('')
  const [asking, setAsking] = useState(false)
  const [err, setErr] = useState('')
  if (!order.proofStatus || !order.proofFileUrl) return null
  const url = order.proofFileUrl.startsWith('http') ? order.proofFileUrl : `${API_ORIGIN}${order.proofFileUrl}`
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(order.proofFileName ?? order.proofFileUrl)
  const run = async (fn: () => Promise<unknown>) => { setErr(''); try { await fn(); setAsking(false); setComment(''); onChange() } catch (e) { setErr(errText(e)) } }
  const tone = order.proofStatus === 'approved' ? ['#ECFDF5', '#A7F3D0', '#047857', 'You approved this proof — it is going to print.']
    : order.proofStatus === 'changes_requested' ? ['#FFF7ED', '#FED7AA', '#C2410C', `You asked for changes: “${order.proofComment ?? ''}”. We will send a new proof.`]
    : ['#FFFBEB', '#FDE68A', '#B45309', 'Please check the proof of your artwork. We print only after you approve it.']
  return (
    <section style={{ ...card, background: tone[0], borderColor: tone[1] }}>
      <h2 style={{ fontSize: 16, marginTop: 0, color: tone[2] }}>Artwork proof</h2>
      <p style={{ margin: '0 0 12px', color: tone[2], fontSize: 14 }}>{tone[3]}</p>
      {isImage && <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Proof" style={{ maxWidth: '100%', maxHeight: 360, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }} /></a>}
      <div><a href={url} target="_blank" rel="noreferrer" style={{ color: '#1D4ED8', fontSize: 14 }}>📄 Open proof — {order.proofFileName}</a>{order.proofSentAt && <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>sent {new Date(order.proofSentAt).toLocaleString()}</span>}</div>
      {order.proofStatus === 'sent' && (asking
        ? <div style={{ marginTop: 12 }}>
            <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="What should we change? e.g. make the logo bigger, fix the phone number…" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', fontFamily: 'system-ui', fontSize: 14 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={btn('#EA580C')} onClick={() => run(() => portal.proofChanges(token, order.id, comment))}>Send change request</button>
              <button style={btn('#fff', '#334155', '#E2E8F0')} onClick={() => setAsking(false)}>Back</button>
            </div>
          </div>
        : <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button style={btn('#059669')} onClick={() => window.confirm('Approve this proof for printing?') && run(() => portal.approveProof(token, order.id))}>✓ Approve for printing</button>
            <button style={btn('#fff', '#C2410C', '#FED7AA')} onClick={() => setAsking(true)}>Request changes</button>
          </div>)}
      {err && <div style={{ color: '#B91C1C', fontSize: 13, marginTop: 8 }}>{err}</div>}
    </section>
  )
}

export function OrderMessages({ orderId, token }: { orderId: string; token: string }) {
  const [msgs, setMsgs] = useState<OrderMessage[]>([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const load = () => { portal.messages(token, orderId).then(setMsgs).catch(e => setErr(errText(e))) }
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t) }, [orderId, token])
  // Keep the newest message in view inside the box (without moving the page)
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [msgs.length])
  const send = async () => {
    if (!text.trim()) return
    setSending(true); setErr('')
    try { await portal.sendMessage(token, orderId, text.trim()); setText(''); load() } catch (e) { setErr(errText(e)) } finally { setSending(false) }
  }
  return (
    <section style={card}>
      <h2 style={{ fontSize: 16, marginTop: 0 }}>Messages about this order</h2>
      <div ref={box} style={{ maxHeight: 340, overflowY: 'auto', display: 'grid', gap: 8, marginBottom: 12 }}>
        {msgs.length === 0 && <div style={{ color: '#94A3B8', fontSize: 14 }}>Questions about artwork, delivery or anything else? Send us a message.</div>}
        {msgs.map(m => {
          const mine = m.sender === 'customer'
          return (
            <div key={m.id} style={{ justifySelf: mine ? 'end' : 'start', maxWidth: '80%', background: mine ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${mine ? '#BFDBFE' : '#E2E8F0'}`, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 3 }}><b>{mine ? m.authorName : `${m.authorName} (our team)`}</b> · {new Date(m.createdAt).toLocaleString()}</div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.body}</div>
              {m.fileUrl && <a href={m.fileUrl.startsWith('http') ? m.fileUrl : `${API_ORIGIN}${m.fileUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1D4ED8' }}>📎 {m.fileName ?? 'Attachment'}</a>}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <textarea rows={2} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Write a message…" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', fontFamily: 'system-ui', fontSize: 14, resize: 'vertical' }} />
        <button style={btn('#1D4ED8')} onClick={send} disabled={sending || !text.trim()}>{sending ? '…' : 'Send'}</button>
      </div>
      {err && <div style={{ color: '#B91C1C', fontSize: 13, marginTop: 8 }}>{err}</div>}
    </section>
  )
}
