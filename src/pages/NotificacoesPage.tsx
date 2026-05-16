import { useNotifications } from "@/contexts/NotificationContext"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Clock, AlertCircle, Info, Calendar, UserCheck } from "lucide-react"
import { STACK, CARD_PADDING, TEXT, FLEX } from "@/lib/design-system"

const tipoIcon = (tipo: string) => {
  switch (tipo) {
    case "ponto": return Clock
    case "alerta": return AlertCircle
    case "info": return Info
    case "ferias": return Calendar
    case "rh": return UserCheck
    default: return Bell
  }
}

const NotificacoesPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div className={STACK.page}>
      <div className={FLEX.between}>
        <div className={FLEX.center}>
          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
          <div>
            <h1 className={TEXT.pageTitle}>Notificações</h1>
            <p className={TEXT.body}>
              {unreadCount > 0 ? `${unreadCount} não lidas` : "Todas lidas"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Marcar todas como lidas</span>
            <span className="sm:hidden">Ler todas</span>
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center text-muted-foreground">
          <Bell className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 opacity-50" />
          <p className="text-base sm:text-lg">Nenhuma notificação</p>
          <p className={TEXT.body + " mt-2"}>As notificações aparecerão aqui</p>
        </Card>
      ) : (
        <div className={STACK.tight}>
          {notifications.map((n) => {
            const Icon = tipoIcon(n.tipo)
            return (
              <Card
                key={n.id}
                className={`${CARD_PADDING.standard} cursor-pointer transition-colors hover:bg-muted/50 ${
                  !n.lida ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <div className={FLEX.start}>
                  <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${!n.lida ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${!n.lida ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={FLEX.start + " gap-2"}>
                      <p className={`font-medium text-xs sm:text-sm ${!n.lida ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.titulo}
                      </p>
                      <div className={FLEX.center + " shrink-0 ml-auto"}>
                        {!n.lida && <Badge className="bg-primary h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full p-0" />}
                        <span className={TEXT.small + " whitespace-nowrap"}>
                          {new Date(n.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    {n.mensagem && (
                      <p className={TEXT.body + " mt-0.5 line-clamp-2"}>{n.mensagem}</p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificacoesPage
