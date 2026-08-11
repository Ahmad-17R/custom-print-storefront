import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { AuthCallbackPage } from './customer/pages/AuthCallbackPage'
import { EditorPage } from './customer/pages/EditorPage'
import { FinalStepsPage } from './customer/pages/FinalStepsPage'
import { HomePage } from './customer/pages/HomePage'
import { CatalogPage } from './customer/pages/CatalogPage'
import { ProductDetailPage } from './customer/pages/ProductDetailPage'
import { CartPage } from './customer/pages/CartPage'
import { LoginPage } from './customer/pages/LoginPage'
import { SignupPage } from './customer/pages/SignupPage'
import { CheckoutPage } from './customer/pages/CheckoutPage'
import { OrderConfirmationPage } from './customer/pages/OrderConfirmationPage'
import { MyOrdersPage } from './customer/pages/MyOrdersPage'
import { AdminDashboard } from './admin/pages/AdminDashboard'
import { AdminProductFields } from './admin/pages/AdminProductFields'
import { OrdersPage as AdminOrdersPage } from './admin/pages/OrdersPage'
import Navbar from './shared/components/Navbar'
import Footer from './shared/components/Footer'

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
          <Route path="/editor"               element={<EditorPage />} />
          <Route path="/final-steps"          element={<FinalStepsPage />} />
          <Route path="/login"                element={<LoginPage />} />
          <Route path="/signup"               element={<SignupPage />} />
          <Route path="/auth/callback"        element={<AuthCallbackPage />} />
          <Route path="/admin"                         element={<AdminDashboard />} />
          <Route path="/admin/orders"                  element={<AdminOrdersPage />} />
          <Route path="/admin/products/:id/fields"     element={<AdminProductFields />} />
          <Route path="/checkout"                      element={<CheckoutPage />} />
          <Route path="/orders"                        element={<MyOrdersPage />} />
          <Route path="/orders/:id/confirmation"       element={<OrderConfirmationPage />} />
          <Route path="/orders/:id"                    element={<MyOrdersPage />} />
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
