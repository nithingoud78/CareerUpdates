import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Service role client to bypass RLS securely on server
function getAdminSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key);
}

// Ensure Razorpay keys exist
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay configuration is missing.");
  }
  return new Razorpay({ key_id, key_secret });
}

// ─── Shared Schemas ──────────────────────────────────────────────────────────

const CreateOrderInput = z.object({
  slug: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

const VerifyPaymentInput = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// ─── 1. Create Checkout Order ───────────────────────────────────────────────

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .validator((i: unknown) => CreateOrderInput.parse(i))
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();

    // 1. Fetch the product using the slug
    const { data: product, error } = await supabase
      .from("career_tool_products")
      .select("id, title, current_price, status, file_url, product_type")
      .eq("slug", data.slug)
      .single();

    if (error || !product) {
      throw new Error("Product not found");
    }

    if (product.status !== "published") {
      throw new Error("Product is not currently available for purchase");
    }

    if (!product.file_url && product.product_type !== 'bundle') {
        // Only reject if it's not a bundle. Bundles might have no primary file_url but rely on resources.
        throw new Error("Product file is missing. Please contact support.");
    }

    // 2. Amount in paise
    const amountPaise = product.current_price * 100;
    if (amountPaise <= 0) {
      throw new Error("Invalid product price");
    }

    // 3. Create Razorpay order
    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        product_id: product.id,
        email: data.email,
      },
    });

    if (!rzpOrder || !rzpOrder.id) {
      throw new Error("Failed to initialize payment gateway");
    }

    // 4. Create local order record
    const { data: order, error: orderError } = await supabase
      .from("career_tool_orders")
      .insert({
        product_id: product.id,
        buyer_email: data.email,
        buyer_name: data.name || null,
        buyer_phone: data.phone || null,
        amount: amountPaise,
        currency: "INR",
        status: "created",
        razorpay_order_id: rzpOrder.id,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error("Failed to create local order record");
    }

    return {
      orderId: order.id,
      rzpOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID, // Safe to send to frontend checkout
      productName: product.title,
    };
  });

// ─── 2. Verify Payment (Frontend Callback) ──────────────────────────────────

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator((i: unknown) => VerifyPaymentInput.parse(i))
  .handler(async ({ data }) => {
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new Error("Server configuration error");

    // 1. Verify signature
    const text = `${data.razorpay_order_id}|${data.razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(text)
      .digest("hex");

    if (generated_signature !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const supabase = getAdminSupabase();

    // 2. Fetch the local order
    const { data: order, error: orderError } = await supabase
      .from("career_tool_orders")
      .select("id, status")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // 3. If already paid, just return success
    if (order.status === "paid") {
      return { ok: true, orderId: order.id };
    }

    // 4. Update order to paid
    const { error: updateError } = await supabase
      .from("career_tool_orders")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      throw new Error("Failed to update order status");
    }

    return { ok: true, orderId: order.id };
  });

// ─── 3. Get Secure Download URL ─────────────────────────────────────────────

export const getPaidOrderDownloadUrl = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();

    // 1. Fetch the order and join product details
    const { data: order, error: orderError } = await supabase
      .from("career_tool_orders")
      .select(`
        id, 
        status, 
        product_id,
        career_tool_products (
          file_url,
          download_file_name,
          title
        )
      `)
      .eq("id", data.orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    if (order.status !== "paid") {
      throw new Error("Payment is not complete for this order.");
    }

    const product = order.career_tool_products;
    if (!product || !product.file_url) {
      throw new Error("No downloadable file associated with this product.");
    }

    // 2. Generate signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from("career_tools")
      .createSignedUrl(product.file_url, 60, {
        download: product.download_file_name || true,
      });

    if (urlError || !urlData?.signedUrl) {
      throw new Error("Failed to generate secure download link.");
    }

    // 3. Log the download event
    await supabase.from("career_tool_download_events").insert({
      order_id: order.id,
      product_id: order.product_id,
    });

    return { url: urlData.signedUrl };
  });

// ─── 4. Get Order Status ────────────────────────────────────────────────────

export const getOrderStatus = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const supabase = getAdminSupabase();
    // Use maybeSingle and explicitly select the join
    const { data: order, error } = await supabase
      .from("career_tool_orders")
      .select(`
        id, status, amount, buyer_email, created_at,
        product:career_tool_products (title, preview_image_url)
      `)
      .eq("id", data.orderId)
      .maybeSingle();

    if (error || !order) {
      throw new Error("Order not found");
    }

    // Normalizing the joined data since Supabase returns it as an array if not careful, but it's an object here
    // Wait, career_tool_orders.product_id is an FK to career_tool_products.id, so it's a 1-to-1 relationship from the order's perspective.
    const product = Array.isArray(order.product) ? order.product[0] : order.product;

    return {
      ...order,
      productTitle: product?.title || "Unknown Product",
      productImage: product?.preview_image_url || null,
    };
  });
