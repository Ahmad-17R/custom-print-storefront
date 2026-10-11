import { useEffect, useState } from 'react'
import { API_ORIGIN } from './api'

// Shop VAT (rate + on/off from Finance → Tax Rates). Shop prices always include VAT.
export interface ShopVat { enabled: boolean; ratePercent: number }
let cached: Promise<ShopVat> | null = null

export function useShopVat() {
  const [vat, setVat] = useState<ShopVat>({ enabled: true, ratePercent: 5 })
  useEffect(() => {
    if (!cached) cached = fetch(`${API_ORIGIN}/customer/tax-config`).then(r => r.json()).catch(() => ({ enabled: true, ratePercent: 5 }))
    cached.then(setVat)
  }, [])
  return vat
}

// VAT inside a VAT-inclusive amount
export const vatInside = (gross: number, v: ShopVat) =>
  v.enabled && v.ratePercent > 0 ? Math.round((gross * v.ratePercent / (100 + v.ratePercent)) * 100) / 100 : 0

export const vatTag = (v: ShopVat) => (v.enabled ? `incl. ${v.ratePercent}% VAT` : 'no VAT')
