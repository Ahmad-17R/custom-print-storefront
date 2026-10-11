// Printable UAE tax invoice / quotation / account statement. Opens a clean page in a new
// window and calls print(); the user can print it or "Save as PDF" from the print dialog.
// Layout follows the standard UAE tax-invoice template: company header, customer details
// block, invoice # / date / customer ID / due date / VAT registration grid, and a line
// table with taxable amount, VAT rate, VAT amount and amount incl. VAT per line.

export interface PrintLine { description: string; quantity: number; unitPrice: number; total: number }
export interface PrintDoc {
  heading: string                       // "TAX INVOICE" / "QUOTATION"
  number: string
  meta: [string, string][]              // extra info, e.g. [['Reference', 'WS-2610-1234'], ['Valid until', …]]
  date?: string | null
  dueDate?: string | null
  customerId?: string | null
  issuer: { name: string; trn?: string | null; address?: string | null; extra?: string | null }
  party: { label: string; name: string; trn?: string | null; phone?: string | null; email?: string | null; address?: string | null }
  lines: PrintLine[]
  subtotal: number
  vat: number
  vatRateLabel?: string
  total: number
  paid?: number | null
  notes?: string | null
  footer?: string | null
  stamp?: string | null                 // e.g. "CANCELLED" / "PAID"
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
const money = (n: number) => Number(n).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const round2 = (n: number) => Math.round(n * 100) / 100

// "One Thousand Fifty Dirhams and Twenty Five Fils Only"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
function words(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + words(n % 100) : ''}`
  for (const [v, w] of [[1e9, 'Billion'], [1e6, 'Million'], [1e3, 'Thousand']] as [number, string][]) {
    if (n >= v) return `${words(Math.floor(n / v))} ${w}${n % v ? ' ' + words(n % v) : ''}`
  }
  return ''
}
export function amountInWords(amount: number) {
  const dirhams = Math.floor(Math.abs(amount)), fils = Math.round((Math.abs(amount) - dirhams) * 100)
  return `${dirhams ? words(dirhams) : 'Zero'} Dirham${dirhams === 1 ? '' : 's'}${fils ? ` and ${words(fils)} Fils` : ''} Only`
}

const STYLE = `
  *{box-sizing:border-box}
  body{font-family:Poppins,'Segoe UI',system-ui,sans-serif;color:#0F172A;margin:24px;font-size:12px}
  .sheet{border:2px solid #1E2A5A}
  table{width:100%;border-collapse:collapse}
  td,th{border:1px solid #1E2A5A;padding:6px 8px;vertical-align:middle}
  .hd{background:#253A72;color:#fff;font-weight:700;font-size:12px}
  .c{text-align:center}.r{text-align:right}
  .brand{display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#fff;background:linear-gradient(135deg,#253A72,#3B82F6);width:72px;height:72px;border-radius:12px;margin:auto}
  .co{font-size:22px;font-weight:800;color:#5B21B6;letter-spacing:.3px}
  .coline{font-size:11px;font-weight:600}
  .title{font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:.5px}
  .lbl{background:#253A72;color:#fff;font-weight:700;width:130px;white-space:nowrap}
  .lines td{border-top:none;border-bottom:1px solid #CBD5E1}
  .lines tr.blank td{height:26px}
  .tot td{font-size:12px}.tot .g td{font-size:14px;font-weight:800;background:#EEF2FF}
  .words{font-style:italic;font-weight:600}
  .muted{color:#64748B}
  .stamp{position:fixed;top:42%;left:26%;transform:rotate(-20deg);font-size:72px;font-weight:800;color:rgba(239,68,68,.16);border:6px solid rgba(239,68,68,.16);padding:4px 24px;pointer-events:none}
  .sign{display:flex;justify-content:space-between;margin-top:42px;font-size:11px}
  .sign div{border-top:1px solid #0F172A;width:200px;text-align:center;padding-top:4px}
  @media print{body{margin:10mm}}
`

function initials(name: string) {
  return esc(name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'A')
}

function header(issuer: PrintDoc['issuer'], title: string) {
  const line = [issuer.address, issuer.extra].filter(Boolean).join(' · ')
  return `<table>
    <tr><td rowspan="3" style="width:120px"><div class="brand">${initials(issuer.name)}</div></td>
        <td class="c co">${esc(issuer.name)}</td></tr>
    <tr><td class="c coline">${esc(line || ' ')}${issuer.trn ? `${line ? ' · ' : ''}TRN ${esc(issuer.trn)}` : ''}</td></tr>
    <tr><td class="c title">${esc(title)}</td></tr>
  </table>`
}

// Pass a window opened synchronously in the click handler when the data is fetched first
// (browsers block pop-ups opened after an await).
export const openPrintWindow = () => window.open('', '_blank', 'width=960,height=1000')

function write(w: Window, title: string, body: string) {
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${STYLE}</style></head><body>${body}
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`)
  w.document.close()
}

export function printDocument(d: PrintDoc, win?: Window | null) {
  const w = win ?? openPrintWindow()
  if (!w) { alert('Allow pop-ups for this site to print.'); return }

  // Per-line VAT: share the document VAT across lines by value. Lines are VAT-inclusive
  // when they add up to the total, otherwise VAT was added on top of them.
  const linesSum = round2(d.lines.reduce((s, l) => s + l.total, 0))
  const inclusive = Math.abs(linesSum - d.total) < 0.02
  const ratePct = d.subtotal > 0 && d.vat > 0 ? Math.round((d.vat / d.subtotal) * 100) : 0
  let vatLeft = d.vat
  const rows = d.lines.map((l, i) => {
    const lineVat = i === d.lines.length - 1 ? round2(vatLeft) : round2(linesSum ? d.vat * l.total / linesSum : 0)
    vatLeft -= lineVat
    const taxable = inclusive ? round2(l.total - lineVat) : l.total
    const gross = inclusive ? l.total : round2(l.total + lineVat)
    return `<tr><td>${esc(l.description)}</td><td class="c">${esc(l.quantity)}</td><td class="r">${money(l.unitPrice)}</td>
      <td class="r">${money(taxable)}</td><td class="c">${ratePct}%</td><td class="r">${money(lineVat)}</td><td class="r"><b>${money(gross)}</b></td></tr>`
  }).join('')
  const blanks = Array.from({ length: Math.max(0, 6 - d.lines.length) }, () => '<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')
  const balance = d.paid != null ? round2(d.total - d.paid) : null
  const metaRows = d.meta.map(([k, v]) => `<tr><td class="lbl">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')

  write(w, `${d.heading} ${d.number}`, `
${d.stamp ? `<div class="stamp">${esc(d.stamp)}</div>` : ''}
<div class="sheet">
  ${header(d.issuer, d.heading)}
  <table>
    <tr><td class="hd" colspan="2">${esc(d.party.label === 'Bill to' ? 'Customer Details' : d.party.label)}</td>
        <td class="hd c" style="width:150px">${d.heading.includes('QUOTATION') ? 'Quotation #' : 'Invoice #'}</td><td class="hd c" style="width:150px">Date</td></tr>
    <tr><td class="lbl">Name</td><td class="c">${esc(d.party.name)}</td><td class="c"><b>${esc(d.number)}</b></td><td class="c">${esc(d.date ?? '')}</td></tr>
    <tr><td class="lbl">Address</td><td class="c">${esc(d.party.address ?? '—')}</td><td class="hd c">Customer ID</td><td class="hd c">${d.heading.includes('QUOTATION') ? 'Valid Until' : 'Due Date'}</td></tr>
    <tr><td class="lbl">Phone</td><td class="c">${esc(d.party.phone ?? '—')}</td><td class="c">${esc(d.customerId ?? '—')}</td><td class="c">${esc(d.dueDate ?? '—')}</td></tr>
    <tr><td class="lbl">Email</td><td class="c">${esc(d.party.email ?? '—')}</td><td class="hd c" colspan="2">Supplier VAT Registration # (TRN)</td></tr>
    <tr><td class="lbl">Customer TRN</td><td class="c">${esc(d.party.trn ?? '—')}</td><td class="c" colspan="2"><b>${esc(d.issuer.trn ?? '—')}</b></td></tr>
  </table>
  ${metaRows ? `<table>${metaRows}</table>` : ''}
  <table class="lines">
    <tr><td class="hd">Description</td><td class="hd c" style="width:70px">Quantity</td><td class="hd r" style="width:100px">Unit Price</td>
        <td class="hd r" style="width:110px">Taxable Amount</td><td class="hd c" style="width:60px">VAT %</td><td class="hd r" style="width:90px">VAT</td><td class="hd r" style="width:120px">Amount (AED)</td></tr>
    ${rows}${blanks}
  </table>
  <table>
    <tr>
      <td style="vertical-align:top;border-right:none">
        <div class="muted" style="font-size:11px">Amount in words</div>
        <div class="words">${esc(amountInWords(d.total))}</div>
        ${d.notes ? `<div style="margin-top:10px;white-space:pre-wrap"><b>Notes</b><br>${esc(d.notes)}</div>` : ''}
        <div class="muted" style="margin-top:10px;font-size:11px">${d.vat > 0 ? (inclusive ? 'Unit prices include VAT.' : 'VAT is added to the unit prices shown.') : 'No VAT charged on this document.'}</div>
      </td>
      <td style="width:330px;padding:0;border-left:none">
        <table class="tot">
          <tr><td>Total taxable amount (excl. VAT)</td><td class="r">AED ${money(d.subtotal)}</td></tr>
          <tr><td>VAT${d.vatRateLabel ? ` @ ${esc(d.vatRateLabel)}` : ''}</td><td class="r">AED ${money(d.vat)}</td></tr>
          <tr class="g"><td>Total amount due</td><td class="r">AED ${money(d.total)}</td></tr>
          ${d.paid != null ? `<tr><td>Paid</td><td class="r">AED ${money(d.paid)}</td></tr><tr><td><b>Balance due</b></td><td class="r"><b>AED ${money(Math.max(0, balance!))}</b></td></tr>` : ''}
        </table>
      </td>
    </tr>
  </table>
</div>
<div class="sign"><div>Prepared by</div><div>Received by (customer)</div></div>
${d.footer ? `<div class="muted c" style="margin-top:18px;font-size:11px">${esc(d.footer)}</div>` : ''}`)
}

// ── Account statement (supplier / customer) ──
export interface StatementPrint {
  title: string                          // "SUPPLIER STATEMENT" / "CUSTOMER STATEMENT"
  issuer: PrintDoc['issuer']
  party: { name: string; trn?: string | null; corporateTaxNo?: string | null; phone?: string | null; email?: string | null }
  from: string; to: string
  balanceMeaning: string
  opening: number; closing: number
  totals: { charges: number; credits: number; vat: number }
  lines: { date: string; type: string; reference: string; description: string; charge: number; credit: number; vat: number; balance: number }[]
  chargeLabel: string; creditLabel: string
}

export function printStatement(s: StatementPrint, win?: Window | null) {
  const w = win ?? openPrintWindow()
  if (!w) { alert('Allow pop-ups for this site to print.'); return }
  const rows = s.lines.map(l => `<tr><td>${esc(l.date)}</td><td>${esc(l.type)}</td><td>${esc(l.reference)}</td><td>${esc(l.description)}</td>
    <td class="r">${l.charge ? money(l.charge) : ''}</td><td class="r">${l.credit ? money(l.credit) : ''}</td><td class="r">${l.vat ? money(l.vat) : ''}</td><td class="r"><b>${money(l.balance)}</b></td></tr>`).join('')
  write(w, `${s.title} ${s.party.name}`, `
<div class="sheet">
  ${header(s.issuer, s.title)}
  <table>
    <tr><td class="lbl">Account</td><td><b>${esc(s.party.name)}</b></td><td class="lbl">Period</td><td>${esc(s.from)} → ${esc(s.to)}</td></tr>
    <tr><td class="lbl">TRN</td><td>${esc(s.party.trn ?? '—')}</td><td class="lbl">Corporate Tax No.</td><td>${esc(s.party.corporateTaxNo ?? '—')}</td></tr>
    <tr><td class="lbl">Phone</td><td>${esc(s.party.phone ?? '—')}</td><td class="lbl">Email</td><td>${esc(s.party.email ?? '—')}</td></tr>
  </table>
  <table class="lines">
    <tr><td class="hd" style="width:85px">Date</td><td class="hd" style="width:80px">Type</td><td class="hd" style="width:130px">Reference</td><td class="hd">Details</td>
        <td class="hd r" style="width:95px">${esc(s.chargeLabel)}</td><td class="hd r" style="width:95px">${esc(s.creditLabel)}</td><td class="hd r" style="width:75px">VAT</td><td class="hd r" style="width:100px">Balance</td></tr>
    <tr><td colspan="7"><b>Opening balance</b></td><td class="r"><b>${money(s.opening)}</b></td></tr>
    ${rows || '<tr><td colspan="8" class="c muted">No transactions in this period</td></tr>'}
    <tr style="background:#EEF2FF"><td colspan="4"><b>Totals for the period</b></td><td class="r"><b>${money(s.totals.charges)}</b></td><td class="r"><b>${money(s.totals.credits)}</b></td><td class="r"><b>${money(s.totals.vat)}</b></td><td class="r"><b>${money(s.closing)}</b></td></tr>
  </table>
  <table><tr><td class="muted">Closing balance = ${esc(s.balanceMeaning.toLowerCase())}. VAT column = VAT included in each document (for the VAT return).</td><td class="r" style="width:260px;font-size:14px"><b>Closing balance AED ${money(s.closing)}</b></td></tr></table>
</div>`)
}
