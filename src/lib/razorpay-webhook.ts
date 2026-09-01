import crypto from "crypto";
// Removed getAdminSupabase import

export async function handleRazorpayWebhook(request: Request): Promise<Response> {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payment = payload.payload.payment?.entity;
    const order = payload.payload.order?.entity;
    
    // Fallback to whichever entity holds the order_id
    const razorpayOrderId = payment?.order_id || order?.id;

    if (!razorpayOrderId) {
      return new Response(JSON.stringify({ error: "No order ID in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    // 1. Fetch our internal order
    const { data: internalOrder, error: orderError } = await supabase
      .from("career_tool_orders")
      .select("id, status")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();

    if (orderError || !internalOrder) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // If order is already paid, webhooks are idempotent
    if (internalOrder.status === "paid") {
      return new Response(JSON.stringify({ status: "ok", message: "Already processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Handle payment events
    if (event === "payment.captured" || event === "order.paid") {
      const { error: updateError } = await supabase
        .from("career_tool_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          razorpay_payment_id: payment?.id || null,
        })
        .eq("id", internalOrder.id);

      if (updateError) throw updateError;

    } else if (event === "payment.failed") {
      const { error: updateError } = await supabase
        .from("career_tool_orders")
        .update({
          status: "failed",
          razorpay_payment_id: payment?.id || null,
        })
        .eq("id", internalOrder.id);

      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
