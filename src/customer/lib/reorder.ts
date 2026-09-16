import type { CustomerOrder } from '../../lib/api'
import type { CartItem } from '../../context/CartContext'

// Rebuild cart lines from a past order so the customer can order the same thing again.
// Skips items whose product is no longer available.
export function orderToCartItems(order: CustomerOrder): { items: CartItem[]; skipped: number } {
  const items: CartItem[] = []
  let skipped = 0
  for (const it of order.items) {
    const slug = it.product?.slug
    if (!slug || it.product?.isActive === false) { skipped++; continue }
    const selections = (it.fieldValues ?? [])
      .filter(fv => fv.fieldId)
      .map(fv => ({ fieldId: fv.fieldId as string, value: (Array.isArray(fv.optionValues) ? fv.optionValues as string[] : fv.value) }))
    items.push({
      id: `${slug}::reorder::${it.id}`,
      productId: it.productId,
      slug,
      name: it.productName,
      image: '',
      options: (it.fieldValues ?? []).map(fv => fv.displayValue).filter(Boolean),
      qty: it.quantity,
      unitPrice: Number(it.unitPrice) || 0,
      selections,
      note: it.note ?? undefined,
    })
  }
  return { items, skipped }
}
