-- ============================================================
-- SEED - Dados Iniciais para Teste
-- Ponto Digital BM
-- ============================================================
-- Senhas:
--   master@pontodigital.com / master123
--   admin@empresa.com      / admin123
--   joao@empresa.com       / 123456
--   maria@empresa.com      / 123456
--   carlos@empresa.com     / 123456
-- ============================================================

-- Desabilita triggers que dependem de auth context para seed via superuser
ALTER TABLE public.registros_ponto DISABLE TRIGGER trg_gerar_hash;
ALTER TABLE public.registros_ponto DISABLE TRIGGER trg_auditoria_registros;
ALTER TABLE public.registros_ponto DISABLE TRIGGER trg_auto_comprovante;

-- Remove dados de seed anterior (se existirem)
DELETE FROM public.registros_ponto WHERE hash_integridade LIKE 'seed-%';
DELETE FROM public.funcionario_escala USING public.funcionarios f
  WHERE f.id = funcionario_escala.funcionario_id AND f.email IN ('joao@empresa.com','maria@empresa.com','carlos@empresa.com');
DELETE FROM public.banco_horas USING public.funcionarios f
  WHERE f.id = banco_horas.funcionario_id AND f.email IN ('joao@empresa.com','maria@empresa.com','carlos@empresa.com');
DELETE FROM public.funcionarios WHERE email IN ('joao@empresa.com','maria@empresa.com','carlos@empresa.com');
DELETE FROM public.escalas WHERE empresa_id IN (SELECT id FROM public.tenants WHERE slug = 'empresa-teste');
DELETE FROM public.filiais WHERE empresa_id IN (SELECT id FROM public.tenants WHERE slug = 'empresa-teste');
DELETE FROM public.tenant_users WHERE email IN ('admin@empresa.com','joao@empresa.com','maria@empresa.com','carlos@empresa.com');
DELETE FROM public.tenant_users WHERE email = 'master@pontodigital.com';
DELETE FROM public.tenants WHERE slug = 'empresa-teste';

DO $$
DECLARE
  v_master_id UUID;
  v_tenant_id UUID;
  v_joao_auth_id UUID;
  v_maria_auth_id UUID;
  v_carlos_auth_id UUID;
  v_filial_matriz_id UUID;
  v_filial_filial_id UUID;
  v_escala_adm_id UUID;
  v_escala_comercial_id UUID;
  v_func_joao_id UUID;
  v_func_maria_id UUID;
  v_func_carlos_id UUID;
BEGIN

  -- ============================================================
  -- 1. MASTER (super-admin global)
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'master@pontodigital.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, email_change, phone_change, email_change_token_new, recovery_token)
    VALUES (
      gen_random_uuid(),
      'master@pontodigital.com',
      crypt('master123', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Master Admin"}',
      'authenticated', 'authenticated',
      NOW(), NOW(),
      '', '', '', ''
    )
    RETURNING id INTO v_master_id;
  ELSE
    SELECT id INTO v_master_id FROM auth.users WHERE email = 'master@pontodigital.com';
  END IF;

  -- ============================================================
  -- 2. TENANT (Empresa Teste Ltda)
  -- ============================================================
  INSERT INTO public.tenants (id, name, slug, razao_social, nome_fantasia, cnpj, email, telefone, plano, limite_funcionarios, primary_color)
  VALUES (
    gen_random_uuid(),
    'Empresa Teste Ltda',
    'empresa-teste',
    'Empresa Teste Ltda ME',
    'Empresa Teste',
    '11.222.333/0001-44',
    'contato@empresa.com',
    '(11) 99999-8888',
    'profissional',
    50,
    '#16a34a'
  )
  RETURNING id INTO v_tenant_id;

  -- 2.1. Master como tenant_user (role master)
  INSERT INTO public.tenant_users (tenant_id, email, role, active)
  VALUES (v_tenant_id, 'master@pontodigital.com', 'master', true);

  -- ============================================================
  -- 4. ADMIN DA EMPRESA
  -- ============================================================
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@empresa.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'admin@empresa.com',
      crypt('admin123', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin RH"}',
      'authenticated', 'authenticated',
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;

  INSERT INTO public.tenant_users (tenant_id, email, role, active)
  VALUES (v_tenant_id, 'admin@empresa.com', 'admin', true);

  -- ============================================================
  -- 5. FILIAIS
  -- ============================================================
  INSERT INTO public.filiais (id, empresa_id, nome, endereco, cidade, estado, latitude, longitude, raio_geofence)
  VALUES (
    gen_random_uuid(), v_tenant_id,
    'Matriz', 'Av. Paulista, 1000', 'São Paulo', 'SP', '-23.561684', '-46.656139', 200
  )
  RETURNING id INTO v_filial_matriz_id;

  INSERT INTO public.filiais (id, empresa_id, nome, endereco, cidade, estado, latitude, longitude, raio_geofence)
  VALUES (
    gen_random_uuid(), v_tenant_id,
    'Filial Centro', 'Rua Augusta, 500', 'São Paulo', 'SP', '-23.554732', '-46.654750', 150
  )
  RETURNING id INTO v_filial_filial_id;

  -- ============================================================
  -- 6. FUNCIONARIOS
  -- ============================================================
  -- Joao
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joao@empresa.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'joao@empresa.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "João Silva"}',
      'authenticated', 'authenticated',
      NOW(), NOW(),
      '', '', '', ''
    );
  END IF;

  INSERT INTO public.tenant_users (tenant_id, email, role, active)
  VALUES (v_tenant_id, 'joao@empresa.com', 'user', true);

  -- Maria
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'maria@empresa.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'maria@empresa.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Maria Souza"}',
      'authenticated', 'authenticated',
      NOW(), NOW(),
      '', '', '', ''
    )
    RETURNING id INTO v_maria_auth_id;
  ELSE
    SELECT id INTO v_maria_auth_id FROM auth.users WHERE email = 'maria@empresa.com';
  END IF;

  INSERT INTO public.tenant_users (tenant_id, email, role, active)
  VALUES (v_tenant_id, 'maria@empresa.com', 'user', true);

  -- Carlos
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlos@empresa.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'carlos@empresa.com',
      crypt('123456', gen_salt('bf')),
      NOW(), NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Carlos Oliveira"}',
      'authenticated', 'authenticated',
      NOW(), NOW(),
      '', '', '', ''
    )
    RETURNING id INTO v_carlos_auth_id;
  ELSE
    SELECT id INTO v_carlos_auth_id FROM auth.users WHERE email = 'carlos@empresa.com';
  END IF;

  INSERT INTO public.tenant_users (tenant_id, email, role, active)
  VALUES (v_tenant_id, 'carlos@empresa.com', 'user', true);

  -- Inserir funcionarios na tabela
  INSERT INTO public.funcionarios (id, empresa_id, filial_id, auth_user_id, matricula, nome, cpf, email, cargo, setor, tipo_jornada, carga_horaria_semanal, horas_diaria, tolerancia_minutos, ativo)
  VALUES (gen_random_uuid(), v_tenant_id, v_filial_matriz_id, v_joao_auth_id, 'FUNC-001', 'João Silva', '123.456.789-00', 'joao@empresa.com', 'Desenvolvedor', 'TI', 'fixa', 44, 8, 10, true);

  INSERT INTO public.funcionarios (id, empresa_id, filial_id, auth_user_id, matricula, nome, cpf, email, cargo, setor, tipo_jornada, carga_horaria_semanal, horas_diaria, tolerancia_minutos, ativo)
  VALUES (gen_random_uuid(), v_tenant_id, v_filial_matriz_id, v_maria_auth_id, 'FUNC-002', 'Maria Souza', '987.654.321-00', 'maria@empresa.com', 'Analista de RH', 'RH', 'fixa', 40, 8, 5, true);

  INSERT INTO public.funcionarios (id, empresa_id, filial_id, auth_user_id, matricula, nome, cpf, email, cargo, setor, tipo_jornada, carga_horaria_semanal, horas_diaria, tolerancia_minutos, ativo)
  VALUES (gen_random_uuid(), v_tenant_id, v_filial_filial_id, v_carlos_auth_id, 'FUNC-003', 'Carlos Oliveira', '456.789.123-00', 'carlos@empresa.com', 'Vendedor', 'Comercial', 'fixa', 44, 8, 15, true);

  SELECT id INTO v_func_joao_id FROM public.funcionarios WHERE email = 'joao@empresa.com';
  SELECT id INTO v_func_maria_id FROM public.funcionarios WHERE email = 'maria@empresa.com';
  SELECT id INTO v_func_carlos_id FROM public.funcionarios WHERE email = 'carlos@empresa.com';

  -- ============================================================
  -- 7. ESCALAS
  -- ============================================================
  INSERT INTO public.escalas (id, empresa_id, nome, tipo, hora_entrada, hora_saida_almoco, hora_retorno_almoco, hora_saida, tolerancia_minutos, carga_horaria_diaria, dias_semana)
  VALUES (
    gen_random_uuid(), v_tenant_id,
    'Administrativo - Seg a Sex', '5x2',
    '08:00', '12:00', '13:00', '18:00',
    10, 8, '{1,2,3,4,5}'
  )
  RETURNING id INTO v_escala_adm_id;

  INSERT INTO public.escalas (id, empresa_id, nome, tipo, hora_entrada, hora_saida_almoco, hora_retorno_almoco, hora_saida, tolerancia_minutos, carga_horaria_diaria, dias_semana)
  VALUES (
    gen_random_uuid(), v_tenant_id,
    'Comercial - Seg a Sab', '6x1',
    '09:00', '13:00', '14:00', '18:00',
    15, 8, '{1,2,3,4,5,6}'
  )
  RETURNING id INTO v_escala_comercial_id;

  -- ============================================================
  -- 8. FUNCIONARIO X ESCALA
  -- ============================================================
  INSERT INTO public.funcionario_escala (funcionario_id, escala_id, data_inicio, ativo)
  VALUES (v_func_joao_id, v_escala_adm_id, '2024-01-15', true);

  INSERT INTO public.funcionario_escala (funcionario_id, escala_id, data_inicio, ativo)
  VALUES (v_func_maria_id, v_escala_adm_id, '2024-03-01', true);

  INSERT INTO public.funcionario_escala (funcionario_id, escala_id, data_inicio, ativo)
  VALUES (v_func_carlos_id, v_escala_comercial_id, '2024-06-10', true);

  -- ============================================================
  -- 9. REGISTROS DE PONTO (hoje para teste)
  -- ============================================================
  INSERT INTO public.registros_ponto (funcionario_id, empresa_id, tipo, data_hora, data, hash_integridade)
  VALUES (v_func_joao_id, v_tenant_id, 'entrada', CURRENT_TIMESTAMP - INTERVAL '4 hours', CURRENT_DATE, 'seed-' || gen_random_uuid()::text);

  INSERT INTO public.registros_ponto (funcionario_id, empresa_id, tipo, data_hora, data, hash_integridade)
  VALUES (v_func_joao_id, v_tenant_id, 'saida_almoco', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_DATE, 'seed-' || gen_random_uuid()::text);

  INSERT INTO public.registros_ponto (funcionario_id, empresa_id, tipo, data_hora, data, hash_integridade)
  VALUES (v_func_joao_id, v_tenant_id, 'retorno_almoco', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_DATE, 'seed-' || gen_random_uuid()::text);

  INSERT INTO public.registros_ponto (funcionario_id, empresa_id, tipo, data_hora, data, hash_integridade)
  VALUES (v_func_maria_id, v_tenant_id, 'entrada', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_DATE, 'seed-' || gen_random_uuid()::text);

END $$;

-- Reabilita triggers
ALTER TABLE public.registros_ponto ENABLE TRIGGER trg_gerar_hash;
ALTER TABLE public.registros_ponto ENABLE TRIGGER trg_auditoria_registros;
ALTER TABLE public.registros_ponto ENABLE TRIGGER trg_auto_comprovante;

-- ============================================================
-- VERIFICACAO
-- ============================================================
SELECT 'Seed concluido com sucesso!' as status;
SELECT email, role FROM public.tenant_users ORDER BY role, email;
SELECT nome, matricula, email, cargo FROM public.funcionarios ORDER BY nome;
SELECT nome, tipo, hora_entrada, hora_saida FROM public.escalas ORDER BY nome;
