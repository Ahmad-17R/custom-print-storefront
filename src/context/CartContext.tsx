import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'

export interface CartItem {
  id: string        // unique per line (slug + selected options hash)
  productId?: string
  slug: string
  name: string
  image: string
  options: string[] // human-readable selected option labels
  qty: number
  unitPrice: number
  selections?: Array<{ fieldId: string; value: string | string[] }>
  note?: string
}

interface CartState { items: CartItem[] }

type Action =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'NORMALIZE' }

function lineSignature(item: CartItem): string {
  return JSON.stringify({
    slug: item.slug,
    selections: item.selections ?? [],
    note: item.note ?? '',
    options: item.options,
    unitPrice: item.unitPrice,
  })
}

function normalizeItems(items: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>()
  for (const item of items) {
    const signature = lineSignature(item)
    const existing = merged.get(signature)
    if (existing) existing.qty += item.qty
    else merged.set(signature, { ...item })
  }
  return [...merged.values()]
}

function reducer(state: CartState, action: Action): CartState {
  switch (action.type) {
    case 'ADD': {
      const signature = lineSignature(action.item)
      const existing = state.items.find(i => lineSignature(i) === signature)
      if (existing) {
        return { items: state.items.map(i => i.id === existing.id ? { ...i, qty: i.qty + action.item.qty } : i) }
      }
      return { items: [...state.items, action.item] }
    }
    case 'REMOVE':
      return { items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE_QTY':
      return { items: state.items.map(i => i.id === action.id ? { ...i, qty: action.qty } : i) }
    case 'CLEAR':
      return { items: [] }
    case 'NORMALIZE':
      return { items: normalizeItems(state.items) }
    default:
      return state
  }
}

const STORAGE_KEY = 'mpw_cart'

interface CartCtx {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] }, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return { items: [] }
      const parsed = JSON.parse(saved) as CartState
      return { items: normalizeItems(parsed.items ?? []) }
    } catch { return { items: [] } }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => { dispatch({ type: 'NORMALIZE' }) }, [])

  const total = state.items.reduce((s, i) => s + i.unitPrice * i.qty, 0)
  const count = state.items.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem: item => dispatch({ type: 'ADD', item }),
      removeItem: id => dispatch({ type: 'REMOVE', id }),
      updateQty: (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      total,
      count,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
