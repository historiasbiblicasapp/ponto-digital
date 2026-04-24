import { useAuth } from "@/contexts/AuthContext";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Wrench, Users, ClipboardList, BarChart3, LogOut, Share2, ShoppingBag, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/vendas", icon: ClipboardList, label: "Vendas" },
  { to: "/services", icon: ShoppingCart, label: "Produtos" },
  { to: "/customers", icon: Users, label: "Clientes" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/share", icon: Share2, label: "Compartilhar" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-primary flex flex-col">
      <div className="p-4 flex items-center gap-3">
        <ShoppingCart className="w-10 h-10 text-primary-foreground" />
        <span className="text-primary-foreground font-bold text-lg">LF Vendas</span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.to
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
