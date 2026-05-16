import { useEffect, useRef, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

interface UseRealtimeOptions {
  table: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  filter?: string
  onPayload?: (payload: any) => void
  enabled?: boolean
}

export function useRealtime<T = any>(options: UseRealtimeOptions) {
  const { table, event = "*", filter, onPayload, enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const handlerRef = useRef(onPayload)
  handlerRef.current = onPayload

  useEffect(() => {
    if (!enabled) return

    const channelConfig: any = {
      event,
      schema: "public",
      table,
    }
    if (filter) channelConfig.filter = filter

    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on("postgres_changes", channelConfig, (payload) => {
        setData(payload.new as T)
        handlerRef.current?.(payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, event, filter, enabled])

  return { data }
}

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return online
}

export function useDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}
