import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import AppLayout from "@/components/AppLayout"
import AdminLayout from "@/components/AdminLayout"
import Login from "@/pages/Login"
import MasterLogin from "@/pages/MasterLogin"
import OrdersPage from "@/pages/OrdersPage"
import ServicesPage from "@/pages/ServicesPage"
import CustomersPage from "@/pages/CustomersPage"
import ReportsPage from "@/pages/ReportsPage"
import SharePage from "@/pages/SharePage"
import NotFound from "@/pages/NotFound"
import AdminDashboard from "@/pages/AdminDashboard"
import AdminTenants from "@/pages/AdminTenants"

const queryClient = new QueryClient()

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
)

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Routes>
      <Route path="/admin" element={
        user?.tenant_slug === "master" ? <Navigate to="/dashboard" replace /> : <MasterLogin />
      } />
      <Route path="/login" element={
        user ? (
          user.tenant_slug === "master" ? <Navigate to="/dashboard" replace /> : <Navigate to="/vendas" replace />
        ) : <Login />
      } />
      
      <Route path="/" element={
        user ? (
          user.tenant_slug === "master" ? <Navigate to="/dashboard" replace /> : <Navigate to="/vendas" replace />
        ) : <Navigate to="/admin" replace />
      } />

      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={user?.tenant_slug === "master" ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/tenants" element={user?.tenant_slug === "master" ? <AdminTenants /> : <Navigate to="/login" />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/vendas" element={user ? <OrdersPage /> : <Navigate to="/login" />} />
        <Route path="/services" element={user ? <ServicesPage /> : <Navigate to="/login" />} />
        <Route path="/customers" element={user ? <CustomersPage /> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <ReportsPage /> : <Navigate to="/login" />} />
        <Route path="/share" element={user ? <SharePage /> : <Navigate to="/login" />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App