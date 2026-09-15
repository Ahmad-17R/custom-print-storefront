import { useSearchParams } from 'react-router-dom'
import ProductEditor from '../../shared/components/product-editor/ProductEditor'
import { TEMPLATES } from '../../shared/components/product-editor/templates'

export function EditorPage() {
  const [params] = useSearchParams()
  const requested = params.get('product') ?? ''
  // Honour the template the product was set up with; fall back to the standard card.
  const productType = TEMPLATES[requested] ? requested : 'business_card'
  return <ProductEditor initialProductType={productType} />
}
