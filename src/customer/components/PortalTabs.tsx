import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  portal, fetchCatalog, type PortalMember, type PortalOrderRequest, type PortalInvoice,
  type PortalStatement, type PortalQuote, type PortalWhoami, type MemberInput,
} from '../../lib/api'
import { printDocument, printStatement, openPrintWindow } from '../../admin/lib/printDoc'
import { DEFAULT_ISSUER } from '../../admin/lib/invoicePrint'

// My Account tabs for the customer portal: Team (authorised users + approvals),
// Invoices & Statement, and Quotes.

const BLUE = '#1D4ED8'
const money = (v: string | number) => `AED ${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const day = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString() : '—'
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'system-ui' }
const label: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748B', display: 'block', marginBottom: 4 }
const card: React.CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 22 }
const btn = (primary = true): React.CSSProperties => ({ padding: '9px 18px', borderRadius: 8, border: primary ? 'none' : '1px solid #E2E8F0', background: primary ? BLUE : '#fff', color: primary ? '#fff' : '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'system-ui' })
const small = (color = '#334155', bg = '#fff', border = '#E2E8F0'): React.CSSProperties => ({ padding: '5px 11px', borderRadius: 7, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer' })
const pill = (color: string, text: string) => <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', padding: '2px 9px', borderRadius: 999, textTransform: 'capitalize' }}>{text}</span>
const errText = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong'

// ── Team: authorised users with temporary logins ─────────────────────────────
export function TeamTab({ token, me }: { token: string; me: PortalWhoami }) {
  const [members, setMembers] = useState<PortalMember[]>([])
  const [requests, setRequests] = useState<PortalOrderRequest[]>([])
  const [editing, setEditing] = useState<PortalMember | 'new' | null>(null)
  const [msg, setMsg] = useState('')
  const isOwner = !me.member
  const load = () => {
    if (isOwner) portal.members(token).then(setMembers).catch(e => setMsg(errText(e)))
    portal.requests(token).then(setRequests).catch(() => {})
  }
  useEffect(load, [token])

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg('')
    try { await fn(); setMsg(ok); load() } catch (e) { setMsg(errText(e)) }
  }
  const pending = requests.filter(r => r.status === 'pending')

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>{isOwner ? 'Team & authorised users' : 'My order approvals'}</h1>
          <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 14 }}>{isOwner
            ? 'Give staff or colleagues their own temporary login to order on your account — with an expiry date, a spending limit and what they may see.'
            : `You are signed in as ${me.member!.name} on ${me.account?.name}'s account.`}</p>
        </div>
        {isOwner && <button style={btn()} onClick={() => setEditing('new')}>+ Add authorised user</button>}
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.includes('✓') ? '#ECFDF5' : '#FEF2F2', color: msg.includes('✓') ? '#059669' : '#B91C1C' }}>{msg}</div>}

      <div style={card}>
        <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>Orders waiting for approval {pending.length > 0 && pill('#D97706', String(pending.length))}</h2>
        {requests.length === 0 ? <div style={{ color: '#94A3B8', fontSize: 14 }}>No orders over a spending limit.</div>
          : requests.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{money(r.total)} · {r.payload.items.reduce((s, i) => s + i.quantity, 0)} item(s) {pill(r.status === 'pending' ? '#D97706' : r.status === 'approved' ? '#059669' : '#DC2626', r.status)}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>By {r.member.name} (limit {r.member.spendLimit ? money(r.member.spendLimit) : '—'}) · {new Date(r.createdAt).toLocaleString()}{r.note ? ` · ${r.note}` : ''}</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {r.orderId && <Link to={`/orders/${r.orderId}`} style={{ ...small(), textDecoration: 'none' }}>View order</Link>}
                {isOwner && r.status === 'pending' && <>
                  <button style={small('#fff', '#059669', '#059669')} onClick={() => act(() => portal.approve(token, r.id), 'Approved — the order was placed ✓')}>Approve & place order</button>
                  <button style={small('#DC2626', '#fff', '#FCA5A5')} onClick={() => { const n = window.prompt('Reason (optional)') ?? undefined; act(() => portal.reject(token, r.id, n), 'Request rejected ✓') }}>Reject</button>
                </>}
              </div>
            </div>
          ))}
      </div>

      {isOwner && <div style={card}>
        <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>Authorised users</h2>
        {members.length === 0 ? <div style={{ color: '#94A3B8', fontSize: 14 }}>No one else can use your account yet.</div>
          : members.map(m => {
            const expired = !!m.expiresAt && new Date(m.expiresAt) < new Date()
            const state = !m.isActive ? ['#DC2626', 'revoked'] : expired ? ['#94A3B8', 'expired'] : ['#059669', 'active']
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name} <span style={{ fontWeight: 400, color: '#64748B' }}>· {m.email}</span> {pill(state[0], state[1])}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                    {[m.canOrder ? 'Can order' : 'View only', m.spendLimit ? `limit ${money(m.spendLimit)}/order${m.approvalOverLimit ? ' (over → your approval)' : ''}` : 'no spending limit',
                      m.canViewOrders ? 'sees all orders' : 'sees own orders', m.canViewInvoices ? 'sees invoices' : null,
                      `expires ${m.expiresAt ? new Date(m.expiresAt).toLocaleString() : 'never'}`, m.lastLoginAt ? `last login ${new Date(m.lastLoginAt).toLocaleString()}` : 'never signed in'].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button style={small()} onClick={() => setEditing(m)}>Edit</button>
                  {m.isActive
                    ? <button style={small('#DC2626', '#fff', '#FCA5A5')} onClick={() => act(() => portal.updateMember(token, m.id, { isActive: false }), `${m.name}'s login revoked ✓`)}>Revoke</button>
                    : <button style={small('#059669', '#fff', '#A7F3D0')} onClick={() => act(() => portal.updateMember(token, m.id, { isActive: true }), `${m.name}'s login restored ✓`)}>Restore</button>}
                  <button style={small('#64748B')} onClick={() => window.confirm(`Delete ${m.name}'s login?`) && act(() => portal.removeMember(token, m.id), 'Login deleted ✓')}>Delete</button>
                </div>
              </div>
            )
          })}
      </div>}
      {editing && <MemberModal token={token} member={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={t => { setEditing(null); setMsg(t); load() }} />}
    </div>
  )
}

const inDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

function MemberModal({ token, member, onClose, onSaved }: { token: string; member: PortalMember | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [f, setF] = useState({
    name: member?.name ?? '', email: member?.email ?? '', password: '',
    expiresAt: member ? (member.expiresAt ? member.expiresAt.slice(0, 10) : '') : inDays(30),
    spendLimit: member?.spendLimit ? String(Number(member.spendLimit)) : '',
    canOrder: member?.canOrder ?? true, canViewOrders: member?.canViewOrders ?? false, canViewInvoices: member?.canViewInvoices ?? false,
    approvalOverLimit: member?.approvalOverLimit ?? true,
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f, v: string | boolean) => setF(p => ({ ...p, [k]: v }))
  const save = async () => {
    setBusy(true); setErr('')
    const body: MemberInput = {
      name: f.name, canOrder: f.canOrder, canViewOrders: f.canViewOrders, canViewInvoices: f.canViewInvoices, approvalOverLimit: f.approvalOverLimit,
      spendLimit: f.spendLimit ? Number(f.spendLimit) : null,
      // End of the chosen day
      expiresAt: f.expiresAt ? new Date(`${f.expiresAt}T23:59:59`).toISOString() : null,
      ...(f.password ? { password: f.password } : {}),
    }
    try {
      if (member) await portal.updateMember(token, member.id, body)
      else await portal.addMember(token, { ...body, email: f.email })
      onSaved(member ? 'Login updated ✓' : `Login created ✓ — ${f.email} can now sign in on the normal sign-in page`)
    } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const check = (k: 'canOrder' | 'canViewOrders' | 'canViewInvoices' | 'approvalOverLimit', text: string) => (
    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 8, cursor: 'pointer' }}><input type="checkbox" checked={f[k]} onChange={e => set(k, e.target.checked)} />{text}</label>
  )
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: 480, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>{member ? `Edit ${member.name}` : 'Add authorised user'}</h2>
        <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Name</span><input style={input} value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ali — Purchasing" /></label>
        <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>Login email</span><input style={{ ...input, ...(member ? { background: '#F8FAFC', color: '#94A3B8' } : {}) }} disabled={!!member} value={f.email} onChange={e => set('email', e.target.value)} /></label>
        <label style={{ display: 'block', marginBottom: 12 }}><span style={label}>{member ? 'New password (leave empty to keep)' : 'Temporary password'}</span><input style={input} type="text" value={f.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label><span style={label}>Expires on (empty = never)</span><input style={input} type="date" value={f.expiresAt} onChange={e => set('expiresAt', e.target.value)} /></label>
          <label><span style={label}>Spending limit per order (AED)</span><input style={input} type="number" min={0} value={f.spendLimit} onChange={e => set('spendLimit', e.target.value)} placeholder="No limit" /></label>
        </div>
        {check('canOrder', 'Can place orders')}
        {f.spendLimit && check('approvalOverLimit', 'Orders over the limit come to me for approval (otherwise they are refused)')}
        {check('canViewOrders', 'Can see all orders of the account (otherwise only the ones they placed)')}
        {check('canViewInvoices', 'Can see invoices, statement and balance')}
        {err && <div style={{ color: '#B91C1C', fontSize: 13, margin: '8px 0' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button style={btn(false)} onClick={onClose}>Cancel</button>
          <button style={btn()} onClick={save} disabled={busy}>{busy ? 'Saving…' : member ? 'Save' : 'Create login'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Invoices & statement ─────────────────────────────────────────────────────
function printInvoice(inv: PortalInvoice) {
  const o = inv.order
  const c = o.customer
  printDocument({
    heading: inv.type === 'credit_note' ? 'TAX CREDIT NOTE' : 'TAX INVOICE',
    number: inv.invoiceNumber,
    meta: [['Order', o.orderNumber], ['Payment', o.paymentStatus.replace(/_/g, ' ')]],
    date: inv.issueDate.slice(0, 10),
    issuer: { name: DEFAULT_ISSUER },
    party: { label: 'Bill to', name: c?.companyName || c?.fullName || o.contactName || c?.email || '—', trn: c?.trn, phone: o.contactPhone ?? c?.phone, email: c?.email,
      address: [o.deliveryLine1, o.deliveryLine2, o.deliveryCity, o.deliveryEmirate].filter(Boolean).join(', ') },
    lines: o.items.map(i => ({ description: [i.productName, ...i.fieldValues.map(f => `${f.fieldLabel}: ${f.displayValue}`)].join(' — '), quantity: i.quantity, unitPrice: Number(i.unitPrice), total: Number(i.total) })),
    subtotal: Number(inv.subtotal), vat: Number(inv.vatAmount), total: Number(inv.total),
    paid: inv.type === 'invoice' ? Number(o.amountPaid ?? 0) : null,
    notes: inv.notes,
    stamp: inv.type === 'invoice' && o.paymentStatus === 'paid' ? 'PAID' : null,
  })
}

export function BillingTab({ token }: { token: string }) {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([])
  const [st, setSt] = useState<PortalStatement | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { portal.invoices(token).then(setInvoices).catch(e => setErr(errText(e))) }, [token])
  useEffect(() => { portal.statement(token, from, to).then(setSt).catch(e => setErr(errText(e))) }, [token, from, to])

  const print = async (id: string) => {
    try { printInvoice(await portal.invoice(token, id)) } catch (e) { alert(errText(e)) }
  }
  const printSt = () => {
    if (!st) return
    const w = openPrintWindow()
    const c = st.customer
    printStatement({
      title: 'STATEMENT OF ACCOUNT', issuer: { name: DEFAULT_ISSUER },
      party: { name: c?.companyName || c?.fullName || c?.email || '—', trn: c?.trn, phone: c?.phone, email: c?.email },
      from: from || (st.rows[0]?.date.slice(0, 10) ?? '—'), to: to || new Date().toISOString().slice(0, 10),
      balanceMeaning: 'Positive balance = amount you owe us; negative = credit in your favour',
      opening: st.opening, closing: st.closing,
      totals: { charges: st.totals.debit, credits: st.totals.credit, vat: 0 },
      lines: st.rows.map(r => ({ date: r.date.slice(0, 10), type: r.type.replace('_', ' '), reference: r.ref, description: r.description, charge: r.debit, credit: r.credit, vat: 0, balance: r.balance })),
      chargeLabel: 'Invoiced', creditLabel: 'Paid / credited',
    }, w)
  }

  if (err) return <div style={{ ...card, color: '#B91C1C' }}>{err}</div>
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Invoices & statement</h1>
      <div style={card}>
        <h2 style={{ fontSize: 16, margin: '0 0 12px' }}>Tax invoices</h2>
        {invoices.length === 0 ? <div style={{ color: '#94A3B8', fontSize: 14 }}>No invoices yet — an invoice is issued when an order is confirmed.</div>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ color: '#64748B', textAlign: 'left' }}><th style={{ padding: 6 }}>Number</th><th>Date</th><th>Order</th><th>Payment</th><th style={{ textAlign: 'right' }}>Amount</th><th /></tr></thead>
              <tbody>{invoices.map(i => (
                <tr key={i.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 8, fontWeight: 700 }}>{i.invoiceNumber} {i.type === 'credit_note' && pill('#DC2626', 'credit note')}</td>
                  <td>{day(i.issueDate)}</td>
                  <td><Link to={`/orders/${i.order.id}`} style={{ color: BLUE }}>{i.order.orderNumber}</Link></td>
                  <td style={{ textTransform: 'capitalize' }}>{i.type === 'invoice' ? i.order.paymentStatus.replace('_', ' ') : '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{i.type === 'credit_note' ? '−' : ''}{money(i.total)}</td>
                  <td style={{ textAlign: 'right' }}><button style={small()} onClick={() => print(i.id)}>Print / PDF</button></td>
                </tr>
              ))}</tbody>
            </table>}
      </div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Statement of account</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
            <label><span style={label}>From</span><input type="date" style={{ ...input, width: 150 }} value={from} onChange={e => setFrom(e.target.value)} /></label>
            <label><span style={label}>To</span><input type="date" style={{ ...input, width: 150 }} value={to} onChange={e => setTo(e.target.value)} /></label>
            <button style={btn(false)} onClick={printSt} disabled={!st}>Print / PDF</button>
          </div>
        </div>
        {!st ? <div style={{ color: '#94A3B8' }}>Loading…</div> : <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ color: '#64748B', textAlign: 'left' }}><th style={{ padding: 6 }}>Date</th><th>Reference</th><th>Description</th><th style={{ textAlign: 'right' }}>Invoiced</th><th style={{ textAlign: 'right' }}>Paid / credited</th><th style={{ textAlign: 'right' }}>Balance</th></tr></thead>
            <tbody>
              <tr style={{ borderTop: '1px solid #F1F5F9', color: '#64748B' }}><td style={{ padding: 8 }} colSpan={5}>Opening balance</td><td style={{ textAlign: 'right' }}>{money(st.opening)}</td></tr>
              {st.rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 8 }}>{day(r.date)}</td><td>{r.ref}</td><td>{r.description}</td>
                  <td style={{ textAlign: 'right' }}>{r.debit ? money(r.debit) : ''}</td>
                  <td style={{ textAlign: 'right', color: '#059669' }}>{r.credit ? money(r.credit) : ''}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{money(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 12, fontSize: 14 }}>
            <span>Invoiced <b>{money(st.totals.debit)}</b></span><span>Paid <b style={{ color: '#059669' }}>{money(st.totals.credit)}</b></span>
            <span>{st.closing >= 0 ? 'You owe' : 'Your credit'} <b style={{ color: st.closing > 0 ? '#DC2626' : '#059669' }}>{money(Math.abs(st.closing))}</b></span>
          </div>
        </>}
      </div>
    </div>
  )
}

// ── Quotes ───────────────────────────────────────────────────────────────────
const QUOTE_COLOR: Record<string, string> = { requested: '#D97706', draft: '#D97706', sent: BLUE, accepted: '#059669', rejected: '#DC2626', expired: '#94A3B8' }

export function QuotesTab({ token }: { token: string }) {
  const [quotes, setQuotes] = useState<PortalQuote[]>([])
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const load = () => { portal.quotes(token).then(setQuotes).catch(e => setMsg(errText(e))) }
  useEffect(load, [token])
  const act = async (fn: () => Promise<unknown>, ok: string) => { setMsg(''); try { await fn(); setMsg(ok); load() } catch (e) { setMsg(errText(e)) } }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div><h1 style={{ fontSize: 24, margin: 0 }}>Quotes</h1><p style={{ color: '#64748B', margin: '4px 0 0', fontSize: 14 }}>Need a bulk or custom job? Request a quote — we price it and you accept it here.</p></div>
        <button style={btn()} onClick={() => setOpen(true)}>+ Request a quote</button>
      </div>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: msg.includes('✓') ? '#ECFDF5' : '#FEF2F2', color: msg.includes('✓') ? '#059669' : '#B91C1C' }}>{msg}</div>}
      {quotes.length === 0 ? <div style={{ ...card, textAlign: 'center', color: '#64748B', padding: 40 }}>No quotes yet.</div>
        : quotes.map(q => {
          const priced = q.status !== 'requested' && q.status !== 'draft'
          return (
            <div key={q.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div><strong>{q.quoteNumber ?? 'Quote'}</strong> {pill(QUOTE_COLOR[q.status] ?? '#64748B', q.status === 'sent' ? 'ready — awaiting your answer' : q.status)}
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Requested {day(q.createdAt)}{q.validUntil && priced ? ` · valid until ${day(q.validUntil)}` : ''}</div></div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{priced ? money(q.total) : <span style={{ fontSize: 13, color: '#D97706', fontWeight: 600 }}>Being priced…</span>}</div>
              </div>
              {q.requestNote && <div style={{ fontSize: 13, color: '#475569', marginTop: 10 }}>“{q.requestNote}”</div>}
              {q.items.length > 0 && <div style={{ marginTop: 10 }}>{q.items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderTop: '1px solid #F1F5F9' }}>
                  <span>{i.productName} × {i.quantity}{i.description ? ` — ${i.description}` : ''}</span>{priced && <span>{money(i.total)}</span>}
                </div>))}</div>}
              {priced && <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Net {money(q.subtotal)} · VAT {money(q.vatAmount)}</div>}
              {q.notes && priced && <div style={{ fontSize: 12, color: '#64748B', marginTop: 6, whiteSpace: 'pre-wrap' }}>{q.notes}</div>}
              {q.status === 'sent' && <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={btn()} onClick={() => act(() => portal.acceptQuote(token, q.id), 'Quote accepted ✓ — we will start your order and contact you')}>Accept quote</button>
                <button style={btn(false)} onClick={() => { const r = window.prompt('Why are you rejecting it? (optional)'); if (r !== null) act(() => portal.rejectQuote(token, q.id, r), 'Quote rejected ✓') }}>Reject</button>
              </div>}
            </div>
          )
        })}
      {open && <QuoteRequestModal token={token} onClose={() => setOpen(false)} onSent={() => { setOpen(false); setMsg('Quote requested ✓ — we will price it shortly'); load() }} />}
    </div>
  )
}

function QuoteRequestModal({ token, onClose, onSent }: { token: string; onClose: () => void; onSent: () => void }) {
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<{ productId: string; quantity: string; description: string }[]>([{ productId: '', quantity: '100', description: '' }])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { fetchCatalog().then(r => setProducts(r.map(p => ({ id: p.id, name: p.name })))).catch(() => {}) }, [])
  const patch = (i: number, k: 'productId' | 'quantity' | 'description', v: string) => setLines(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l))
  const send = async () => {
    setBusy(true); setErr('')
    try {
      await portal.requestQuote(token, { note, items: lines.filter(l => l.productId).map(l => ({ productId: l.productId, quantity: Number(l.quantity), description: l.description })) })
      onSent()
    } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div style={{ ...card, width: 560, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Request a quote</h2>
        <label style={{ display: 'block', marginBottom: 14 }}><span style={label}>What do you need?</span><textarea rows={3} style={{ ...input, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 2,000 A5 flyers, both sides, 300gsm, delivery to Dubai by the 20th" /></label>
        <span style={label}>Products (optional)</span>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 90px 2fr 30px', gap: 6, marginBottom: 6 }}>
            <select style={input} value={l.productId} onChange={e => patch(i, 'productId', e.target.value)}><option value="">Choose product…</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <input style={input} type="number" min={1} value={l.quantity} onChange={e => patch(i, 'quantity', e.target.value)} />
            <input style={input} value={l.description} onChange={e => patch(i, 'description', e.target.value)} placeholder="Size, material, finish…" />
            <button style={{ ...small('#DC2626'), padding: 0 }} onClick={() => setLines(ls => ls.length > 1 ? ls.filter((_, j) => j !== i) : ls)}>×</button>
          </div>
        ))}
        <button style={{ ...small(BLUE), marginTop: 4 }} onClick={() => setLines(ls => [...ls, { productId: '', quantity: '100', description: '' }])}>+ Add product</button>
        {err && <div style={{ color: '#B91C1C', fontSize: 13, marginTop: 10 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button style={btn(false)} onClick={onClose}>Cancel</button>
          <button style={btn()} onClick={send} disabled={busy}>{busy ? 'Sending…' : 'Send request'}</button>
        </div>
      </div>
    </div>
  )
}
