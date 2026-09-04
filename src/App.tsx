import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AuthCallbackPage }    from './customer/pages/AuthCallbackPage'
import { EditorPage }          from './customer/pages/EditorPage'
import { FinalStepsPage }      from './customer/pages/FinalStepsPage'
import { DesignReviewPage }    from './customer/pages/DesignReviewPage'
import { HomePage }            from './customer/pages/HomePage'
import { CatalogPage }         from './customer/pages/CatalogPage'
import { ProductDetailPage }   from './customer/pages/ProductDetailPage'
import { CartPage }            from './customer/pages/CartPage'
import { LoginPage }           from './customer/pages/LoginPage'
import { SignupPage }          from './customer/pages/SignupPage'
import { CheckoutPage }        from './customer/pages/CheckoutPage'
import { OrderConfirmationPage }from './customer/pages/OrderConfirmationPage'
import { MyOrdersPage }        from './customer/pages/MyOrdersPage'
import { OrderDetailPage }     from './customer/pages/OrderDetailPage'

// Admin auth
import { type ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthProvider as AdminAuthProvider, useAuth } from './admin/lib/AuthContext'
import { AdminLoginPage }      from './admin/pages/AdminLoginPage'
import { PAGE_RIGHTS }         from './admin/lib/rights'
// Admin pages
import { AdminDashboard }      from './admin/pages/AdminDashboard'
import { AdminProductFields }  from './admin/pages/AdminProductFields'
import { AdminProductJobs }    from './admin/pages/AdminProductJobs'
import { ProductsPage }        from './admin/pages/ProductsPage'
import { CategoriesPage }      from './admin/pages/CategoriesPage'
import { BrandsPage }          from './admin/pages/BrandsPage'
import { OrdersPage }          from './admin/pages/OrdersPage'
import { OnlineOrderHandlingPage } from './admin/pages/OnlineOrderHandlingPage'
import { CustomersPage }       from './admin/pages/CustomersPage'
import { SuppliersPage }       from './admin/pages/SuppliersPage'
import { StockPage }           from './admin/pages/StockPage'
import { StockInPage }         from './admin/pages/StockInPage'
import { MaterialsPage }       from './admin/pages/MaterialsPage'
import { WarehousesPage }      from './admin/pages/WarehousesPage'
import { CountriesPage }       from './admin/pages/CountriesPage'
import { BranchesPage }        from './admin/pages/BranchesPage'
import { QuotationsPage }      from './admin/pages/QuotationsPage'
import { SalesOrdersPage }     from './admin/pages/SalesOrdersPage'
import { SalesInvoicesPage }   from './admin/pages/SalesInvoicesPage'
import { PurchaseOrdersPage }  from './admin/pages/PurchaseOrdersPage'
import { GoodsReceiptsPage }   from './admin/pages/GoodsReceiptsPage'
import { EmployeesPage }       from './admin/pages/EmployeesPage'
import { DepartmentsPage }    from './admin/pages/DepartmentsPage'
import { PayrollPage }         from './admin/pages/PayrollPage'
import { ChartOfAccountsPage } from './admin/pages/ChartOfAccountsPage'
import { UsersPage }           from './admin/pages/UsersPage'
import { LeadsPage }           from './admin/pages/LeadsPage'
import { ManufacturingPage }   from './admin/pages/ManufacturingPage'
import { SettingsPage }        from './admin/pages/SettingsPage'
import { DeliveryNotesPage }   from './admin/pages/DeliveryNotesPage'
import { SalesReturnsPage }    from './admin/pages/SalesReturnsPage'
import { CreditNotesPage }     from './admin/pages/CreditNotesPage'
import { PurchaseReturnsPage }        from './admin/pages/PurchaseReturnsPage'
import { ProcurementAnalyticsPage }   from './admin/pages/ProcurementAnalyticsPage'
import { WalkInCustomersPage }        from './admin/pages/WalkInCustomersPage'
import { WalkInSalesPage }            from './admin/pages/WalkInSalesPage'
import { OrderHandlingPage }          from './admin/pages/OrderHandlingPage'
import { OrderSummaryPage }           from './admin/pages/OrderSummaryPage'
import { MyJobsPage }                 from './admin/pages/MyJobsPage'
import { PosRegistersPage }           from './admin/pages/PosRegistersPage'
import { PosTerminalPage }            from './admin/pages/PosTerminalPage'
import { StockAdjustmentsPage } from './admin/pages/StockAdjustmentsPage'
import { StockTransfersPage }  from './admin/pages/StockTransfersPage'
import { LotsPage }            from './admin/pages/LotsPage'
import { SerialsPage }         from './admin/pages/SerialsPage'
import { RequisitionsPage }    from './admin/pages/RequisitionsPage'
import { RFQsPage }            from './admin/pages/RFQsPage'
import { OpportunitiesPage }   from './admin/pages/OpportunitiesPage'
import { PriceListsPage }      from './admin/pages/PriceListsPage'
import { PromotionsPage }      from './admin/pages/PromotionsPage'
import { CommissionsPage }     from './admin/pages/CommissionsPage'
import { BomPage }             from './admin/pages/BomPage'
import { CarriersPage }        from './admin/pages/CarriersPage'
import { ShipmentsPage }       from './admin/pages/ShipmentsPage'
import { AttendancePage }      from './admin/pages/AttendancePage'
import { LeavePage }           from './admin/pages/LeavePage'
import { ApplicantsPage }      from './admin/pages/ApplicantsPage'
import { AppraisalsPage }      from './admin/pages/AppraisalsPage'
import { ReportsPage }         from './admin/pages/ReportsPage'
import { JournalEntriesPage }  from './admin/pages/JournalEntriesPage'
import { BankAccountsPage }    from './admin/pages/BankAccountsPage'
import { TaxRatesPage }        from './admin/pages/TaxRatesPage'
import { FiscalPeriodsPage }   from './admin/pages/FiscalPeriodsPage'
import { BudgetsPage }         from './admin/pages/BudgetsPage'
import { FixedAssetsPage }     from './admin/pages/FixedAssetsPage'
import { ExpenseClaimsPage }   from './admin/pages/ExpenseClaimsPage'
import { ProjectsPage }        from './admin/pages/ProjectsPage'
import { TasksPage }           from './admin/pages/TasksPage'
import { AuditTrailPage }      from './admin/pages/AuditTrailPage'
import { WebhooksPage }        from './admin/pages/WebhooksPage'
import { EmailTemplatesPage }  from './admin/pages/EmailTemplatesPage'
import { NotificationsPage }   from './admin/pages/NotificationsPage'
import { ShiftsPage }          from './admin/pages/ShiftsPage'
import { HolidaysPage }        from './admin/pages/HolidaysPage'
import { DeductionRulesPage }  from './admin/pages/DeductionRulesPage'
import { EmployeeAdvancesPage }from './admin/pages/EmployeeAdvancesPage'
import { CustomerPaymentsPage }from './admin/pages/CustomerPaymentsPage'
import { SupplierPaymentsPage }from './admin/pages/SupplierPaymentsPage'
import { CurrenciesPage }      from './admin/pages/CurrenciesPage'
import { PlansPage }           from './admin/pages/PlansPage'
import { SubscriptionsPage }   from './admin/pages/SubscriptionsPage'
import { PortalUsersPage }     from './admin/pages/PortalUsersPage'
import { TaxFilingsPage }      from './admin/pages/TaxFilingsPage'
import { KpiScorecardsPage }   from './admin/pages/KpiScorecardsPage'
import { ScheduledReportsPage }from './admin/pages/ScheduledReportsPage'

import { AdminCountryProvider } from './admin/context/AdminCountryContext'
import Navbar  from './shared/components/Navbar'
import Footer  from './shared/components/Footer'

const FULLSCREEN_PATHS = [
  '/editor', '/review', '/final-steps', '/login', '/signup', '/auth/callback', '/admin',
  '/checkout', '/orders',
]

// Gate the admin panel behind internal (owner + employee) login
function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading, can } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // If a user lands on the base dashboard but wasn't granted it, send them to
  // their first available page (so they never hit a dead "no access" landing).
  useEffect(() => {
    if (!user || loading) return
    const onBase = pathname === '/admin' || pathname === '/admin/'
    if (onBase && !user.isOwner && !can('dashboard')) {
      const firstKey = PAGE_RIGHTS.flatMap(g => g.items).map(i => i.key)
        .find(k => can(k) || (k === 'pos/terminal' && !!user.posRegisterId))
      // Fall back to personal screens if no full page was granted
      const target = firstKey ? `/admin/${firstKey}` : '/admin/my-jobs'
      navigate(target, { replace: true })
    }
  }, [user, loading, pathname, can, navigate])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: "'Poppins', system-ui, sans-serif" }}>Loading…</div>
  if (!user) return <AdminLoginPage />
  return <>{children}</>
}

function Layout() {
  const { pathname } = useLocation()
  const isFullscreen = pathname === '/' || FULLSCREEN_PATHS.some(p => pathname.startsWith(p))

  if (isFullscreen) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"                      element={<HomePage />} />
          <Route path="/editor"                element={<EditorPage />} />
          <Route path="/review"                element={<DesignReviewPage />} />
          <Route path="/final-steps"           element={<FinalStepsPage />} />
          <Route path="/login"                 element={<LoginPage />} />
          <Route path="/signup"                element={<SignupPage />} />
          <Route path="/auth/callback"         element={<AuthCallbackPage />} />
          <Route path="/checkout"              element={<CheckoutPage />} />
          <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/orders/:id"            element={<OrderDetailPage />} />
          <Route path="/orders"                element={<MyOrdersPage />} />

          {/* Admin — all routes share the country context */}
          <Route path="/admin/*" element={
            <AdminAuthProvider>
             <AdminGate>
              <AdminCountryProvider>
              <Routes>
                <Route path=""                          element={<AdminDashboard />} />
                <Route path="products"                  element={<ProductsPage />} />
                <Route path="products/:id/fields"       element={<AdminProductFields />} />
                <Route path="products/:id/jobs"         element={<AdminProductJobs />} />
                <Route path="categories"                element={<CategoriesPage />} />
                <Route path="brands"                    element={<BrandsPage />} />
                <Route path="orders"                    element={<OrdersPage />} />
                <Route path="online-order-handling"     element={<OnlineOrderHandlingPage />} />
                <Route path="customers"                 element={<CustomersPage />} />
                <Route path="suppliers"                 element={<SuppliersPage />} />
                <Route path="stock"                     element={<StockPage />} />
                <Route path="stock-in"                  element={<StockInPage />} />
                <Route path="materials"                 element={<MaterialsPage />} />
                <Route path="warehouses"                element={<WarehousesPage />} />
                <Route path="branches"                  element={<BranchesPage />} />
                <Route path="countries"                 element={<CountriesPage />} />
                <Route path="quotations"                element={<QuotationsPage />} />
                <Route path="sales-orders"              element={<SalesOrdersPage />} />
                <Route path="sales-invoices"            element={<SalesInvoicesPage />} />
                <Route path="purchase-orders"           element={<PurchaseOrdersPage />} />
                <Route path="goods-receipts"            element={<GoodsReceiptsPage />} />
                <Route path="employees"                 element={<EmployeesPage />} />
                <Route path="departments"              element={<DepartmentsPage />} />
                <Route path="payroll"                   element={<PayrollPage />} />
                <Route path="users"                     element={<UsersPage />} />
                <Route path="leads"                     element={<LeadsPage />} />
                <Route path="opportunities"             element={<OpportunitiesPage />} />
                <Route path="manufacturing-orders"      element={<ManufacturingPage />} />
                <Route path="delivery-notes"            element={<DeliveryNotesPage />} />
                <Route path="sales-returns"             element={<SalesReturnsPage />} />
                <Route path="credit-notes"              element={<CreditNotesPage />} />
                <Route path="purchase-returns"          element={<PurchaseReturnsPage />} />
                <Route path="procurement-analytics"    element={<ProcurementAnalyticsPage />} />
                <Route path="walk-in-customers"       element={<WalkInCustomersPage />} />
                <Route path="walk-in-sales"           element={<WalkInSalesPage />} />
                <Route path="order-handling"          element={<OrderHandlingPage />} />
                <Route path="order-summary"           element={<OrderSummaryPage />} />
                <Route path="my-jobs"                 element={<MyJobsPage />} />
                <Route path="stock-adjustments"         element={<StockAdjustmentsPage />} />
                <Route path="stock-transfers"           element={<StockTransfersPage />} />
                <Route path="lots"                      element={<LotsPage />} />
                <Route path="serials"                   element={<SerialsPage />} />
                <Route path="purchase-requisitions"     element={<RequisitionsPage />} />
                <Route path="rfqs"                      element={<RFQsPage />} />
                <Route path="price-lists"               element={<PriceListsPage />} />
                <Route path="promotions"                element={<PromotionsPage />} />
                <Route path="commissions"               element={<CommissionsPage />} />
                <Route path="pos/terminal"              element={<PosTerminalPage />} />
                <Route path="pos/registers"             element={<PosRegistersPage />} />
                <Route path="bom"                       element={<BomPage />} />
                <Route path="carriers"                  element={<CarriersPage />} />
                <Route path="shipments"                 element={<ShipmentsPage />} />
                <Route path="attendance"                element={<AttendancePage />} />
                <Route path="leave"                     element={<LeavePage />} />
                <Route path="applicants"                element={<ApplicantsPage />} />
                <Route path="appraisals"                element={<AppraisalsPage />} />
                <Route path="reports"                   element={<ReportsPage />} />
                <Route path="accounts"                  element={<ChartOfAccountsPage />} />
                <Route path="journals"                  element={<JournalEntriesPage />} />
                <Route path="bank-accounts"             element={<BankAccountsPage />} />
                <Route path="tax-rates"                 element={<TaxRatesPage />} />
                <Route path="fiscal-periods"            element={<FiscalPeriodsPage />} />
                <Route path="budgets"                   element={<BudgetsPage />} />
                <Route path="assets"                    element={<FixedAssetsPage />} />
                <Route path="expenses"                  element={<ExpenseClaimsPage />} />
                <Route path="projects"                  element={<ProjectsPage />} />
                <Route path="tasks"                     element={<TasksPage />} />
                <Route path="audit"                     element={<AuditTrailPage />} />
                <Route path="webhooks"                  element={<WebhooksPage />} />
                <Route path="email-templates"           element={<EmailTemplatesPage />} />
                <Route path="notifications"             element={<NotificationsPage />} />
                <Route path="settings"                  element={<SettingsPage />} />
                <Route path="shifts"                    element={<ShiftsPage />} />
                <Route path="holidays"                  element={<HolidaysPage />} />
                <Route path="deduction-rules"           element={<DeductionRulesPage />} />
                <Route path="advances"                  element={<EmployeeAdvancesPage />} />
                <Route path="customer-payments"         element={<CustomerPaymentsPage />} />
                <Route path="supplier-payments"         element={<SupplierPaymentsPage />} />
                <Route path="currencies"                element={<CurrenciesPage />} />
                <Route path="plans"                     element={<PlansPage />} />
                <Route path="subscriptions"             element={<SubscriptionsPage />} />
                <Route path="portal-users"              element={<PortalUsersPage />} />
                <Route path="tax-filings"               element={<TaxFilingsPage />} />
                <Route path="kpi"                       element={<KpiScorecardsPage />} />
                <Route path="scheduled-reports"         element={<ScheduledReportsPage />} />
              </Routes>
              </AdminCountryProvider>
             </AdminGate>
            </AdminAuthProvider>
          } />
        </Routes>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 64 }}>
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/catalog"         element={<CatalogPage />} />
          <Route path="/products/:slug"  element={<ProductDetailPage />} />
          <Route path="/cart"            element={<CartPage />} />
          <Route path="*"                element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
