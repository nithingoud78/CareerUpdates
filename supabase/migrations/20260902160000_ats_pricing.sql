-- ── Add Pricing fields to ats_settings ──────────────────────────────
ALTER TABLE public.ats_settings
ADD COLUMN IF NOT EXISTS original_price integer,
ADD COLUMN IF NOT EXISTS current_price integer;

-- Set a default fallback price if none exists to avoid nulls breaking logic
UPDATE public.ats_settings SET original_price = 299, current_price = 5 WHERE original_price IS NULL;

-- ── Extend career_tool_orders ──────────────────────────────────────
ALTER TABLE public.career_tool_orders
ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'product',
ADD COLUMN IF NOT EXISTS is_consumed boolean NOT NULL DEFAULT false;

-- Since order_type is added, let's enforce a basic check constraint
ALTER TABLE public.career_tool_orders
ADD CONSTRAINT career_tool_orders_type_check CHECK (order_type IN ('template', 'pack', 'ats_check', 'product'));
