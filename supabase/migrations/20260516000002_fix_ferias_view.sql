-- Add data_admissao column to funcionarios
ALTER TABLE public.funcionarios ADD COLUMN IF NOT EXISTS data_admissao DATE DEFAULT CURRENT_DATE;

-- Fix the ferias saldo view (handle null data_admissao)
DROP VIEW IF EXISTS public.view_saldo_ferias;

CREATE OR REPLACE VIEW public.view_saldo_ferias AS
SELECT
  f.id AS funcionario_id,
  f.nome,
  f.empresa_id,
  GREATEST(0, DATE_PART('year', AGE(NOW(), COALESCE(f.data_admissao, NOW()))))::INT AS anos_trabalhados,
  GREATEST(0, LEAST(30, (DATE_PART('year', AGE(NOW(), COALESCE(f.data_admissao, NOW()))) * 30)::INT)) AS dias_direito,
  COALESCE(SUM(CASE WHEN fer.status = 'concedida' THEN fer.dias ELSE 0 END), 0) AS dias_utilizados,
  COALESCE(SUM(CASE WHEN fer.status = 'agendada' THEN fer.dias ELSE 0 END), 0) AS dias_agendados,
  GREATEST(0, LEAST(30, (DATE_PART('year', AGE(NOW(), COALESCE(f.data_admissao, NOW()))) * 30)::INT)
    - COALESCE(SUM(CASE WHEN fer.status IN ('concedida', 'agendada') THEN fer.dias ELSE 0 END), 0)) AS saldo
FROM public.funcionarios f
LEFT JOIN public.ferias fer ON fer.funcionario_id = f.id
WHERE f.ativo = true
GROUP BY f.id, f.nome, f.empresa_id, f.data_admissao;

GRANT SELECT ON public.view_saldo_ferias TO authenticated;
