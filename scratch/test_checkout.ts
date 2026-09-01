import { config } from "dotenv";
config();
import { createClient } from "@supabase/supabase-js";
import Razorpay from "razorpay";

async function run() {
  console.log("Testing Razorpay Order Creation...");
  console.log(`ENV check: ID=${!!process.env.RAZORPAY_KEY_ID}, SECRET=${!!process.env.RAZORPAY_KEY_SECRET}`);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const slug = "clean-professional-resume";
    const customer = {
      email: "test@example.com",
      fullName: "Test User",
      countryCode: "+91",
      phone: "9876543210"
    };

    console.log("1. Fetching product...");
    const { data: product, error } = await supabase
      .from("career_tool_products")
      .select("id, title, current_price, status, file_url, product_type")
      .eq("slug", slug)
      .single();

    if (error || !product) {
      console.error("Product lookup failed:", error);
      return;
    }
    console.log("Product found:", product);

    console.log("2. Calculating amount...");
    const amountPaise = Math.round(Number(product.current_price) * 100);
    console.log(`Amount: ${amountPaise} paise`);

    console.log("3. Creating Razorpay order...");
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!
    });
    
    let rzpOrder;
    try {
      rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: "INR",
        receipt: `career_${Date.now().toString().slice(-8)}`,
        notes: {
          product_id: product.id.slice(0, 40),
          email: customer.email.slice(0, 40),
        },
      });
      console.log("Razorpay Order Created:", rzpOrder.id);
    } catch (rzpErr: any) {
      console.error("RAZORPAY API ERROR:", {
        statusCode: rzpErr?.statusCode,
        error: rzpErr?.error,
        message: rzpErr?.message,
      });
      return;
    }

    console.log("4. Inserting into database...");
    const { data: order, error: orderError } = await supabase
      .from("career_tool_orders")
      .insert({
        product_id: product.id,
        buyer_email: customer.email,
        buyer_name: customer.fullName,
        country_code: customer.countryCode,
        buyer_phone: customer.phone,
        amount: amountPaise,
        currency: "INR",
        status: "created",
        razorpay_order_id: rzpOrder.id,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("DB Insert failed:", orderError);
      return;
    }
    console.log("Success! DB Order ID:", order.id);
  } catch (err: any) {
    console.error("UNEXPECTED ERROR:", err);
  }
}

run();
