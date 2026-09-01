import { config } from "dotenv";
config();

import Razorpay from "razorpay";

async function run() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error("Missing keys");
    return;
  }

  const rzp = new Razorpay({ key_id, key_secret });

  try {
    const rzpOrder = await rzp.orders.create({
      amount: 2900,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        product_id: "test-product-id",
        email: "test@example.com",
      },
    });
    console.log("Success:", rzpOrder);
  } catch (error: any) {
    console.error("Razorpay Error:", error.statusCode, error.error);
  }
}

run();
