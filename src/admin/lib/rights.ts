// Single source of truth for per-employee access rights.
// Page keys are the route path after "/admin/". Feature keys start with "feature.".

export interface RightItem { key: string; label: string }
export interface RightGroup { section: string; items: RightItem[] }

export const PAGE_RIGHTS: RightGroup[] = [
  { section: 'Dashboard', items: [
    { key: 'dashboard', label: 'Dashboard' },
  ]},
  { section: 'Catalog', items: [
    { key: 'products', label: 'Products' },
    { key: 'categories', label: 'Categories' },
    { key: 'brands', label: 'Brands' },
  ]},
  { section: 'Orders (Online)', items: [
    { key: 'orders', label: 'All Orders' },
    { key: 'online-order-handling', label: 'Order Handling (Online)' },
    { key: 'quotations', label: 'Quotations' },
    { key: 'sales-invoices', label: 'Sales Invoices' },
    { key: 'delivery-notes', label: 'Delivery Notes' },
    { key: 'sales-returns', label: 'Sales Returns' },
    { key: 'credit-notes', label: 'Credit Notes' },
  ]},
  { section: 'Sales & CRM', items: [
    { key: 'walk-in-customers', label: 'Customers' },
    { key: 'walk-in-sales', label: 'Walk-in Sales' },
    { key: 'order-handling', label: 'Order Handling (Walk-in)' },
    { key: 'order-summary', label: 'Order Summary' },
  ]},
  { section: 'Point of Sale', items: [
    { key: 'pos/terminal', label: 'POS Terminal' },
    { key: 'pos/registers', label: 'Registers' },
  ]},
  { section: 'Inventory', items: [
    { key: 'materials', label: 'Materials' },
    { key: 'stock', label: 'Stock Levels' },
    { key: 'stock-in', label: 'Stock In' },
    { key: 'warehouses', label: 'Warehouses' },
    { key: 'stock-adjustments', label: 'Adjustments' },
    { key: 'stock-transfers', label: 'Transfers' },
  ]},
  { section: 'Procurement', items: [
    { key: 'suppliers', label: 'Suppliers' },
    { key: 'purchase-requisitions', label: 'Requisitions' },
    { key: 'rfqs', label: 'RFQs' },
    { key: 'purchase-orders', label: 'Purchase Orders' },
    { key: 'goods-receipts', label: 'Goods Receipts' },
    { key: 'purchase-returns', label: 'Purchase Returns' },
    { key: 'procurement-analytics', label: 'Procurement Analytics' },
  ]},
  { section: 'Manufacturing', items: [
    { key: 'bom', label: 'Bills of Materials' },
    { key: 'manufacturing-orders', label: 'Manufacturing Orders' },
  ]},
  { section: 'Logistics', items: [
    { key: 'carriers', label: 'Carriers & Routes' },
    { key: 'shipments', label: 'Shipments' },
  ]},
  { section: 'HR & Payroll', items: [
    { key: 'employees', label: 'Employees' },
    { key: 'departments', label: 'Departments' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'leave', label: 'Leave Requests' },
    { key: 'payroll', label: 'Payroll Runs' },
    { key: 'shifts', label: 'Work Shifts' },
    { key: 'advances', label: 'Employee Advances' },
  ]},
  { section: 'Finance', items: [
    { key: 'reports', label: 'Financial Reports' },
    { key: 'accounts', label: 'Chart of Accounts' },
    { key: 'journals', label: 'Journal Entries' },
    { key: 'bank-accounts', label: 'Bank Accounts' },
    { key: 'tax-rates', label: 'Tax Rates' },
    { key: 'fiscal-periods', label: 'Fiscal Periods' },
    { key: 'budgets', label: 'Budgets' },
    { key: 'assets', label: 'Fixed Assets' },
    { key: 'expenses', label: 'Expense Claims' },
    { key: 'tax-filings', label: 'Tax Filings' },
  ]},
  { section: 'Projects', items: [
    { key: 'projects', label: 'Projects' },
    { key: 'tasks', label: 'Tasks' },
  ]},
  { section: 'Analytics', items: [
    { key: 'kpi', label: 'KPI Scorecards' },
  ]},
  { section: 'System', items: [
    { key: 'users', label: 'Users & Roles' },
    { key: 'audit', label: 'Audit Trail' },
    { key: 'settings', label: 'Company Settings' },
  ]},
]

// Cross-cutting feature toggles (fraud-sensitive actions default OFF).
export const FEATURE_RIGHTS: RightItem[] = [
  { key: 'feature.view_costs',      label: 'See job / material costs & margins on orders' },
  { key: 'feature.confirm_orders',  label: 'Can confirm orders (move to production)' },
  { key: 'feature.record_payments', label: 'Can record payments' },
  { key: 'feature.refunds',         label: 'Can issue refunds / void paid orders' },
  { key: 'feature.discounts',       label: 'Can apply discounts' },
  { key: 'feature.stock_adjust',    label: 'Can adjust stock (write-offs / counts)' },
  { key: 'feature.edit_confirmed',  label: 'Can edit an order after it is confirmed' },
  { key: 'feature.delete',          label: 'Can delete / void records' },
]

export const ALL_PAGE_KEYS = PAGE_RIGHTS.flatMap(g => g.items.map(i => i.key))

// One-click starting points the owner can then tweak per person.
export const PRESETS: Record<string, string[]> = {
  'Sales Staff': [
    'dashboard', 'walk-in-customers', 'walk-in-sales', 'order-handling', 'order-summary',
    'orders', 'online-order-handling', 'pos/terminal', 'pos/registers', 'products',
    'feature.confirm_orders', 'feature.record_payments',
  ],
  'Warehouse Staff': [
    'dashboard', 'materials', 'stock', 'stock-in', 'warehouses', 'stock-adjustments', 'stock-transfers',
    'goods-receipts', 'order-handling', 'online-order-handling',
    'feature.stock_adjust',
  ],
  'Finance Officer': [
    'dashboard', 'reports', 'accounts', 'journals', 'bank-accounts', 'tax-rates', 'fiscal-periods',
    'budgets', 'assets', 'expenses', 'tax-filings', 'kpi',
    'feature.view_costs', 'feature.record_payments',
  ],
  'Purchasing Officer': [
    'dashboard', 'suppliers', 'purchase-requisitions', 'rfqs', 'purchase-orders', 'goods-receipts',
    'purchase-returns', 'procurement-analytics', 'materials', 'stock',
    'feature.view_costs',
  ],
  'Viewer (read-only)': [
    'dashboard', 'kpi', 'reports', 'order-summary',
  ],
}
