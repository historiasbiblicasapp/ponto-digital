import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import AdminSidebar from "./AdminSidebar"
import DPOFooter from "./DPOFooter"
import { PAGE_PADDING } from "@/lib/design-system"

const adminPages: Record<string, string> = {
  "/admin": "Dashboard RH",
  "/admin/funcionarios": "Funcionários",
  "/admin/escalas": "Escalas",
  "/admin/relatorios": "Relatórios",
  "/admin/solicitacoes": "Solicitações",
  "/admin/ferias": "Férias",
  "/admin/auditoria": "Fiscal e Auditoria",
  "/admin/configuracoes": "Configurações",
  "/admin/lgpd": "LGPD",
}

const AdminLayout = () => {
  const location = useLocation()
  const pageTitle = Object.entries(adminPages).find(([path]) => location.pathname === path || location.pathname.startsWith(path + "/"))?.[1] || "Dashboard"

  return (
    <div className="flex min-h-screen mesh-gradient">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="header-blur px-6 py-3 flex items-center justify-between lg:pl-8">
          <motion.div
            key={pageTitle}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <h2 className="text-lg font-semibold tracking-tight">{pageTitle}</h2>
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-glass border border-glass-border">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-ping-slow" />
              <span className="text-xs text-muted-foreground">Sistema operacional</span>
            </div>
          </div>
        </header>

        {/* Content */}
          <div className={`flex-1 ${PAGE_PADDING} overflow-auto`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
        <DPOFooter />
      </main>
    </div>
  )
}

export default AdminLayout
