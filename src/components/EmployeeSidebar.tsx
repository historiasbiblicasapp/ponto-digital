import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { Clock, History, Banknote, FileText, LogOut, Bell, Shield, Menu, X, ChevronLeft, ChevronRight, Umbrella } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { PulseDot } from "@/components/ui/glass-card"

const EmployeeSidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuth()
  const { unreadCount } = useNotifications()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  const navItems = [
    { to: "/app", icon: Clock, label: "Registrar Ponto" },
    { to: "/app/historico", icon: History, label: "Histórico" },
    { to: "/app/banco-horas", icon: Banknote, label: "Banco de Horas" },
    { to: "/app/solicitacoes", icon: FileText, label: "Solicitações" },
    { to: "/app/ferias", icon: Umbrella, label: "Férias" },
    { to: "/app/notificacoes", icon: Bell, label: "Notificações", badge: unreadCount },
    { to: "/app/lgpd", icon: Shield, label: "LGPD" },
  ]

  const sidebarContent = (
    <div className={cn(
      "h-full flex flex-col transition-all duration-500 ease-premium",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Profile */}
      <div className={cn(
        "border-b border-glass-border transition-all duration-500",
        collapsed ? "p-3 flex flex-col items-center" : "p-5"
      )}>
        <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-neon-cyan flex items-center justify-center shrink-0 shadow-neon-sm">
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
                <span className="font-bold text-sm block leading-tight">Ponto Digital</span>
                <span className="text-xs text-muted-foreground">{user?.funcionario?.matricula}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {user?.funcionario && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 p-2.5 rounded-xl bg-glass border border-glass-border"
          >
            <p className="text-sm font-medium truncate">{user.funcionario.nome}</p>
            <p className="text-xs text-muted-foreground truncate">{user.funcionario.cargo || user.funcionario.setor || ""}</p>
          </motion.div>
        )}
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
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-glass"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="employeeActiveNav"
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
                    className="flex-1 relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && item.badge ? (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center relative z-10">
                  {item.badge}
                </Badge>
              ) : null}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-glass-border space-y-0.5">
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-glass",
              collapsed && "justify-center px-2"
            )}
          >
            <AdminIcon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Admin</span>}
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          {!collapsed && <span>Sair</span>}
        </button>
        <div className={cn("flex items-center pt-2", collapsed ? "justify-center" : "justify-between px-1")}>
          <PulseDot />
          {!collapsed && <span className="text-[10px] text-muted-foreground">Online</span>}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-card border border-glass-border shadow-glass backdrop-blur-xl"
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

const AdminIcon = ({ className, strokeWidth }: any) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

export default EmployeeSidebar
