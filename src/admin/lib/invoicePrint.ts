import { api } from '../../lib/api'
import { openPrintWindow, printDocument, type PrintLine } from './printDoc'

export interface SalesInvoice {
  id: string; invoiceNumber: string; source: 'online' | 'walk_in' | 'pos' | 'sales_order'; customerId?: string | null
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
  issueDate: string; dueDate: string | null
  subtotal: string; vatAmount: string; total: string; paidAmount: string
  issuerName: string | null; issuerTrn: string | null; issuerAddress: string | null
  customerName: string | null; customerPhone: string | null; customerEmail: string | null
  customerTrn: string | null; customerAddress: string | null
  lines: PrintLine[] | null; notes: string | null; issuedBy: string | null; createdAt: string
  order?: { id: string; orderNumber: string; status: string } | null
  walkInSale?: { id: string; saleNumber: string; status: string } | null
  posOrder?: { id: string; orderNumber: string; status: string } | null
  salesOrder?: { orderNumber: string; customer: { fullName: string | null; email: string }; items?: { description: string | null; quantity: number; unitPrice: string; total: string }[] } | null
}

// Legal name invoices are issued under unless changed in Company Settings
export const DEFAULT_ISSUER = 'AL Waqar'

export const SOURCE_LABEL: Record<SalesInvoice['source'], string> = { online: 'Online', walk_in: 'Walk-in', pos: 'POS', sales_order: 'Sales Order' }

export const sourceRef = (inv: SalesInvoice) =>
  inv.order?.orderNumber ?? inv.walkInSale?.saleNumber ?? inv.posOrder?.orderNumber ?? inv.salesOrder?.orderNumber ?? '—'

export function printInvoice(inv: SalesInvoice, win?: Window | null) {
  const lines: PrintLine[] = inv.lines ?? (inv.salesOrder?.items ?? []).map(i => ({ description: i.description ?? 'Item', quantity: i.quantity, unitPrice: Number(i.unitPrice), total: Number(i.total) }))
  const total = Number(inv.total), vat = Number(inv.vatAmount), sub = Number(inv.subtotal)
  printDocument({
    heading: 'TAX INVOICE',
    number: inv.invoiceNumber,
    meta: [['Order reference', `${SOURCE_LABEL[inv.source]} ${sourceRef(inv)}`]],
    date: inv.issueDate.slice(0, 10),
    dueDate: inv.dueDate && inv.status !== 'paid' && inv.status !== 'cancelled' ? inv.dueDate.slice(0, 10) : (inv.status === 'paid' ? 'Paid' : null),
    customerId: inv.customerId ? inv.customerId.slice(0, 8).toUpperCase() : null,
    issuer: { name: inv.issuerName ?? DEFAULT_ISSUER, trn: inv.issuerTrn, address: inv.issuerAddress },
    party: {
      label: 'Bill to',
      name: inv.customerName ?? inv.salesOrder?.customer.fullName ?? inv.salesOrder?.customer.email ?? 'Customer',
      trn: inv.customerTrn, phone: inv.customerPhone, email: inv.customerEmail, address: inv.customerAddress,
    },
    lines, subtotal: sub, vat, total,
    vatRateLabel: sub > 0 ? `${Math.round((vat / sub) * 100)}%` : undefined,
    paid: Number(inv.paidAmount),
    notes: inv.notes,
    footer: 'Thank you for your business. This is a computer-generated tax invoice.',
    stamp: inv.status === 'cancelled' ? 'CANCELLED' : inv.status === 'paid' ? 'PAID' : null,
  }, win)
}

export async function printInvoiceById(id: string) {
  const win = openPrintWindow()
  try { printInvoice(await api.get<SalesInvoice>(`/sales-invoices/${id}`), win) }
  catch (e) { win?.close(); alert(e instanceof Error ? e.message : 'Could not load invoice') }
}
