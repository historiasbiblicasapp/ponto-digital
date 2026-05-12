-- ============================================================
-- PONTO DIGITAL BM - SCHEMA COMPLETO
-- Sistema de Ponto Eletrônico Online Profissional
-- ============================================================

-- 1. EMPRESAS (extensão do tenant)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cnpj TEXT UNIQUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'basico';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS limite_funcionarios INT DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 2. FILIAIS
CREATE TABLE IF NOT EXISTS filiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  latitude TEXT,
  longitude TEXT,
  raio_geofence INT DEFAULT 100,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FUNCIONARIOS
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filial_id UUID REFERENCES filiais(id) ON DELETE SET NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  matricula TEXT NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  email TEXT,
  telefone TEXT,
  cargo TEXT,
  setor TEXT,
  tipo_jornada TEXT DEFAULT 'fixa',
  carga_horaria_semanal INT DEFAULT 44,
  horas_diaria INT DEFAULT 8,
  tolerancia_minutos INT DEFAULT 10,
  senha_hash TEXT,
  pin TEXT,
  foto_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, matricula),
  UNIQUE(empresa_id, cpf)
);

-- 4. DISPOSITIVOS (tablets, totens, etc)
CREATE TABLE IF NOT EXISTS dispositivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filial_id UUID REFERENCES filiais(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'tablet',
  nome TEXT NOT NULL,
  mac_address TEXT,
  ip TEXT,
  localizacao TEXT,
  ativo BOOLEAN DEFAULT true,
  ultimo_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REGISTROS DE PONTO
CREATE TABLE IF NOT EXISTS registros_ponto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dispositivo_id UUID REFERENCES dispositivos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida_almoco', 'retorno_almoco', 'saida', 'extra_inicio', 'extra_fim')),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data DATE GENERATED ALWAYS AS (data_hora::date) STORED,
  latitude TEXT,
  longitude TEXT,
  endereco TEXT,
  selfie_url TEXT,
  reconhecimento_facial BOOLEAN DEFAULT false,
  ip TEXT,
  dispositivo_info TEXT,
  hash_integridade TEXT NOT NULL,
  sincronizado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registros_funcionario_data ON registros_ponto(funcionario_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_registros_empresa_data ON registros_ponto(empresa_id, data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_registros_data ON registros_ponto(data);

-- 6. ESCALAS / TURNOS
CREATE TABLE IF NOT EXISTS escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('5x2', '6x1', '12x36', 'turno_rotativo', 'noturno', 'flexivel', 'personalizado')),
  hora_entrada TIME NOT NULL,
  hora_saida_almoco TIME,
  hora_retorno_almoco TIME,
  hora_saida TIME NOT NULL,
  tolerancia_minutos INT DEFAULT 10,
  carga_horaria_diaria INT DEFAULT 8,
  dias_semana INT[] DEFAULT '{1,2,3,4,5}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FUNCIONARIO X ESCALA
CREATE TABLE IF NOT EXISTS funcionario_escala (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  escala_id UUID NOT NULL REFERENCES escalas(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funcionario_id, data_inicio)
);

-- 8. BANCO DE HORAS
CREATE TABLE IF NOT EXISTS banco_horas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horas_trabalhadas DECIMAL(10,2) DEFAULT 0,
  horas_previstas DECIMAL(10,2) DEFAULT 0,
  saldo DECIMAL(10,2) DEFAULT 0,
  horas_extras DECIMAL(10,2) DEFAULT 0,
  horas_debito DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(funcionario_id, data)
);

-- 9. AJUSTES / SOLICITACOES
CREATE TABLE IF NOT EXISTS ajustes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('correcao_ponto', 'justificativa_atraso', 'abono_falta', 'alteracao_escala', 'outros')),
  registro_ponto_id UUID REFERENCES registros_ponto(id) ON DELETE SET NULL,
  data_referencia DATE NOT NULL,
  justificativa TEXT NOT NULL,
  anexo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  aprovado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  observacao_rh TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  tabela_afetada TEXT,
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip TEXT,
  dispositivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_empresa ON auditoria(empresa_id, created_at DESC);

-- 11. NOTIFICACOES
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FERIAS
CREATE TABLE IF NOT EXISTS ferias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'gozo' CHECK (tipo IN ('gozo', 'abono_pecuniario', 'coletiva')),
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'concedida', 'cancelada')),
  aprovado_por UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCOES E TRIGGERS
-- ============================================================

-- Função para gerar hash de integridade
CREATE OR REPLACE FUNCTION gerar_hash_registro()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_integridade := encode(
    sha256(
      (NEW.funcionario_id::text || 
       NEW.data_hora::text || 
       COALESCE(NEW.latitude, '') || 
       COALESCE(NEW.longitude, '') ||
       NEW.tipo)::bytea
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gerar_hash ON registros_ponto;
CREATE TRIGGER trg_gerar_hash
  BEFORE INSERT ON registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION gerar_hash_registro();

-- Função para auditar alteracoes
CREATE OR REPLACE FUNCTION auditoria_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auditoria (empresa_id, auth_user_id, acao, tabela_afetada, registro_id, dados_anteriores, dados_novos)
  VALUES (
    COALESCE(NEW.empresa_id, OLD.empresa_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de auditoria para registros_ponto
DROP TRIGGER IF EXISTS trg_auditoria_registros ON registros_ponto;
CREATE TRIGGER trg_auditoria_registros
  AFTER INSERT OR UPDATE OR DELETE ON registros_ponto
  FOR EACH ROW EXECUTE FUNCTION auditoria_trigger();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_ponto ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionario_escala ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;

-- Políticas: funcionários veem apenas seus dados
CREATE POLICY funcionarios_empresa ON funcionarios
  FOR ALL USING (
    empresa_id IN (
      SELECT id FROM tenants 
      WHERE id = empresa_id
    )
  );

CREATE POLICY registros_funcionario ON registros_ponto
  FOR SELECT USING (
    funcionario_id IN (
      SELECT id FROM funcionarios WHERE auth_user_id = auth.uid()
    )
    OR
    empresa_id IN (
      SELECT tenant_id FROM tenant_users WHERE email = auth.email() AND role IN ('admin', 'master')
    )
  );

CREATE POLICY registros_insert ON registros_ponto
  FOR INSERT WITH CHECK (
    funcionario_id IN (
      SELECT id FROM funcionarios WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_banco_horas(
  p_funcionario_id UUID,
  p_data DATE
)
RETURNS TABLE(
  total_trabalhado DECIMAL,
  total_previsto DECIMAL,
  saldo_dia DECIMAL
) LANGUAGE plpgsql AS $$
DECLARE
  v_carga INT;
BEGIN
  SELECT carga_horaria_diaria INTO v_carga
  FROM escalas e
  JOIN funcionario_escala fe ON fe.escala_id = e.id
  WHERE fe.funcionario_id = p_funcionario_id
    AND fe.data_inicio <= p_data
    AND (fe.data_fim IS NULL OR fe.data_fim >= p_data)
    AND fe.ativo = true
  LIMIT 1;

  IF v_carga IS NULL THEN
    v_carga := 8;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(
      EXTRACT(EPOCH FROM (
        LEAD(data_hora) OVER (ORDER BY data_hora) - data_hora
      )) / 3600
    ), 0)::DECIMAL(10,2) as total_trabalhado,
    v_carga::DECIMAL(10,2) as total_previsto,
    (COALESCE(SUM(
      EXTRACT(EPOCH FROM (
        LEAD(data_hora) OVER (ORDER BY data_hora) - data_hora
      )) / 3600
    ), 0) - v_carga)::DECIMAL(10,2) as saldo_dia
  FROM registros_ponto
  WHERE funcionario_id = p_funcionario_id
    AND data_hora::date = p_data;
END;
$$;

-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_funcionarios_online AS
SELECT DISTINCT ON (f.id)
  f.id,
  f.nome,
  f.matricula,
  f.setor,
  f.cargo,
  fi.nome as filial_nome,
  rp.tipo as ultimo_registro,
  rp.data_hora as ultimo_registro_em,
  CASE 
    WHEN rp.tipo IN ('entrada', 'retorno_almoco', 'extra_inicio') THEN 'online'
    ELSE 'offline'
  END as status
FROM funcionarios f
LEFT JOIN filiais fi ON fi.id = f.filial_id
LEFT JOIN registros_ponto rp ON rp.id = (
  SELECT id FROM registros_ponto 
  WHERE funcionario_id = f.id 
  ORDER BY data_hora DESC 
  LIMIT 1
)
WHERE f.ativo = true;

CREATE OR REPLACE VIEW vw_resumo_diario AS
SELECT
  f.empresa_id,
  f.id as funcionario_id,
  f.nome,
  f.matricula,
  CURRENT_DATE as data,
  MIN(rp.data_hora) as primeira_marcacao,
  MAX(rp.data_hora) as ultima_marcacao,
  COUNT(rp.id) as total_marcacoes,
  SUM(CASE WHEN rp.tipo = 'entrada' THEN 1 ELSE 0 END) as qtd_entradas,
  SUM(CASE WHEN rp.tipo = 'saida' THEN 1 ELSE 0 END) as qtd_saidas
FROM funcionarios f
LEFT JOIN registros_ponto rp ON rp.funcionario_id = f.id AND rp.data_hora::date = CURRENT_DATE
WHERE f.ativo = true
GROUP BY f.empresa_id, f.id, f.nome, f.matricula;
