-- ================================================
-- SISTEMA MULTI-TENANT LF VENDAS
-- Execute este script no SQL Editor do Supabase
-- ================================================

-- 1. Tabela de Tenants (Clientes/Lojas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  max_sessions INTEGER DEFAULT 2,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#16a34a',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- 3. Tabela de Customização por Tenant
CREATE TABLE IF NOT EXISTS public.tenant_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#16a34a',
  secondary_color TEXT DEFAULT '#22c55e',
  app_name TEXT DEFAULT 'LF Vendas',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Adicionar tenant_id nas tabelas existentes (se não existir)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.user_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 5. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_tenant ON public.service_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);

-- 6. Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS para tenants
DROP POLICY IF EXISTS "Admin master pode ver todos tenants" ON public.tenants;
CREATE POLICY "Admin master pode ver todos tenants" ON public.tenants
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin master pode inserir tenants" ON public.tenants;
CREATE POLICY "Admin master pode inserir tenants" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin master pode atualizar tenants" ON public.tenants;
CREATE POLICY "Admin master pode atualizar tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin master pode deletar tenants" ON public.tenants;
CREATE POLICY "Admin master pode deletar tenants" ON public.tenants
  FOR DELETE TO authenticated USING (true);

-- 8. Políticas para tenant_users
DROP POLICY IF EXISTS "Usuários podem ver usuários do mesmo tenant" ON public.tenant_users;
CREATE POLICY "Usuários podem ver usuários do mesmo tenant" ON public.tenant_users
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin master pode gerenciar usuários" ON public.tenant_users;
CREATE POLICY "Admin master pode gerenciar usuários" ON public.tenant_users
  FOR ALL TO authenticated USING (true);

-- 9. Políticas para customizações
DROP POLICY IF EXISTS "Todos veem customizações" ON public.tenant_customizations;
CREATE POLICY "Todos veem customizações" ON public.tenant_customizations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin master gerencia customizações" ON public.tenant_customizations;
CREATE POLICY "Admin master gerencia customizações" ON public.tenant_customizations
  FOR ALL TO authenticated USING (true);

-- 10. Políticas para tabelas com tenant_id
DROP POLICY IF EXISTS "Usuários veem dados do próprio tenant" ON public.services;
CREATE POLICY "Usuários veem dados do próprio tenant" ON public.services
  FOR SELECT TO authenticated USING (tenant_id IS NOT NULL);

DROP POLICY IF EXISTS "Usuários gerenciam dados do próprio tenant" ON public.services;
CREATE POLICY "Usuários gerenciam dados do próprio tenant" ON public.services
  FOR ALL TO authenticated USING (tenant_id IS NOT NULL);

DROP POLICY IF EXISTS "Usuários veem clientes do próprio tenant" ON public.customers;
CREATE POLICY "Usuários veem clientes do próprio tenant" ON public.customers
  FOR SELECT TO authenticated USING (tenant_id IS NOT NULL);

DROP POLICY IF EXISTS "Usuários gerenciam clientes do próprio tenant" ON public.customers;
CREATE POLICY "Usuários gerenciam clientes do próprio tenant" ON public.customers
  FOR ALL TO authenticated USING (tenant_id IS NOT NULL);

DROP POLICY IF EXISTS "Usuários veem vendas do próprio tenant" ON public.service_orders;
CREATE POLICY "Usuários veem vendas do próprio tenant" ON public.service_orders
  FOR SELECT TO authenticated USING (tenant_id IS NOT NULL);

DROP POLICY IF EXISTS "Usuários gerenciam vendas do próprio tenant" ON public.service_orders;
CREATE POLICY "Usuários gerenciam vendas do próprio tenant" ON public.service_orders
  FOR ALL TO authenticated USING (tenant_id IS NOT NULL);

-- 11. Inserir Tenant de Exemplo
INSERT INTO public.tenants (name, slug, active, max_sessions, primary_color) 
VALUES ('Loja Exemplo', 'loja-exemplo', true, 2, '#16a34a')
ON CONFLICT (slug) DO NOTHING;

-- 12. Customização padrão para loja exemplo
INSERT INTO public.tenant_customizations (tenant_id, app_name, primary_color) 
SELECT id, 'LF Vendas', primary_color FROM public.tenants WHERE slug = 'loja-exemplo'
ON CONFLICT (tenant_id) DO NOTHING;

-- 13. Criar usuário Admin Master (você pode mudar email/senha depois)
-- Email: master@lfvendas.com
-- Senha: Master@2026
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id)
VALUES (
  gen_random_uuid(),
  'master@lfvendas.com',
  crypt('Master@2026', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  (SELECT id FROM auth.instances ORDER BY created_at LIMIT 1)
)
ON CONFLICT (email) DO NOTHING;

-- 14. Função para criar usuário de tenant via API
CREATE OR REPLACE FUNCTION public.create_tenant_user(
  p_tenant_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_role TEXT DEFAULT 'user'
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Criar usuário no auth
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, instance_id)
  VALUES (
    gen_random_uuid(),
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    (SELECT id FROM auth.instances ORDER BY created_at LIMIT 1)
  ) RETURNING id INTO v_auth_user_id;

  -- Criar vínculo na tabela tenant_users
  INSERT INTO public.tenant_users (tenant_id, email, role)
  VALUES (p_tenant_id, p_email, p_role)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Habilitar a função para anon (necessário para API)
GRANT EXECUTE ON FUNCTION public.create_tenant_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tenant_user TO anon;

-- 16. Permitir que anon também acesse certain tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.tenants TO anon;
GRANT SELECT ON public.tenant_customizations TO anon;