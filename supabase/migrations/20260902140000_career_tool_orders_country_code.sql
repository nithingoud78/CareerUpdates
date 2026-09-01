ALTER TABLE "public"."career_tool_orders" ADD COLUMN IF NOT EXISTS "country_code" TEXT;

CREATE INDEX IF NOT EXISTS "idx_career_tool_orders_razorpay_order_id" ON "public"."career_tool_orders" ("razorpay_order_id");
CREATE INDEX IF NOT EXISTS "idx_career_tool_orders_razorpay_payment_id" ON "public"."career_tool_orders" ("razorpay_payment_id");
CREATE INDEX IF NOT EXISTS "idx_career_tool_orders_status" ON "public"."career_tool_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_career_tool_orders_created_at" ON "public"."career_tool_orders" ("created_at");

-- Only add the unique constraints if they do not already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'career_tool_orders_razorpay_order_id_key') THEN
        ALTER TABLE "public"."career_tool_orders" ADD CONSTRAINT "career_tool_orders_razorpay_order_id_key" UNIQUE ("razorpay_order_id");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'career_tool_orders_razorpay_payment_id_key') THEN
        ALTER TABLE "public"."career_tool_orders" ADD CONSTRAINT "career_tool_orders_razorpay_payment_id_key" UNIQUE ("razorpay_payment_id");
    END IF;
END $$;
