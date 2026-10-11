const BASE = 'http://localhost:4000/api/v1'

const TOKEN_KEY = 'inkora_admin_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = `${method} ${path} → ${res.status}`
    try { message = JSON.parse(text)?.error ?? message } catch { message = text || message }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
}

// Multipart upload for admin (the JSON `api` helper can't send files).
async function uploadImage(path: string, file: File): Promise<{ url: string }> {
  const token = getToken()
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = `POST ${path} → ${res.status}`
    try { message = JSON.parse(text)?.error ?? message } catch { message = text || message }
    throw new Error(message)
  }
  return res.json() as Promise<{ url: string }>
}

// Uploads a category tile image → returns its stored path (save as Category.imageUrl).
export const uploadCategoryImage = (file: File) => uploadImage('/categories/upload-image', file)

// ── Order invoices & credit notes (admin) ──────────────────────────────────────
export interface OrderInvoice {
  id: string; invoiceNumber: string; orderId: string; type: 'invoice' | 'credit_note'
  status: string; issueDate: string; subtotal: string | number; vatAmount: string | number
  total: string | number; notes?: string | null
  order?: { orderNumber: string; contactName?: string | null; paymentStatus: string; paymentMethod?: string | null; customer?: { fullName?: string | null; email?: string | null } }
}
export const fetchOrderInvoices = (type?: 'invoice' | 'credit_note') =>
  api.get<{ data: OrderInvoice[] }>(`/order-invoices${type ? `?type=${type}` : ''}`).then(r => r.data)
export const issueOrderCreditNote = (orderId: string, reason?: string) =>
  api.post<OrderInvoice>(`/orders/${orderId}/credit-note`, { reason })

// ── Public storefront catalog ──────────────────────────────────────────────────
// Served under /customer (NOT /api/v1) and public — so no Authorization header.
// NOTE: Prisma serialises Decimal as a JSON string → basePrice is a string; Number() it.
export const API_ORIGIN = 'http://localhost:4000'
const CUSTOMER_BASE = `${API_ORIGIN}/customer`

export interface CatalogImage { id: string; url: string; altText: string | null; sortOrder: number; isMain: boolean }
export interface CatalogFieldOption {
  id: string; label: string; value: string; sortOrder: number
  priceModifier: string; isDefault: boolean
}
export interface CatalogField {
  id: string; label: string; type: string; sortOrder: number
  placeholder: string | null; helpText: string | null; isRequired: boolean; askAtCheckout: boolean
  options: CatalogFieldOption[]
}
export interface CatalogDetailsField {
  id: string; label: string; type: string; sortOrder: number
  placeholder: string | null; helpText: string | null; isRequired: boolean
  options: string[]
}
export interface CatalogProduct {
  id: string; slug: string; name: string; description: string | null
  basePrice: string
  editorTemplate?: string | null
  isActive: boolean
  category: { id: string; name: string } | null
  brand: { id: string; name: string } | null
  images: CatalogImage[]
  fields?: CatalogField[]
  detailsForm?: { id: string; title: string; subtitle: string | null; fields: CatalogDetailsField[] } | null
}

async function customerRequest<T>(method: string, path: string, accessToken?: string, body?: unknown): Promise<T> {
  const res = await fetch(`${CUSTOMER_BASE}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    let message = `${method} ${path} → ${res.status}`
    try { message = JSON.parse(text)?.error ?? message } catch { message = text || message }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

async function customerGet<T>(path: string, accessToken?: string): Promise<T> {
  return customerRequest<T>('GET', path, accessToken)
}

export const fetchCatalog        = ()             => customerGet<CatalogProduct[]>('/catalog')
export const fetchCatalogProduct = (slug: string) => customerGet<CatalogProduct>(`/catalog/${slug}`)

export interface CatalogCategory { id: string; name: string; imageUrl: string | null; parentId: string | null }
export const fetchCatalogCategories = () => customerGet<CatalogCategory[]>('/catalog/categories')

// ── Storefront content (admin-editable) ────────────────────────────────────────
export interface StorefrontLink { title: string; image: string; href: string }
export interface StorefrontSettings {
  announcement: { enabled: boolean; text: string }
  promo: { enabled: boolean; text: string; code: string; detail: string; ctaLabel: string; ctaHref: string }
  hero: {
    headline: string; subtext: string; tagline: string
    primaryLabel: string; primaryHref: string
    secondaryLabel: string; secondaryHref: string
    images: string[]
  }
  featured: { title: string; productSlugs: string[] }
  collections: { enabled: boolean; title: string; items: StorefrontLink[] }
  mustHaves: { enabled: boolean; title: string; items: StorefrontLink[] }
  webBanner: {
    enabled: boolean; eyebrow: string; headline: string; text: string; features: string[]
    ctaLabel: string; ctaHref: string; secondaryLabel: string; secondaryHref: string
  }
  tools: { enabled: boolean }
  gallery: { enabled: boolean }
  contact: { phone: string }
}
export const fetchStorefront = () => customerGet<StorefrontSettings>('/catalog/storefront')
export const fetchDepositPolicy = () => customerGet<{ depositPct: number }>('/catalog/deposit-policy')

// Admin: read / save the storefront settings + upload hero/collection images.
export const getStorefrontSettings  = ()                        => api.get<StorefrontSettings>('/storefront-settings')
export const saveStorefrontSettings = (s: StorefrontSettings)   => request<StorefrontSettings>('PUT', '/storefront-settings', s)
export const uploadStorefrontImage  = (file: File)             => uploadImage('/storefront-settings/upload-image', file)

export interface OrderFieldValue {
  id: string; fieldId: string | null; fieldLabel: string; fieldType: string
  value: string; displayValue: string; optionValues: unknown; priceModifier: string
}
export interface OrderAttachment {
  id: string; kind: string; fieldId: string | null; fieldLabel: string | null
  originalName: string; mimeType: string; size: number
}
export interface CustomerOrderItem {
  id: string; productId: string; productName: string; unitPrice: string
  quantity: number; total: string; note: string | null
  fieldValues: OrderFieldValue[]; attachments: OrderAttachment[]
  product?: { slug: string; isActive: boolean } | null
}
export interface CustomerOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string
  paymentMethod: string | null; paymentReference: string | null
  subtotal: string; vatAmount: string; deliveryFee: string; total: string
  notes: string | null; contactName: string | null; contactEmail: string | null
  contactPhone: string | null; deliveryLine1: string | null; deliveryLine2: string | null
  deliveryCity: string | null; deliveryEmirate: string | null; deliveryCountry: string | null
  deliveryNotes: string | null; createdAt: string
  items: CustomerOrderItem[]
  timeline: Array<{ id: string; status: string; note: string | null; createdAt: string }>
  amountPaid?: string; placedByName?: string | null
  proofStatus?: 'sent' | 'approved' | 'changes_requested' | null; proofFileUrl?: string | null; proofFileName?: string | null
  proofComment?: string | null; proofSentAt?: string | null; proofApprovedAt?: string | null
}

export const uploadCustomerFile = async (file: File, accessToken: string) => {
  const body = new FormData()
  body.append('file', file)
  return customerRequest<{ token: string; originalName: string; mimeType: string; size: number }>('POST', '/uploads', accessToken, body)
}
// A team login over its spending limit gets { approvalRequired } back instead of an order
export type OrderApprovalPending = { approvalRequired: true; requestId: string; total: number; message: string }
export const createCustomerOrder = (payload: unknown, accessToken: string) =>
  customerRequest<CustomerOrder | OrderApprovalPending>('POST', '/orders', accessToken, payload)
export const fetchCustomerOrders = (accessToken: string) => customerGet<CustomerOrder[]>('/orders', accessToken)
export const fetchCustomerOrder = (id: string, accessToken: string) => customerGet<CustomerOrder>(`/orders/${id}`, accessToken)
export const cancelCustomerOrder = (id: string, accessToken: string, note?: string) =>
  customerRequest<CustomerOrder>('POST', `/orders/${id}/cancel`, accessToken, { note })

// ── Customer account (profile + addresses) ─────────────────────────────────────
export interface CustomerAddress {
  id: string; label: string; line1: string; line2: string | null
  city: string; emirate: string; country: string; isDefault: boolean
}
export interface CustomerProfile {
  id: string; email: string; fullName: string | null; phone: string | null
  companyName: string | null; trn: string | null; corporateTaxNumber: string | null; addresses: CustomerAddress[]
}
export type AddressInput = {
  label?: string; line1: string; line2?: string; city: string; emirate: string; isDefault?: boolean
}

export const fetchCustomerProfile = (accessToken: string) => customerGet<CustomerProfile>('/me', accessToken)
export const updateCustomerProfile = (accessToken: string, body: { fullName?: string; phone?: string; companyName?: string; trn?: string; corporateTaxNumber?: string }) =>
  customerRequest<CustomerProfile>('PATCH', '/me', accessToken, body)
export const addCustomerAddress = (accessToken: string, body: AddressInput) =>
  customerRequest<CustomerAddress>('POST', '/me/addresses', accessToken, body)
export const updateCustomerAddress = (accessToken: string, id: string, body: Partial<AddressInput>) =>
  customerRequest<CustomerAddress>('PATCH', `/me/addresses/${id}`, accessToken, body)
export const deleteCustomerAddress = (accessToken: string, id: string) =>
  customerRequest<{ ok?: boolean }>('DELETE', `/me/addresses/${id}`, accessToken)

export async function downloadCustomerAttachment(orderId: string, attachmentId: string, accessToken: string, filename: string) {
  const res = await fetch(`${CUSTOMER_BASE}/orders/${orderId}/attachments/${attachmentId}`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error('Could not download attachment')
  const href = URL.createObjectURL(await res.blob())
  const link = document.createElement('a'); link.href = href; link.download = filename; link.click()
  URL.revokeObjectURL(href)
}

export async function downloadAdminAttachment(orderId: string, attachmentId: string, filename: string) {
  const token = getToken()
  const res = await fetch(`${BASE}/orders/${orderId}/attachments/${attachmentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('Could not download attachment')
  const href = URL.createObjectURL(await res.blob())
  const link = document.createElement('a'); link.href = href; link.download = filename; link.click()
  URL.revokeObjectURL(href)
}

// Seeded catalog images are absolute Unsplash URLs; admin-uploaded ones are relative
// (/uploads/…) and need the API origin prefixed.
export const catalogImageUrl = (url?: string | null) =>
  !url ? '' : url.startsWith('http') ? url : `${API_ORIGIN}${url}`

// Upload / replace an order's final print-ready design file (shown on the order + parcel label).
export async function uploadOrderDesignFile(orderId: string, file: File): Promise<{ designFileUrl: string; designFileName: string }> {
  const token = getToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/orders/${orderId}/design-file`, {
    method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form,
  })
  if (!res.ok) { let m = `Upload failed (${res.status})`; try { m = (await res.json())?.error ?? m } catch { /* ignore */ } throw new Error(m) }
  return res.json()
}
export const deleteOrderDesignFile = (orderId: string) => api.delete(`/orders/${orderId}/design-file`)

// ── Internal (owner + employee) auth — against our own DB, not Supabase ────────
export interface AuthEmployee {
  id: string; employeeNo: string; name: string; email?: string | null
  role: string; jobTitle?: string | null; isOwner: boolean; permissions: string[]
  posRegisterId?: string | null; posRegisterName?: string | null
}

const AUTH_BASE = 'http://localhost:4000/employee/auth'

export async function loginInternal(identifier: string, password: string): Promise<{ token: string; employee: AuthEmployee }> {
  const isEmail = identifier.includes('@')
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isEmail ? { email: identifier, password } : { employeeNo: identifier, password }),
  })
  if (!res.ok) {
    const t = await res.text()
    let m = 'Login failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  const data = await res.json()
  setToken(data.token)
  return data
}

export async function updateMyAccount(body: { currentPassword: string; newUsername?: string; newPassword?: string; newPosPassword?: string }): Promise<{ ok: boolean; employeeNo: string }> {
  const token = getToken()
  const res = await fetch(`${AUTH_BASE}/account`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'Update failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

// Unlock the current logged-in operator's counter with just the POS password.
export async function posVerify(posPassword: string): Promise<{ ok: boolean; register: { id: string; name: string }; operator: { name: string } }> {
  const token = getToken()
  const res = await fetch(`${AUTH_BASE}/pos-verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ posPassword }),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'POS unlock failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

export interface PosLoginResult { token: string; employee: { id: string; name: string; employeeNo: string }; register: { id: string; name: string } }
export async function posLogin(identifier: string, posPassword: string): Promise<PosLoginResult> {
  const isEmail = identifier.includes('@')
  const res = await fetch(`${AUTH_BASE}/pos-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(isEmail ? { email: identifier, posPassword } : { employeeNo: identifier, posPassword }),
  })
  if (!res.ok) {
    const t = await res.text(); let m = 'POS login failed'
    try { m = JSON.parse(t)?.error ?? m } catch { m = t || m }
    throw new Error(m)
  }
  return res.json()
}

export async function fetchMe(): Promise<AuthEmployee | null> {
  const token = getToken()
  if (!token) return null
  const res = await fetch(`${AUTH_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const p = await res.json()
  // /me returns the JWT payload (employeeId, no email) — normalize to AuthEmployee
  return {
    id: p.employeeId ?? p.id,
    employeeNo: p.employeeNo,
    name: p.name,
    email: p.email ?? null,
    role: p.role,
    jobTitle: p.jobTitle ?? null,
    isOwner: !!p.isOwner,
    permissions: Array.isArray(p.permissions) ? p.permissions : [],
    posRegisterId: p.posRegisterId ?? null,
    posRegisterName: p.posRegisterName ?? null,
  }
}

// ── Customer portal (team logins, invoices, statement, proofs, messages, quotes) ─
export interface PortalMember {
  id: string; name: string; email: string; canOrder: boolean; canViewOrders: boolean; canViewInvoices: boolean
  spendLimit: string | null; approvalOverLimit: boolean; expiresAt: string | null; isActive: boolean; lastLoginAt: string | null; createdAt: string
}
export interface PortalWhoami {
  account: { id: string; email: string; name: string; customerType: string | null } | null
  member: { id: string; name: string; email: string; canOrder: boolean; canViewOrders: boolean; canViewInvoices: boolean; spendLimit: number | null; approvalOverLimit: boolean } | null
}
export interface PortalOrderRequest { id: string; status: 'pending' | 'approved' | 'rejected'; total: string; orderId: string | null; note: string | null; createdAt: string; payload: { items: { productId: string; quantity: number }[] }; member: { name: string; email: string; spendLimit: string | null } }
export interface PortalInvoice {
  id: string; invoiceNumber: string; type: 'invoice' | 'credit_note'; status: string; issueDate: string
  subtotal: string; vatAmount: string; total: string; notes: string | null
  order: CustomerOrder & { customer?: { fullName: string | null; email: string; companyName: string | null; trn: string | null; phone: string | null } }
}
export interface PortalStatementRow { date: string; type: string; ref: string; orderNumber: string; description: string; debit: number; credit: number; balance: number }
export interface PortalStatement { customer: { fullName: string | null; companyName: string | null; email: string; trn: string | null; phone: string | null } | null; opening: number; closing: number; rows: PortalStatementRow[]; totals: { debit: number; credit: number } }
export interface PortalBalance { outstanding: number; totalPaid: number; totalSpend: number; credit: number; openOrders: number }
export interface OrderMessage { id: string; sender: 'customer' | 'staff'; authorName: string; body: string; fileUrl: string | null; fileName: string | null; createdAt: string }
export interface PortalQuote {
  id: string; quoteNumber: string | null; status: 'requested' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  validUntil: string | null; subtotal: string | number; vatAmount: string | number; total: string | number
  notes: string | null; requestNote: string | null; createdAt: string
  items: { id: string; productName: string | null; description: string | null; quantity: number; unitPrice: string | number; total: string | number }[]
}
export type MemberInput = Partial<{ name: string; email: string; password: string; canOrder: boolean; canViewOrders: boolean; canViewInvoices: boolean; spendLimit: number | null; approvalOverLimit: boolean; expiresAt: string | null; isActive: boolean }>

export const portal = {
  whoami:        (t: string) => customerGet<PortalWhoami>('/portal/whoami', t),
  members:       (t: string) => customerGet<PortalMember[]>('/portal/members', t),
  addMember:     (t: string, b: MemberInput) => customerRequest<PortalMember>('POST', '/portal/members', t, b),
  updateMember:  (t: string, id: string, b: MemberInput) => customerRequest<PortalMember>('PATCH', `/portal/members/${id}`, t, b),
  removeMember:  (t: string, id: string) => customerRequest<void>('DELETE', `/portal/members/${id}`, t),
  requests:      (t: string) => customerGet<PortalOrderRequest[]>('/portal/order-requests', t),
  approve:       (t: string, id: string) => customerRequest<CustomerOrder>('POST', `/portal/order-requests/${id}/approve`, t, {}),
  reject:        (t: string, id: string, note?: string) => customerRequest<PortalOrderRequest>('POST', `/portal/order-requests/${id}/reject`, t, { note }),
  invoices:      (t: string) => customerGet<PortalInvoice[]>('/portal/invoices', t),
  invoice:       (t: string, id: string) => customerGet<PortalInvoice>(`/portal/invoices/${id}`, t),
  statement:     (t: string, from?: string, to?: string) => customerGet<PortalStatement>(`/portal/statement?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`, t),
  balance:       (t: string) => customerGet<PortalBalance>('/portal/balance', t),
  approveProof:  (t: string, orderId: string) => customerRequest<{ ok: true }>('POST', `/portal/orders/${orderId}/proof/approve`, t, {}),
  proofChanges:  (t: string, orderId: string, comment: string) => customerRequest<{ ok: true }>('POST', `/portal/orders/${orderId}/proof/changes`, t, { comment }),
  messages:      (t: string, orderId: string) => customerGet<OrderMessage[]>(`/portal/orders/${orderId}/messages`, t),
  sendMessage:   (t: string, orderId: string, body: string) => customerRequest<OrderMessage>('POST', `/portal/orders/${orderId}/messages`, t, { body }),
  unread:        (t: string) => customerGet<{ count: number }>('/portal/messages/unread', t),
  quotes:        (t: string) => customerGet<PortalQuote[]>('/portal/quotes', t),
  requestQuote:  (t: string, b: { note: string; items: { productId: string; quantity: number; description?: string }[] }) => customerRequest<PortalQuote>('POST', '/portal/quotes', t, b),
  acceptQuote:   (t: string, id: string) => customerRequest<PortalQuote>('POST', `/portal/quotes/${id}/accept`, t, {}),
  rejectQuote:   (t: string, id: string, reason?: string) => customerRequest<PortalQuote>('POST', `/portal/quotes/${id}/reject`, t, { reason }),
  myPrices:      (t: string) => customerGet<{ group: { name: string; discountPercent: number } | null; prices: Record<string, { base: number; price: number }> }>('/portal/my-prices', t),
}
