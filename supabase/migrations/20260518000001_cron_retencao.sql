-- ============================================================
-- PONTO DIGITAL BM - CRON RETENÇÃO LGPD (pg_cron + pg_net)
-- ============================================================
-- Requer extensão pg_cron (já habilitada no Supabase Pro)
-- Requer extensão pg_net para chamadas HTTP do banco
-- ============================================================

-- Habilita pg_net se necessário
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Função que chama a Edge Function de retenção
CREATE OR REPLACE FUNCTION public.executar_retencao_lgpd()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result TEXT;
BEGIN
  PERFORM
    net.http_post(
      url := 'https://svvbfshcpetazsrgnyac.supabase.co/functions/v1/retencao-lgpd',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmJmc2hjcGV0YXpzcmdueWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NzMxNDMsImV4cCI6MjA5NDQ0OTE0M30.7cgDQjvVClYYpqaIiU7acrM2_sGKFsqmKndvcw4cyHI'
      ),
      body := '{}'::jsonb
    );
  RETURN 'OK';
END;
$$;

-- Agenda para todo domingo às 6h
SELECT cron.schedule(
  'retencao-lgpd-semanal',
  '0 6 * * 0',
  $$SELECT public.executar_retencao_lgpd()$$
);

-- Também roda na inicialização (primeira execução imediata)
SELECT public.executar_retencao_lgpd();
