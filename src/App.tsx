import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import { LGPDProvider, useLGPD } from "@/contexts/LGPDContext"

import { FeriasProvider } from "@/contexts/FeriasContext"
import EmployeeLayout from "@/components/EmployeeLayout"
import AdminLayout from "@/components/AdminLayout"

import CompanyLogin from "@/pages/CompanyLogin"
import MasterLogin from "@/pages/MasterLogin"
import KioskPage from "@/pages/KioskPage"

import EmployeeDashboard from "@/pages/EmployeeDashboard"
import TimeHistory from "@/pages/TimeHistory"
import BankHours from "@/pages/BankHours"
import TimeRequests from "@/pages/TimeRequests"
import NotificacoesPage from "@/pages/NotificacoesPage"
import LGPDConsent from "@/pages/LGPDConsent"
import LGPDMeusDados from "@/pages/LGPDMeusDados"
import EmployeeFerias from "@/pages/EmployeeFerias"
import AdminFerias from "@/pages/AdminFerias"

import AdminDashboard from "@/pages/AdminDashboard"
import AdminEmployees from "@/pages/AdminEmployees"
import AdminSchedules from "@/pages/AdminSchedules"
import AdminReports from "@/pages/AdminReports"
import AdminSettings from "@/pages/AdminSettings"
import AdminTimeRequests from "@/pages/AdminTimeRequests"
import FiscalAuditoria from "@/pages/FiscalAuditoria"
import AdminOcorrencias from "@/pages/AdminOcorrencias"
import AdminLGPD from "@/pages/AdminLGPD"

import MasterDashboard from "@/pages/MasterDashboard"
import MasterTenants from "@/pages/MasterTenants"

import NotFound from "@/pages/NotFound"
import CookieConsent from "@/components/CookieConsent"

const queryClient = new QueryClient()

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-muted-foreground font-medium">Carregando...</p>
    </div>
  </div>
)

const LGPDGuard = ({ children }: { children: React.ReactNode }) => {
  const { precisaConsentir, precisaReconsentir, loading } = useLGPD()
  const { user } = useAuth()

  if (loading) return <LoadingScreen />
  if ((precisaConsentir || precisaReconsentir) && user?.role === "user") {
    return <Navigate to="/app/lgpd-consentimento" replace />
  }
  return <>{children}</>
}

const AppRoutes = () => {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) {
    return (
      <Routes>
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/admin" element={<MasterLogin />} />
        <Route path="/master" element={<MasterLogin />} />
        <Route path="*" element={<CompanyLogin />} />
      </Routes>
    )
  }

  if (user.role === "master") {
    return (
      <Routes>
        <Route path="/master" element={<AdminLayout />}>
          <Route index element={<MasterDashboard />} />
          <Route path="empresas" element={<MasterTenants />} />
          <Route path="auditoria" element={<FiscalAuditoria />} />
        </Route>
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="*" element={<Navigate to="/master" replace />} />
      </Routes>
    )
  }

  if (user.role === "admin" && user.tenant_slug !== "master") {
    return (
      <LGPDProvider>
        <FeriasProvider>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="funcionarios" element={<AdminEmployees />} />
            <Route path="escalas" element={<AdminSchedules />} />
            <Route path="relatorios" element={<AdminReports />} />
            <Route path="solicitacoes" element={<AdminTimeRequests />} />
            <Route path="ocorrencias" element={<AdminOcorrencias />} />
            <Route path="ferias" element={<AdminFerias />} />
            <Route path="auditoria" element={<FiscalAuditoria />} />
            <Route path="configuracoes" element={<AdminSettings />} />
            <Route path="lgpd" element={<AdminLGPD />} />
          </Route>
          <Route path="/app" element={<EmployeeLayout />}>
            <Route index element={<LGPDGuard><EmployeeDashboard /></LGPDGuard>} />
            <Route path="historico" element={<LGPDGuard><TimeHistory /></LGPDGuard>} />
            <Route path="banco-horas" element={<LGPDGuard><BankHours /></LGPDGuard>} />
            <Route path="solicitacoes" element={<LGPDGuard><TimeRequests /></LGPDGuard>} />
            <Route path="ferias" element={<LGPDGuard><EmployeeFerias /></LGPDGuard>} />
            <Route path="notificacoes" element={<LGPDGuard><NotificacoesPage /></LGPDGuard>} />
            <Route path="lgpd" element={<LGPDGuard><LGPDMeusDados /></LGPDGuard>} />
            <Route path="lgpd-consentimento" element={<LGPDConsent />} />
          </Route>
          <Route path="/kiosk" element={<KioskPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
        </FeriasProvider>
      </LGPDProvider>
    )
  }

  return (
    <LGPDProvider>
      <FeriasProvider>
      <Routes>
        <Route path="/app" element={<EmployeeLayout />}>
          <Route index element={<LGPDGuard><EmployeeDashboard /></LGPDGuard>} />
          <Route path="historico" element={<LGPDGuard><TimeHistory /></LGPDGuard>} />
          <Route path="banco-horas" element={<LGPDGuard><BankHours /></LGPDGuard>} />
          <Route path="solicitacoes" element={<LGPDGuard><TimeRequests /></LGPDGuard>} />
          <Route path="ferias" element={<LGPDGuard><EmployeeFerias /></LGPDGuard>} />
          <Route path="notificacoes" element={<LGPDGuard><NotificacoesPage /></LGPDGuard>} />
          <Route path="lgpd" element={<LGPDGuard><LGPDMeusDados /></LGPDGuard>} />
          <Route path="lgpd-consentimento" element={<LGPDConsent />} />
        </Route>
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      </FeriasProvider>
    </LGPDProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <BrowserRouter future={{ v7_relativeSplatPath: true }}>
              <CookieConsent />
              <AppRoutes />
            </BrowserRouter>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
