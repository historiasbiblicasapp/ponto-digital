import { useState } from "react"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import {
  LayoutDashboard, Users, CalendarClock, FileText, Settings, LogOut,
  BarChart3, Building2, Clock, Scale, Shield, ChevronLeft, ChevronRight, Menu, X, Umbrella
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PulseDot } from "@/components/ui/glass-card"

const AdminSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, isMaster, company } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (e) {
      console.error("signOut error:", e)
    }
    navigate("/")
    window.location.reload()
  }

  const adminNavItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/funcionarios", icon: Users, label: "Funcionários" },
    { to: "/admin/escalas", icon: CalendarClock, label: "Escalas" },
    { to: "/admin/relatorios", icon: BarChart3, label: "Relatórios" },
    { to: "/admin/solicitacoes", icon: FileText, label: "Solicitações" },
    { to: "/admin/ferias", icon: Umbrella, label: "Férias" },
    { to: "/admin/auditoria", icon: Scale, label: "Auditoria" },
    { to: "/admin/configuracoes", icon: Settings, label: "Config" },
    { to: "/admin/lgpd", icon: Shield, label: "LGPD" },
  ]

  const masterNavItems = [
    { to: "/master", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/master/empresas", icon: Building2, label: "Empresas" },
    { to: "/master/auditoria", icon: Scale, label: "Auditoria" },
  ]

  const navItems = isMaster ? masterNavItems : adminNavItems

  const sidebarContent = (
    <div className={cn(
      "h-full flex flex-col transition-all duration-500 ease-premium",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-glass-border transition-all duration-500",
        collapsed ? "p-3 justify-center" : "p-5 gap-3"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center shrink-0 shadow-neon-sm">
          <Clock className="w-5 h-5 text-black" strokeWidth={2} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="text-white font-bold text-sm block leading-tight">Ponto Digital</span>
              {company && (
                <span className="text-slate-400 text-[10px] block truncate max-w-[120px]">
                  {company.nome_fantasia || company.name}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + "/")
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                collapsed && "justify-center px-2",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-glass"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-primary/5 rounded-xl"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 shrink-0 relative z-10" strokeWidth={1.5} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-primary"
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-glass-border space-y-0.5">
        <NavLink
          to="/app"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:text-white hover:bg-glass",
            collapsed && "justify-center px-2"
          )}
        >
          <UserIcon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Modo Funcionário</span>}
        </NavLink>
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-slate-300 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Sair</span>}
        </button>
        <div className={cn(
          "flex items-center pt-2",
          collapsed ? "justify-center" : "justify-between px-1"
        )}>
          <PulseDot />
          {!collapsed && <span className="text-[10px] text-muted-foreground">Sistema ativo</span>}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-card border border-glass-border shadow-glass"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex relative min-h-screen sidebar-glass transition-all duration-500 ease-premium",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 w-6 h-6 rounded-full bg-card border border-glass-border flex items-center justify-center shadow-glass hover:scale-110 transition-transform"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-40 w-64 sidebar-glass lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const UserIcon = ({ className, strokeWidth }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

export default AdminSidebar
