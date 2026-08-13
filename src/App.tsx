import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AuthCallbackPage }    from './customer/pages/AuthCallbackPage'
import { EditorPage }          from './customer/pages/EditorPage'
import { FinalStepsPage }      from './customer/pages/FinalStepsPage'
import { HomePage }            from './customer/pages/HomePage'
import { CatalogPage }         from './customer/pages/CatalogPage'
import { ProductDetailPage }   from './customer/pages/ProductDetailPage'
import { CartPage }            from './customer/pages/CartPage'
import { LoginPage }           from './customer/pages/LoginPage'
import { SignupPage }          from './customer/pages/SignupPage'
import { CheckoutPage }        from './customer/pages/CheckoutPage'
import { OrderConfirmationPage }from './customer/pages/OrderConfirmationPage'
import { MyOrdersPage }        from './customer/pages/MyOrdersPage'

// Admin pages
import { AdminDashboard }      from './admin/pages/AdminDashboard'
import { AdminProductFields }  from './admin/pages/AdminProductFields'
import { AdminProductJobs }    from './admin/pages/AdminProductJobs'
import { ProductsPage }        from './admin/pages/ProductsPage'
import { CategoriesPage }      from './admin/pages/CategoriesPage'
import { BrandsPage }          from './admin/pages/BrandsPage'
import { OrdersPage }          from './admin/pages/OrdersPage'
import { CustomersPage }       from './admin/pages/CustomersPage'
import { SuppliersPage }       from './admin/pages/SuppliersPage'
import { StockPage }           from './admin/pages/StockPage'
import { WarehousesPage }      from './admin/pages/WarehousesPage'
import { CountriesPage }       from './admin/pages/CountriesPage'
import { QuotationsPage }      from './admin/pages/QuotationsPage'
import { SalesOrdersPage }     from './admin/pages/SalesOrdersPage'
import { SalesInvoicesPage }   from './admin/pages/SalesInvoicesPage'
import { PurchaseOrdersPage }  from './admin/pages/PurchaseOrdersPage'
import { GoodsReceiptsPage }   from './admin/pages/GoodsReceiptsPage'
import { EmployeesPage }       from './admin/pages/EmployeesPage'
import { PayrollPage }         from './admin/pages/PayrollPage'
import { ChartOfAccountsPage } from './admin/pages/ChartOfAccountsPage'
import { UsersPage }           from './admin/pages/UsersPage'
import { LeadsPage }           from './admin/pages/LeadsPage'
import { ManufacturingPage }   from './admin/pages/ManufacturingPage'
import { SettingsPage }        from './admin/pages/SettingsPage'

import { AdminCountryProvider } from './admin/context/AdminCountryContext'
import Navbar  from './shared/components/Navbar'
import Footer  from './shared/components/Footer'

const FULLSCREEN_PATHS = [
  '/editor', '/final-steps', '/login', '/signup', '/auth/callback', '/admin',
  '/checkout', '/orders',
]

function Layout() {
  const { pathname } = useLocation()
  const isFullscreen = pathname === '/' || FULLSCREEN_PATHS.some(p => pathname.startsWith(p))

  if (isFullscreen) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/"                      element={<HomePage />} />
          <Route path="/editor"                element={<EditorPage />} />
          <Route path="/final-steps"           element={<FinalStepsPage />} />
          <Route path="/login"                 element={<LoginPage />} />
          <Route path="/signup"                element={<SignupPage />} />
          <Route path="/auth/callback"         element={<AuthCallbackPage />} />
          <Route path="/checkout"              element={<CheckoutPage />} />
          <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/orders/:id"            element={<MyOrdersPage />} />
          <Route path="/orders"                element={<MyOrdersPage />} />

          {/* Admin — all routes share the country context */}
          <Route path="/admin/*" element={
            <AdminCountryProvider>
              <Routes>
                <Route path=""                          element={<AdminDashboard />} />
                <Route path="products"                  element={<ProductsPage />} />
                <Route path="products/:id/fields"       element={<AdminProductFields />} />
                <Route path="products/:id/jobs"         element={<AdminProductJobs />} />
                <Route path="categories"                element={<CategoriesPage />} />
                <Route path="brands"                    element={<BrandsPage />} />
                <Route path="orders"                    element={<OrdersPage />} />
                <Route path="customers"                 element={<CustomersPage />} />
                <Route path="suppliers"                 element={<SuppliersPage />} />
                <Route path="stock"                     element={<StockPage />} />
                <Route path="warehouses"                element={<WarehousesPage />} />
                <Route path="countries"                 element={<CountriesPage />} />
                <Route path="quotations"                element={<QuotationsPage />} />
                <Route path="sales-orders"              element={<SalesOrdersPage />} />
                <Route path="sales-invoices"            element={<SalesInvoicesPage />} />
                <Route path="purchase-orders"           element={<PurchaseOrdersPage />} />
                <Route path="goods-receipts"            element={<GoodsReceiptsPage />} />
                <Route path="employees"                 element={<EmployeesPage />} />
                <Route path="payroll"                   element={<PayrollPage />} />
                <Route path="chart-of-accounts"         element={<ChartOfAccountsPage />} />
                <Route path="users"                     element={<UsersPage />} />
                <Route path="leads"                     element={<LeadsPage />} />
                <Route path="manufacturing"             element={<ManufacturingPage />} />
                <Route path="settings"                  element={<SettingsPage />} />
              </Routes>
            </AdminCountryProvider>
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
