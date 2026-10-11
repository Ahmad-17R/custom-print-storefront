import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

// Mirrors the backend (src/lib/vat.ts) so forms show the same VAT the server will charge.
export interface VatConfig { enabled: boolean; rate: number; ratePercent: number; pricing: 'inclusive' | 'exclusive' }
export type VatTreatment = 'standard' | 'zero_rated' | 'exempt'

export const TREATMENT_LABEL: Record<VatTreatment, string> = {
  standard:   'Standard (VAT charged)',
  zero_rated: 'Zero-rated (0% VAT)',
  exempt:     'Exempt (no VAT)',
}

const round2 = (n: number) => Math.round(n * 100) / 100

let cached: Promise<VatConfig> | null = null
export function loadVatConfig(force = false) {
  if (!cached || force) cached = api.get<VatConfig>('/tax/config').catch(() => ({ enabled: true, rate: 0.05, ratePercent: 5, pricing: 'inclusive' as const }))
  return cached
}

export function useVatConfig() {
  const [cfg, setCfg] = useState<VatConfig | null>(null)
  useEffect(() => { loadVatConfig().then(setCfg) }, [])
  return cfg
}

export function applyVat(linesTotal: number, cfg: VatConfig | null, treatment: string = 'standard') {
  const lines = round2(linesTotal)
  if (!cfg || !cfg.enabled || treatment !== 'standard' || cfg.rate <= 0) return { net: lines, vat: 0, total: lines }
  if (cfg.pricing === 'exclusive') {
    const vat = round2(lines * cfg.rate)
    return { net: lines, vat, total: round2(lines + vat) }
  }
  const vat = round2(lines * cfg.rate / (1 + cfg.rate))
  return { net: round2(lines - vat), vat, total: lines }
}

// "VAT 5% included" / "+ VAT 5%" / "No VAT (exempt)" label for totals
export function vatLabel(cfg: VatConfig | null, treatment: string = 'standard') {
  if (!cfg) return 'VAT'
  if (!cfg.enabled) return 'No VAT (VAT switched off)'
  if (treatment !== 'standard') return `No VAT (${treatment === 'exempt' ? 'exempt customer' : 'zero-rated customer'})`
  return cfg.pricing === 'exclusive' ? `VAT ${cfg.ratePercent}% (added)` : `VAT ${cfg.ratePercent}% (included)`
}

// ── Customer special rates ──
export interface CustomerPricing {
  customerId: string | null
  vatTreatment: VatTreatment
  group: { id: string; name: string; discountPercent: number } | null
  prices: Record<string, { base: number; price: number; special: boolean }>
}

export function useCustomerPricing(customerId: string | null | undefined) {
  const [pricing, setPricing] = useState<CustomerPricing | null>(null)
  useEffect(() => {
    let live = true
    api.get<CustomerPricing>(`/customer-groups/pricing${customerId ? `?customerId=${customerId}` : ''}`)
      .then(p => { if (live) setPricing(p) }).catch(() => { if (live) setPricing(null) })
    return () => { live = false }
  }, [customerId])
  return pricing
}

// Price to pre-fill for a product (customer's special rate, else catalogue price)
export const priceFor = (pricing: CustomerPricing | null, productId: string) => pricing?.prices[productId]?.price ?? 0
