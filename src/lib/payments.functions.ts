import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Shared service role client is imported dynamically inside handlers to avoid client bundling

// Ensure Razorpay keys exist
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    console.error("[Checkout] Razorpay credentials missing");
    throw new Error("Payment service is temporarily unavailable.");
  }
  return new Razorpay({ key_id, key_secret });
}

// ─── Shared Schemas ──────────────────────────────────────────────────────────

const CreateOrderInput = z.object({
  productSlug: z.string().min(1, "Product slug is required"),
  customer: z.object({
    email: z.string().email("Invalid email address"),
    fullName: z.string().min(1, "Full name is required"),
    countryCode: z.string().min(1, "Country code is required"),
    phone: z.string().min(1, "Phone number is required"),
  })
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
    // 1. Fetch the product using standard anonymous client for public read RLS enforcement
    const { supabase } = await import("@/integrations/supabase/client");

    // 1. Fetch the product using the slug
    console.log(`[Checkout] Initializing for slug: ${data.productSlug}`);
    
    const { data: product, error } = await supabase
      .from("career_tool_products")
      .select("id, title, current_price, status, file_url, product_type")
      .eq("slug", data.productSlug)
      .single();

    if (error || !product) {
      console.error(`[Checkout] Product not found for slug: ${data.productSlug}`);
      throw new Error("Product not found");
    }

    console.log(`[Checkout] Product found: ${product.title}, Status: ${product.status}, Price: ${product.current_price}`);

    if (product.status !== "published") {
      console.error(`[Checkout] Product is not published. Status: ${product.status}`);
      throw new Error("Product is not currently available for purchase");
    }

    if (!product.file_url && product.product_type !== 'bundle') {
        // Only reject if it's not a bundle. Bundles might have no primary file_url but rely on resources.
        throw new Error("Product file is missing. Please contact support.");
    }

    // 2. Amount in paise
    // Ensure we parse to number and round to prevent any float issues
    const amountPaise = Math.round(Number(product.current_price) * 100);
    if (amountPaise <= 0 || isNaN(amountPaise)) {
      console.error(`[Checkout] Invalid amount calculated: ${amountPaise} (from ${product.current_price})`);
      throw new Error("Invalid product price");
    }

    console.log(`[Checkout] Keys: ID=${!!process.env.RAZORPAY_KEY_ID}, SECRET=${!!process.env.RAZORPAY_KEY_SECRET}`);

    // 3. Create Razorpay order
    const rzp = getRazorpay();
    let rzpOrder;
    try {
      console.log(`[Checkout] Creating Razorpay order: ${amountPaise} paise`);
      rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `career_${Date.now().toString().slice(-8)}`,
        notes: {
          product_id: product.id.slice(0, 40), // max length safe
          email: data.customer.email.slice(0, 40),
        },
      });
      console.log(`[Checkout] Razorpay order created: ${rzpOrder.id}`);
    } catch (rzpErr: any) {
      console.error("[Checkout] Razorpay API Error:", rzpErr?.statusCode, rzpErr?.error);
      
      const devDetails = process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined
        ? `|DEV_ERR|Razorpay API Error [${rzpErr?.statusCode || 'Unknown'}]: ${rzpErr?.error?.code || 'N/A'} - ${rzpErr?.error?.description || rzpErr?.message || 'Unknown error'}`
        : "";
        
      throw new Error(`Unable to start payment. Please try again.${devDetails}`);
    }

    if (!rzpOrder || !rzpOrder.id) {
      console.error("[Checkout] Razorpay returned null or empty order ID");
      throw new Error("Unable to start payment. Please try again.");
    }

    // 4. Create local order record using the service role client (bypasses RLS)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const adminClient = supabaseAdmin;

    const { data: order, error: orderError } = await adminClient
      .from("career_tool_orders")
      .insert({
        product_id: product.id,
        buyer_email: data.customer.email,
        buyer_name: data.customer.fullName,
        country_code: data.customer.countryCode,
        buyer_phone: data.customer.phone,
        amount: amountPaise,
        currency: "INR",
        status: "created",
        razorpay_order_id: rzpOrder.id,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[Checkout] Failed to create local order record:", orderError);
      // Mark the Razorpay order as abandoned or note it in logs since local DB failed
      
      const devDetails = process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined
        ? `|DEV_ERR|Supabase DB Error: ${orderError?.code} - ${orderError?.message || orderError?.details || 'Unknown'}`
        : "";
      throw new Error(`Failed to create local order record.${devDetails}`);
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

const CreateAtsOrderInput = z.object({
  customer: z.object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    countryCode: z.string().min(1, "Country code is required"),
    phone: z.string().min(1, "Phone number is required"),
  }),
});

export const createAtsCheckoutOrder = createServerFn({ method: "POST" })
  .validator((i: unknown) => CreateAtsOrderInput.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Fetch current price from ATS settings
    const { data: atsSettings, error: atsError } = await supabaseAdmin
      .from("ats_settings")
      .select("current_price")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (atsError || !atsSettings) {
      throw new Error("Could not load ATS pricing settings");
    }

    if (atsSettings.current_price != null && atsSettings.current_price < 0) {
      throw new Error("ATS Checker is currently free");
    }

    const price = atsSettings.current_price ?? 5;
    const amountPaise = Math.round(price * 100);

    // 2. Create Razorpay order
    const rzp = getRazorpay();
    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `ats_${Date.now().toString().slice(-8)}`,
        notes: {
          email: data.customer.email.slice(0, 40),
          type: "ats_check"
        },
      });
    } catch (err: any) {
      console.error("[Checkout] Razorpay API Error:", err);
      throw new Error("Unable to start payment. Please try again.");
    }

    if (!rzpOrder || !rzpOrder.id) {
      throw new Error("Unable to start payment. Please try again.");
    }

    // 3. Create local order record
    const { data: order, error: orderError } = await supabaseAdmin
      .from("career_tool_orders")
      .insert({
        buyer_email: data.customer.email,
        buyer_name: data.customer.fullName,
        country_code: data.customer.countryCode,
        buyer_phone: data.customer.phone,
        amount: amountPaise,
        currency: "INR",
        status: "created",
        razorpay_order_id: rzpOrder.id,
        order_type: "ats_check"
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("[Checkout] Failed to create local ATS order record:", orderError);
      throw new Error("Failed to create local order record.");
    }

    return {
      orderId: order.id,
      rzpOrderId: rzpOrder.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      productName: "ATS Resume Checker",
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    // 2. Fetch the local order by Razorpay order ID to get original order details
    const { data: order, error: orderError } = await supabase
      .from("career_tool_orders")
      .select("id, status, amount")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // 3. If already paid, just return success idempotently
    if (order.status === "paid") {
      return { ok: true, orderId: order.id };
    }

    // 4. Verify payment explicitly with Razorpay server-side
    const rzp = getRazorpay();
    const payment = await rzp.payments.fetch(data.razorpay_payment_id);
    
    if (!payment) {
      throw new Error("Payment record could not be fetched from Razorpay.");
    }
    
    // Verify it belongs to the same order
    if (payment.order_id !== data.razorpay_order_id) {
      throw new Error("Payment order ID mismatch.");
    }
    
    // Verify the amount
    if (payment.amount !== order.amount) {
      throw new Error("Payment amount mismatch.");
    }
    
    // Verify currency
    if (payment.currency !== "INR") {
      throw new Error("Payment currency mismatch.");
    }
    
    // Check if it is actually captured or paid
    if (payment.status !== "captured" && payment.status !== "authorized") {
      throw new Error(`Payment is in an incomplete state: ${payment.status}`);
    }

    // 5. Update order to paid
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

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

    // Determine download filename
    let downloadName: string | boolean = true;
    if (product.download_file_name) {
      // Append original extension if not present in download_file_name
      const origExt = product.file_url.split('.').pop() || '';
      if (origExt && !product.download_file_name.endsWith(`.${origExt}`)) {
        downloadName = `${product.download_file_name}.${origExt}`;
      } else {
        downloadName = product.download_file_name;
      }
    }

    // 2. Generate signed URLs (bucket is 'career-tools')
    // View URL (no download parameter)
    const { data: viewUrlData, error: viewUrlError } = await supabase.storage
      .from("career-tools")
      .createSignedUrl(product.file_url, 60);

    // Download URL (with download parameter)
    const { data: downloadUrlData, error: downloadUrlError } = await supabase.storage
      .from("career-tools")
      .createSignedUrl(product.file_url, 60, {
        download: downloadName,
      });

    if (viewUrlError || downloadUrlError || !viewUrlData?.signedUrl || !downloadUrlData?.signedUrl) {
      console.error("[Storage] Failed to generate signed URLs:", { viewUrlError, downloadUrlError });
      throw new Error(`Download access failed (Code: STORAGE_OBJECT_NOT_FOUND, Bucket: career-tools, Path: ${product.file_url})`);
    }

    // 3. Log the download event
    await supabase.from("career_tool_download_events").insert({
      order_id: order.id,
      product_id: order.product_id,
    });

    return { 
      viewUrl: viewUrlData.signedUrl,
      downloadUrl: downloadUrlData.signedUrl
    };
  });

// ─── 4. Get Order Status ────────────────────────────────────────────────────

export const getOrderStatus = createServerFn({ method: "GET" })
  .validator((i: unknown) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
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

// ─── 5. Admin Orders ────────────────────────────────────────────────────────

export const getAdminOrders = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;

    const { data: orders, error } = await supabase
      .from("career_tool_orders")
      .select(`
        id,
        buyer_email,
        buyer_name,
        country_code,
        buyer_phone,
        amount,
        currency,
        status,
        razorpay_order_id,
        razorpay_payment_id,
        created_at,
        paid_at,
        product_id,
        career_tool_products (
          title
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Process the joined product title
    return orders.map((order) => {
      const product = Array.isArray(order.career_tool_products) 
        ? order.career_tool_products[0] 
        : order.career_tool_products;
      
      return {
        ...order,
        productTitle: product?.title || "Unknown Product"
      };
    });
  });
