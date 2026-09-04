import {
  configuredPrice,
  hasQuantityField,
  initialSelections,
  mapCatalogFields,
  missingRequiredFields,
  selectedConfigurationLabels,
} from '../src/customer/lib/productConfigurator.ts'
import type { CatalogProduct } from '../src/lib/api.ts'

const response = await fetch('http://localhost:4000/customer/catalog/rollup-banners')
if (!response.ok) throw new Error(`Catalog detail returned ${response.status}`)

const product = await response.json() as CatalogProduct
const fields = mapCatalogFields(product)
const selections = initialSelections(fields)

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
  console.log(`PASS — ${message}`)
}

assert(fields.map(field => field.label).join(',') === 'Size,Material,Quantity', 'admin field order reaches storefront')
assert(hasQuantityField(fields), 'admin Quantity field suppresses duplicate quantity stepper')
assert(missingRequiredFields(fields, selections).length === 0, 'default options satisfy required fields')
assert(configuredPrice(Number(product.basePrice), fields, selections) === 220, 'default configured price is AED 220')

const material = fields.find(field => field.label === 'Material')
assert(material, 'Material field exists')
selections[material.id] = 'backlit-film'
assert(configuredPrice(Number(product.basePrice), fields, selections) === 260, 'Backlit Film adds AED 40')

const labels = selectedConfigurationLabels(fields, selections)
assert(labels.includes('Material: Backlit Film'), 'cart receives human-readable Material selection')
assert(labels.includes('Quantity: 1'), 'cart receives configured Quantity selection')

selections[material.id] = ''
assert(missingRequiredFields(fields, selections).map(field => field.label).join(',') === 'Material', 'required validation catches cleared Material')

console.log('\nCONFIGURATOR VERIFICATION PASSED')
