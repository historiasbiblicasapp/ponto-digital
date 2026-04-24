import { useState, useEffect, useRef } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send } from "lucide-react"

interface Conversation {
  id: string
  customer_phone: string
  customer_name: string | null
  last_message_at: string
}

interface Message {
  id: string
  sender_type: 'store' | 'customer'
  content: string | null
  product_id: string | null
  created_at: string
  read: boolean
}

const ChatPage = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations
  useEffect(() => {
    if (!user?.tenant_id) return

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("tenant_id", user.tenant_id)
        .order("last_message_at", { ascending: false })

      if (!error && data) {
        setConversations(data)
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user?.tenant_id])

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConv) return

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConv.id)
        .order("created_at", { ascending: true })

      if (!error && data) {
        setMessages(data)
        // Scroll to bottom
        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:conversation_id=eq.${selectedConv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConv?.id])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user?.tenant_id) return

    const { error } = await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_type: 'store',
      content: newMessage,
      tenant_id: user.tenant_id
    })

    if (!error) {
      setNewMessage("")
      // Update conversation last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConv.id)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <div className="flex-1 flex items-center justify-center">Carregando...</div>

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Conversations list */}
      <div className="w-1/3 border-r bg-white overflow-y-auto">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Conversas</h2>
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Nenhuma conversa ainda</div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedConv?.id === conv.id ? 'bg-blue-50' : ''}`}
            >
              <div className="font-semibold">{conv.customer_name || conv.customer_phone}</div>
              <div className="text-sm text-gray-500">{conv.customer_phone}</div>
              <div className="text-xs text-gray-400">{formatTime(conv.last_message_at)}</div>
            </div>
          ))
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 border-b bg-white">
              <h3 className="font-bold">{selectedConv.customer_name || selectedConv.customer_phone}</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'store' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender_type === 'store'
                        ? 'bg-green-500 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <div className={`text-xs mt-1 ${msg.sender_type === 'store' ? 'text-green-100' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite uma mensagem..."
                className="flex-1"
              />
              <Button onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage