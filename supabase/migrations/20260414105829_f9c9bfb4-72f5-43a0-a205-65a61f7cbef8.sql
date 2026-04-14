CREATE TYPE public.order_status AS ENUM ('pendente', 'em_andamento', 'concluido', 'cancelado');

CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update services" ON public.services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete services" ON public.services FOR DELETE TO authenticated USING (true);

CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

CREATE TABLE public.service_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  description TEXT,
  status order_status NOT NULL DEFAULT 'pendente',
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view orders" ON public.service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert orders" ON public.service_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON public.service_orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete orders" ON public.service_orders FOR DELETE TO authenticated USING (true);

INSERT INTO public.services (name, description, cost) VALUES
  ('Manutenção de Computador', 'Diagnóstico e reparo de computadores desktop', 150.00),
  ('Manutenção de Notebook', 'Diagnóstico e reparo de notebooks', 180.00),
  ('Troca de Peças', 'Substituição de componentes de hardware', 100.00),
  ('Venda de Peças', 'Venda de componentes e periféricos', 0.00),
  ('Venda de Computador', 'Venda de computadores desktop montados', 0.00),
  ('Venda de Notebook', 'Venda de notebooks novos e seminovos', 0.00),
  ('Venda de Celular', 'Venda de celulares e smartphones', 0.00),
  ('Venda de Tablet', 'Venda de tablets', 0.00),
  ('Instalação de Windows', 'Instalação e configuração do Windows', 120.00),
  ('Instalação de Programas', 'Instalação de softwares diversos', 80.00),
  ('Programas Especiais', 'Instalação de softwares especializados', 150.00),
  ('Rede Cabeada', 'Instalação e configuração de rede cabeada', 200.00),
  ('Rede WiFi', 'Instalação e configuração de rede sem fio', 180.00),
  ('Recuperação de Dados', 'Recuperação de arquivos e dados perdidos', 250.00);