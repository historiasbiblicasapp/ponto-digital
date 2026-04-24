-- Tabela de conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('store', 'customer')) NOT NULL,
  content TEXT,
  product_id UUID REFERENCES public.services(id),
  image_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);

-- RLS para conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants veem suas conversas" ON public.conversations;
CREATE POLICY "Tenants veem suas conversas" ON public.conversations
  FOR ALL TO authenticated USING (tenant_id IN (SELECT id FROM public.tenants WHERE id = tenant_id));

-- RLS para messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users veem mensagens da sua conversa" ON public.messages;
CREATE POLICY "Users veem mensagens da sua conversa" ON public.messages
  FOR ALL TO authenticated USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE tenant_id IN (SELECT id FROM public.tenants))
  );
