-- ============================================================
-- PONTO DIGITAL BM - ADDON LGPD + FISCAL + NOTIFICATIONS
-- Executar APÓS o script principal
-- ============================================================

-- ============================================================
-- 1. LGPD - CONSENTIMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consentimentos_lgpd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('termos_uso', 'privacidade', 'dados_biometricos', 'geolocalizacao', 'comunicacao')),
  aceito BOOLEAN NOT NULL DEFAULT false,
  ip TEXT,
  dispositivo_info TEXT,
  versao_termo TEXT,
  data_aceite TIMESTAMPTZ DEFAULT NOW(),
  data_revogacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consentimentos_funcionario ON public.consentimentos_lgpd(funcionario_id, tipo);

-- ============================================================
-- 2. LGPD - SOLICITACOES (direitos do titular)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lgpd_solicitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE SET NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('exclusao', 'correcao', 'exportacao', 'acesso', 'revogacao_consentimento')),
  descricao TEXT,
  dados_solicitados JSONB,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'recusado')),
  resposta TEXT,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. LGPD - POLITICA DE RETENCAO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.politica_retencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tabela TEXT NOT NULL,
  dias_retencao INT NOT NULL DEFAULT 1825,
  acao TEXT NOT NULL DEFAULT 'anonymize' CHECK (acao IN ('delete', 'anonymize', 'archive')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, tabela)
);

-- ============================================================
-- 4. ARQUIVOS FISCAIS (AFD, ACJEF, etc)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.arquivos_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('AFD', 'ACJEF', 'AEJ', 'ESPELHO', 'COMPROVANTE')),
  periodo_mes INT NOT NULL,
  periodo_ano INT NOT NULL,
  conteudo TEXT,
  hash_arquivo TEXT NOT NULL,
  formato TEXT NOT NULL DEFAULT 'txt',
  tamanho_bytes INT,
  gerado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_geracao TIMESTAMPTZ DEFAULT NOW(),
  data_envio TIMESTAMPTZ,
  lote_id UUID
);

CREATE INDEX IF NOT EXISTS idx_arquivos_fiscais_empresa ON public.arquivos_fiscais(empresa_id, tipo, periodo_ano, periodo_mes);

-- ============================================================
-- 5. NOTIFICACOES ENHANCED
-- ============================================================
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS lida_em TIMESTAMPTZ;
ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS lida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.notificacoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('push', 'email', 'whatsapp', 'sms')),
  ativo BOOLEAN DEFAULT true,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, tipo_evento, canal)
);

-- ============================================================
-- 6. COMPROVANTES DE PONTO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comprovantes_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_ponto_id UUID NOT NULL REFERENCES public.registros_ponto(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hash_comprovante TEXT NOT NULL,
  conteudo_pdf TEXT,
  enviado_email BOOLEAN DEFAULT false,
  enviado_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. RLS - NOVAS TABELAS
-- ============================================================
ALTER TABLE public.consentimentos_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.politica_retencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes_ponto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso consentimentos por tenant" ON public.consentimentos_lgpd;
CREATE POLICY "Acesso consentimentos por tenant" ON public.consentimentos_lgpd
  FOR ALL TO authenticated
  USING (
    empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email())
    OR funcionario_id IN (SELECT id FROM public.funcionarios WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Acesso lgpd solicitacoes por tenant" ON public.lgpd_solicitacoes;
CREATE POLICY "Acesso lgpd solicitacoes por tenant" ON public.lgpd_solicitacoes
  FOR ALL TO authenticated
  USING (
    empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email())
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Acesso politica retencao por tenant" ON public.politica_retencao;
CREATE POLICY "Acesso politica retencao por tenant" ON public.politica_retencao
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Acesso arquivos fiscais por tenant" ON public.arquivos_fiscais;
CREATE POLICY "Acesso arquivos fiscais por tenant" ON public.arquivos_fiscais
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Acesso notificacoes config por tenant" ON public.notificacoes_config;
CREATE POLICY "Acesso notificacoes config por tenant" ON public.notificacoes_config
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email()));

DROP POLICY IF EXISTS "Acesso comprovantes por tenant" ON public.comprovantes_ponto;
CREATE POLICY "Acesso comprovantes por tenant" ON public.comprovantes_ponto
  FOR ALL TO authenticated
  USING (
    empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email())
    OR funcionario_id IN (SELECT id FROM public.funcionarios WHERE auth_user_id = auth.uid())
  );

-- ============================================================
-- 8. FUNCAO GERAR COMPROVANTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.gerar_hash_comprovante(
  p_registro_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT encode(
    sha256((id::text || data_hora::text || tipo || COALESCE(ip, '') || funcionario_id::text)::bytea),
    'hex'
  ) INTO v_hash
  FROM public.registros_ponto
  WHERE id = p_registro_id;
  RETURN v_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. TRIGGER AUTO-GERAR COMPROVANTE
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_gerar_comprovante()
RETURNS TRIGGER AS $$
DECLARE
  v_hash TEXT;
BEGIN
  v_hash := encode(
    sha256((NEW.id::text || NEW.data_hora::text || NEW.tipo || COALESCE(NEW.ip, '') || NEW.funcionario_id::text)::bytea),
    'hex'
  );
  INSERT INTO public.comprovantes_ponto (registro_ponto_id, funcionario_id, empresa_id, hash_comprovante)
  VALUES (NEW.id, NEW.funcionario_id, NEW.empresa_id, v_hash)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_comprovante ON public.registros_ponto;
CREATE TRIGGER trg_auto_comprovante
  AFTER INSERT ON public.registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_gerar_comprovante();

-- ============================================================
-- 10. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
