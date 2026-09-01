-- ── Table: career_tool_orders ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_tool_orders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  product_id uuid REFERENCES public.career_tool_products(id) ON DELETE SET NULL,
  buyer_email text NOT NULL,
  buyer_name text,
  buyer_phone text,
  amount integer NOT NULL, -- Stored in paise
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created', -- 'created', 'paid', 'failed', 'cancelled', 'refunded'
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  paid_at timestamp with time zone,
  failed_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  
  CONSTRAINT career_tool_orders_pkey PRIMARY KEY (id),
  CONSTRAINT career_tool_orders_status_check CHECK (status IN ('created', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'))
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_career_tool_orders_buyer_email ON public.career_tool_orders USING btree (buyer_email);
CREATE INDEX IF NOT EXISTS idx_career_tool_orders_rzp_order ON public.career_tool_orders USING btree (razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_career_tool_orders_rzp_payment ON public.career_tool_orders USING btree (razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_career_tool_orders_status ON public.career_tool_orders USING btree (status);
CREATE INDEX IF NOT EXISTS idx_career_tool_orders_created_at ON public.career_tool_orders USING btree (created_at);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_career_tool_orders_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_tool_orders_updated_at ON public.career_tool_orders;
CREATE TRIGGER trg_career_tool_orders_updated_at
  BEFORE UPDATE ON public.career_tool_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_career_tool_orders_updated_at();

-- ── RLS: career_tool_orders ────────────────────────────────────────
ALTER TABLE public.career_tool_orders ENABLE ROW LEVEL SECURITY;

-- Admins can read all orders
CREATE POLICY "Orders are viewable by admin users"
  ON public.career_tool_orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can update all orders (if needed for refunds etc.)
CREATE POLICY "Orders are updatable by admin users"
  ON public.career_tool_orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Note: 
-- 1. Insertions are restricted completely to the server (bypasses RLS using service role key).
-- 2. Reading a specific order for the success page should be possible IF we know the order ID. 
-- For safety, we will fetch order details securely via a server function using service_role so we don't expose 
-- a public SELECT policy that could be abused to list/guess orders, or we can use a server function that requires the exact UUID.

-- ── Table: career_tool_download_events ────────────────────────────
CREATE TABLE IF NOT EXISTS public.career_tool_download_events (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  order_id uuid REFERENCES public.career_tool_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.career_tool_products(id) ON DELETE CASCADE,
  downloaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address text,
  user_agent text,
  
  CONSTRAINT career_tool_download_events_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_career_tool_dl_order_id ON public.career_tool_download_events USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_career_tool_dl_product_id ON public.career_tool_download_events USING btree (product_id);

ALTER TABLE public.career_tool_download_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Download events viewable by admin"
  ON public.career_tool_download_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
