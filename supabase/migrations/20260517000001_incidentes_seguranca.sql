-- ============================================================
-- PONTO DIGITAL BM - INCIDENTES DE SEGURANÇA (Art. 48 LGPD)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.incidentes_seguranca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_identificacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_comunicacao_anpd TIMESTAMPTZ,
  data_comunicacao_titulares TIMESTAMPTZ,
  natureza TEXT NOT NULL CHECK (natureza IN ('vazamento', 'acesso_nao_autorizado', 'perda', 'roubo', 'outro')),
  dados_afetados TEXT,
  titulares_afetados INT DEFAULT 0,
  medidas_corretivas TEXT,
  status TEXT NOT NULL DEFAULT 'identificado' CHECK (status IN ('identificado', 'investigando', 'comunicado_anpd', 'comunicado_titulares', 'resolvido')),
  notificado_anpd BOOLEAN DEFAULT false,
  notificado_titulares BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidentes_empresa ON public.incidentes_seguranca(empresa_id, status);

ALTER TABLE public.incidentes_seguranca ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso incidentes por tenant" ON public.incidentes_seguranca;
CREATE POLICY "Acesso incidentes por tenant" ON public.incidentes_seguranca
  FOR ALL TO authenticated
  USING (empresa_id IN (SELECT tenant_id FROM public.tenant_users WHERE email = auth.email()));

GRANT SELECT, INSERT, UPDATE ON public.incidentes_seguranca TO authenticated;
