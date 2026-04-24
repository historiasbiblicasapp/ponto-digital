import { Outlet } from "react-router-dom"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, Users, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const AdminSidebar = () => {
  const { signOut } = useAuth()

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/tenants", icon: Users, label: "Clientes" },
  ]

  return (
    <aside className="w-64 min-h-screen bg-slate-800 flex flex-col">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">M</span>
        </div>
        <span className="text-white font-bold text-lg">Admin Master</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout