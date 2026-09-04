import type { CatalogProduct } from '../../lib/api'

export type ConfigFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file_upload'
  | 'color_picker'

export interface ConfigOption {
  id: string
  label: string
  value: string
  priceModifier: number
  isDefault: boolean
}

export interface ConfigField {
  id: string
  label: string
  type: ConfigFieldType
  placeholder: string
  helpText: string
  isRequired: boolean
  askAtCheckout: boolean
  options: ConfigOption[]
  source: 'product' | 'details' | 'mock'
}

export type ConfigSelection = string | string[]
export type ConfigSelections = Record<string, ConfigSelection>

const FIELD_TYPES = new Set<ConfigFieldType>([
  'text', 'textarea', 'number', 'dropdown', 'radio', 'checkbox', 'file_upload', 'color_picker',
])

function supportedType(type: string): ConfigFieldType | null {
  return FIELD_TYPES.has(type as ConfigFieldType) ? type as ConfigFieldType : null
}

export function mapCatalogFields(product: CatalogProduct): ConfigField[] {
  const productFields = (product.fields ?? []).flatMap(field => {
    const type = supportedType(field.type)
    if (!type) return []
    return [{
      id: field.id,
      label: field.label,
      type,
      placeholder: field.placeholder ?? '',
      helpText: field.helpText ?? '',
      isRequired: field.isRequired,
      askAtCheckout: field.askAtCheckout,
      options: field.options.map(option => ({
        id: option.id,
        label: option.label,
        value: option.value,
        priceModifier: Number(option.priceModifier) || 0,
        isDefault: option.isDefault,
      })),
      source: 'product' as const,
    }]
  })

  return productFields
}

export function productPageFields(fields: ConfigField[]): ConfigField[] {
  return fields.filter(field => !field.askAtCheckout)
}

export function checkoutFields(fields: ConfigField[]): ConfigField[] {
  return fields.filter(field => field.askAtCheckout)
}

export function selectedFieldValues(fields: ConfigField[], selections: ConfigSelections) {
  return fields.flatMap(field => {
    const value = selections[field.id]
    if (Array.isArray(value) ? value.length === 0 : !value?.trim()) return []
    return [{ fieldId: field.id, value }]
  })
}

export function mapMockFields(fields: Array<{ label: string; type: 'dropdown' | 'radio' | 'checkbox'; options: string[] }>): ConfigField[] {
  return fields.map((field, fieldIndex) => ({
    id: `mock:${fieldIndex}:${field.label}`,
    label: field.label,
    type: field.type,
    placeholder: '',
    helpText: '',
    isRequired: false,
    askAtCheckout: false,
    options: field.options.map((label, optionIndex) => ({
      id: `mock:${fieldIndex}:${optionIndex}`,
      label,
      value: label,
      priceModifier: 0,
      isDefault: false,
    })),
    source: 'mock',
  }))
}

export function initialSelections(fields: ConfigField[]): ConfigSelections {
  return Object.fromEntries(fields.map(field => {
    const defaults = field.options.filter(option => option.isDefault).map(option => option.value)
    if (field.type === 'checkbox') return [field.id, defaults]
    return [field.id, defaults[0] ?? '']
  }))
}

export function selectedPriceModifier(fields: ConfigField[], selections: ConfigSelections): number {
  return fields.reduce((total, field) => {
    const selected = selections[field.id]
    const values = Array.isArray(selected) ? selected : selected ? [selected] : []
    return total + field.options
      .filter(option => values.includes(option.value))
      .reduce((sum, option) => sum + option.priceModifier, 0)
  }, 0)
}

export function configuredPrice(basePrice: number, fields: ConfigField[], selections: ConfigSelections): number {
  return Math.max(0, basePrice + selectedPriceModifier(fields, selections))
}

function hasValue(value: ConfigSelection | undefined): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())
}

export function missingRequiredFields(fields: ConfigField[], selections: ConfigSelections): ConfigField[] {
  return fields.filter(field => field.isRequired && !hasValue(selections[field.id]))
}

export function selectedConfigurationLabels(fields: ConfigField[], selections: ConfigSelections): string[] {
  return fields.flatMap(field => {
    const selected = selections[field.id]
    const values = Array.isArray(selected) ? selected : selected ? [selected] : []
    if (values.length === 0) return []
    const display = values.map(value => field.options.find(option => option.value === value)?.label ?? value)
    return [`${field.label}: ${display.join(', ')}`]
  })
}

export function optionDisplayLabel(option: ConfigOption): string {
  if (option.priceModifier === 0) return option.label
  const sign = option.priceModifier > 0 ? '+' : '−'
  return `${option.label} (${sign}AED ${Math.abs(option.priceModifier)})`
}

export function hasQuantityField(fields: ConfigField[]): boolean {
  return fields.some(field => field.label.trim().toLowerCase() === 'quantity')
}
