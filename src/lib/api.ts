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
}

export const uploadCustomerFile = async (file: File, accessToken: string) => {
  const body = new FormData()
  body.append('file', file)
  return customerRequest<{ token: string; originalName: string; mimeType: string; size: number }>('POST', '/uploads', accessToken, body)
}
export const createCustomerOrder = (payload: unknown, accessToken: string) =>
  customerRequest<CustomerOrder>('POST', '/orders', accessToken, payload)
export const fetchCustomerOrders = (accessToken: string) => customerGet<CustomerOrder[]>('/orders', accessToken)
export const fetchCustomerOrder = (id: string, accessToken: string) => customerGet<CustomerOrder>(`/orders/${id}`, accessToken)
export const cancelCustomerOrder = (id: string, accessToken: string, note?: string) =>
  customerRequest<CustomerOrder>('POST', `/orders/${id}/cancel`, accessToken, { note })

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
