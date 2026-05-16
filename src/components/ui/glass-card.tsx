import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "premium" | "interactive"
  glow?: boolean
  delay?: number
}

export function GlassCard({ children, className, variant = "default", glow = false, delay = 0 }: GlassCardProps) {
  const variants = {
    default: "glass-card",
    premium: "glass-card-premium",
    interactive: "glass-card-premium cursor-pointer hover:scale-[1.01]",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        variants[variant],
        glow && "glow",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

export function StatCard({
  title, value, icon: Icon, trend, color = "primary", delay = 0, suffix = ""
}: {
  title: string
  value: string | number
  icon?: React.ElementType
  trend?: { value: number; positive: boolean }
  color?: "primary" | "green" | "amber" | "red" | "blue" | "purple"
  delay?: number
  suffix?: string
}) {
  const colorMap = {
    primary: { bg: "bg-primary/10", text: "text-primary", neon: "shadow-primary/20" },
    green: { bg: "bg-green-500/10", text: "text-green-400", neon: "shadow-green-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400", neon: "shadow-amber-500/20" },
    red: { bg: "bg-red-500/10", text: "text-red-400", neon: "shadow-red-500/20" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", neon: "shadow-blue-500/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", neon: "shadow-purple-500/20" },
  }

  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "stat-card group",
        "hover:shadow-glass-sm transition-all duration-500"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="kpi-label">{title}</p>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl transition-all duration-500 group-hover:scale-110", c.bg)}>
            <Icon className={cn("w-4.5 h-4.5", c.text)} strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className={cn("kpi-value", c.text)}>
          {value}{suffix}
        </span>
        {trend && (
          <span className={cn(
            "text-xs font-semibold mb-1 flex items-center gap-0.5",
            trend.positive ? "text-green-400" : "text-red-400"
          )}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="data-bar mt-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="data-bar-fill"
        />
      </div>
    </motion.div>
  )
}

export function LiveIndicator({ label, status = "online" }: { label: string; status?: "online" | "warning" | "offline" }) {
  const dotClass = status === "online" ? "live-dot" : status === "warning" ? "live-dot-warning" : "bg-muted-foreground/30"

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
}

export function PulseDot({ className }: { className?: string }) {
  return (
    <span className="relative inline-flex">
      <span className={cn(
        "w-2 h-2 rounded-full bg-neon-green",
        className
      )} />
      <span className={cn(
        "absolute inset-0 w-2 h-2 rounded-full bg-neon-green animate-ping-slow opacity-75",
        className
      )} />
    </span>
  )
}

export function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const display = value.toFixed(decimals)
  return (
    <motion.span
      key={display}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-value"
    >
      {display}{suffix}
    </motion.span>
  )
}

export function GaugeChart({ value, max = 100, label, color = "primary" }: { value: number; max?: number; label?: string; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100)
  const colorMap: Record<string, string> = {
    primary: "from-primary to-neon-cyan",
    green: "from-green-500 to-emerald-400",
    amber: "from-amber-500 to-yellow-400",
    red: "from-red-500 to-rose-400",
    blue: "from-blue-500 to-cyan-400",
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
          <motion.circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 0.98} 100`}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ strokeDasharray: `${percentage * 0.98} 100` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="currentColor" />
              <stop offset="100%" stopColor="currentColor" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold font-mono">{Math.round(percentage)}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  )
}
