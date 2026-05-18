-- Allow anonymous users to see active tenants (for login page)
DROP POLICY IF EXISTS "Todos veem tenants" ON public.tenants;
CREATE POLICY "Todos veem tenants ativos" ON public.tenants
  FOR SELECT
  USING (active = true);

-- Allow anonymous users to see tenant_users (for auth flow)
DROP POLICY IF EXISTS "Usuários veem users do mesmo tenant" ON public.tenant_users;
CREATE POLICY "Todos veem tenant_users" ON public.tenant_users
  FOR SELECT
  USING (true);
