import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/contexts/AuthContext"
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
import { useAuth } from "@/contexts/AuthContext"
import { ReactNode } from "react"

const queryClient = new QueryClient()

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
)

const ProtectedRoutes = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  if (user?.tenant_slug === "master") {
    return (
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tenants" element={<AdminTenants />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OrdersPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="share" element={<SharePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const PublicRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<MasterLogin />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

const AppContent = () => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return user ? <ProtectedRoutes /> : <PublicRoutes />
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App