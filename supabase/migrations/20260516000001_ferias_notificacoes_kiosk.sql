-- Ferias RLS policies
CREATE POLICY "funcionarios_veem_proprias_ferias" ON public.ferias
  FOR SELECT TO authenticated
  USING (
    funcionario_id IN (
      SELECT id FROM public.funcionarios WHERE auth_user_id = auth.uid()
    )
    OR
    empresa_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE email = auth.email() AND role IN ('admin', 'master')
    )
  );

CREATE POLICY "funcionarios_solicitam_ferias" ON public.ferias
  FOR INSERT TO authenticated
  WITH CHECK (
    funcionario_id IN (
      SELECT id FROM public.funcionarios WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admin_gerencia_ferias" ON public.ferias
  FOR UPDATE TO authenticated
  USING (
    empresa_id IN (
      SELECT tenant_id FROM public.tenant_users WHERE email = auth.email() AND role IN ('admin', 'master')
    )
  );

-- Add pin column if not exists (for kiosk biometry)
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS pin TEXT;

-- Enable pg_cron for email scheduling (if extension exists)
CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;

-- Function to send notification on time registration
CREATE OR REPLACE FUNCTION public.notificar_registro_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notificacoes (empresa_id, funcionario_id, tipo, titulo, mensagem)
  VALUES (
    NEW.empresa_id,
    NEW.funcionario_id,
    'registro_ponto',
    'Registro de Ponto',
    'Registro ' || NEW.tipo || ' confirmado às ' || to_char(NEW.data_hora AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_registro_ponto_notificar ON public.registros_ponto;
CREATE TRIGGER on_registro_ponto_notificar
  AFTER INSERT ON public.registros_ponto
  FOR EACH ROW EXECUTE FUNCTION public.notificar_registro_ponto();

-- Function to notify on ferias status change
CREATE OR REPLACE FUNCTION public.notificar_status_ferias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.notificacoes (empresa_id, funcionario_id, tipo, titulo, mensagem)
  VALUES (
    NEW.empresa_id,
    NEW.funcionario_id,
    'ferias',
    CASE NEW.status
      WHEN 'concedida' THEN 'Férias Aprovadas'
      WHEN 'cancelada' THEN 'Férias Canceladas'
      ELSE 'Férias Atualizadas'
    END,
    CASE NEW.status
      WHEN 'concedida' THEN 'Suas férias de ' || NEW.dias || ' dias foram aprovadas. Período: ' || NEW.data_inicio || ' a ' || NEW.data_fim
      WHEN 'cancelada' THEN 'Suas férias foram canceladas.'
      ELSE 'Status das suas férias foi alterado para: ' || NEW.status
    END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ferias_status_change ON public.ferias;
CREATE TRIGGER on_ferias_status_change
  AFTER UPDATE OF status ON public.ferias
  FOR EACH ROW EXECUTE FUNCTION public.notificar_status_ferias();

-- View for ferias balance (30 days per year, prorated)
CREATE OR REPLACE VIEW public.view_saldo_ferias AS
SELECT
  f.id AS funcionario_id,
  f.nome,
  f.empresa_id,
  DATE_PART('year', AGE(NOW(), f.data_admissao))::INT AS anos_trabalhados,
  LEAST(30, (DATE_PART('year', AGE(NOW(), f.data_admissao)) * 30)::INT) AS dias_direito,
  COALESCE(SUM(CASE WHEN fer.status = 'concedida' THEN fer.dias ELSE 0 END), 0) AS dias_utilizados,
  COALESCE(SUM(CASE WHEN fer.status = 'agendada' THEN fer.dias ELSE 0 END), 0) AS dias_agendados,
  LEAST(30, (DATE_PART('year', AGE(NOW(), f.data_admissao)) * 30)::INT)
    - COALESCE(SUM(CASE WHEN fer.status IN ('concedida', 'agendada') THEN fer.dias ELSE 0 END), 0) AS saldo
FROM public.funcionarios f
LEFT JOIN public.ferias fer ON fer.funcionario_id = f.id
WHERE f.ativo = true
GROUP BY f.id, f.nome, f.empresa_id, f.data_admissao;

-- Grant access to authenticated users
GRANT SELECT ON public.view_saldo_ferias TO authenticated;
