import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useAuth } from "./AuthContext"

interface ThemeContextType {
  primaryColor: string
  secondaryColor: string
  appName: string
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { customization, isMasterAdmin } = useAuth()
  const [theme, setTheme] = useState<ThemeContextType>({
    primaryColor: "#16a34a",
    secondaryColor: "#22c55e",
    appName: "LF Vendas"
  })

  useEffect(() => {
    if (customization) {
      const primaryColor = customization.primary_color || "#16a34a"
      const secondaryColor = customization.secondary_color || "#22c55e"
      const appName = customization.app_name || "LF Vendas"

      setTheme({ primaryColor, secondaryColor, appName })

      const root = document.documentElement
      root.style.setProperty("--primary", hexToHsl(primaryColor))
      root.style.setProperty("--primary-foreground", "0 0% 100%")

      const r = parseInt(primaryColor.slice(1, 3), 16)
      const g = parseInt(primaryColor.slice(3, 5), 16)
      const b = parseInt(primaryColor.slice(5, 7), 16)
      root.style.setProperty("--sidebar-background", `${r} ${g} ${b}`)
    }
  }, [customization])

  if (isMasterAdmin) {
    return (
      <ThemeContext.Provider value={{ primaryColor: "#16a34a", secondaryColor: "#22c55e", appName: "LF Vendas Admin" }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}