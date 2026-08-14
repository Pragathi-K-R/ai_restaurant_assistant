/**
 * Main application component.
 * Configures routing, context providers, and toast notifications.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout & Guards
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Application Pages
import DashboardSwitch from './pages/DashboardSwitch';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import FoodWaste from './pages/FoodWaste';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import Reviews from './pages/Reviews';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import KnowledgeBase from './pages/KnowledgeBase';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Dynamic redirect based on user role
import { useAuth } from './context/AuthContext';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'customer') {
    return <Navigate to="/customer/dashboard" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

function OrdersRedirect() {
  const { user } = useAuth();
  if (user?.role === 'customer') {
    return <Navigate to="/customer/orders" replace />;
  }
  return <Navigate to="/admin/orders" replace />;
}

function MenuRedirect() {
  const { user } = useAuth();
  if (user?.role === 'customer') {
    return <Navigate to="/customer/menu" replace />;
  }
  return <Navigate to="/admin/menu" replace />;
}

function ReviewsRedirect() {
  const { user } = useAuth();
  if (user?.role === 'customer') {
    return <Navigate to="/customer/reviews" replace />;
  }
  return <Navigate to="/admin/reviews" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-md)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
            },
            success: {
              iconTheme: { primary: 'var(--color-success)', secondary: 'var(--bg-elevated)' },
            },
            error: {
              iconTheme: { primary: 'var(--color-danger)', secondary: 'var(--bg-elevated)' },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Application Routes — no path on parent so all child paths are absolute */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Backward compatibility redirects */}
            <Route path="/dashboard" element={<RootRedirect />} />
            <Route path="/customer-dashboard" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/orders" element={<OrdersRedirect />} />
            <Route path="/menu" element={<MenuRedirect />} />
            <Route path="/reviews" element={<ReviewsRedirect />} />
            <Route path="/food-waste" element={<Navigate to="/admin/food-waste" replace />} />
            <Route path="/ai-assistant" element={<Navigate to="/admin/ai" replace />} />
            <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                  <Menu />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                  <Reviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/food-waste"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <FoodWaste />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai"
              element={
                <ProtectedRoute roles={['admin', 'manager', 'staff']}>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="overview" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/menu"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="menu" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/cart"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="cart" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/orders"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="orders" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/reviews"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="reviews" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute roles={['customer', 'admin', 'manager', 'staff']}>
                  <CustomerDashboard activeTab="profile" />
                </ProtectedRoute>
              }
            />

            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/profile" element={<Profile />} />


            <Route
              path="/employees"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/knowledge-base"
              element={
                <ProtectedRoute roles={['admin', 'manager']}>
                  <KnowledgeBase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
