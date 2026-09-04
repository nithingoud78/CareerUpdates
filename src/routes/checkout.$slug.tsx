import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, Mail, User, Phone, CheckCircle2, Lock, Loader2, AlertCircle, Shield, CreditCard, ChevronRight } from "lucide-react";
import { resolvePreviewImageUrl } from "@/lib/image-utils";
import { getPublishedTemplates } from "@/lib/career-tools.functions";
import { createCheckoutOrder, verifyRazorpayPayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/checkout/$slug")({
  component: CheckoutPage,
  loader: async ({ params }) => {
    // Note: getPublishedTemplates only returns published templates.
    const products = await getPublishedTemplates();
    let product: any = products.find((p) => p.slug === params.slug);
    
    if (!product) {
      // Fallback: check if it is a dMAT module (using dynamic import to avoid circular dependency if any, or just import it at top)
      const { getPublishedDmatModules } = await import("@/lib/career-tools.functions");
      const dmatModules = await getPublishedDmatModules();
      product = dmatModules.find((p) => p.slug === params.slug);
    }

    if (!product) {
      throw new Error("Product not found");
    }
    return { product };
  },
});

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const { product } = Route.useLoaderData();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    name: "",
    countryCode: "+91",
    phone: "",
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.countryCode) {
      setError("Please select your country code.");
      return;
    }
    if (form.countryCode === "+91" && form.phone.length !== 10) {
      setError("Phone number must be exactly 10 digits for India (+91).");
      return;
    }
    if (!form.phone.trim() || form.phone.length < 5) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // 1. Create order on server
      const order = await createCheckoutOrder({
        data: {
          productSlug: product.slug,
          customer: {
            email: form.email,
            fullName: form.name,
            countryCode: form.countryCode,
            phone: form.phone,
          }
        }
      });

      if ('isFree' in order && order.isFree) {
        // Bypass Razorpay entirely for free items
        router.navigate({ to: `/payment/success/${order.orderId}` });
        return;
      }

      // 2. Setup Razorpay options
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Career Updates",
        description: order.productName,
        order_id: order.rzpOrderId,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on server
            setIsProcessing(true);
            const verifyRes = await verifyRazorpayPayment({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            });

            if (verifyRes.ok) {
              router.navigate({ to: `/payment/success/${verifyRes.orderId}` });
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#2563eb", // brand-600
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      // The server will append |DEV_ERR| with technical details if applicable.
      setError(err.message || "Failed to initialize payment.");
      setIsProcessing(false);
    }
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-12 md:grid-cols-2">
        {/* LEFT: Buyer Details */}
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Complete Your Purchase</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter your details below. We need your email to send your receipt and ensure you can access your download.
            </p>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Lock className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error.split('|DEV_ERR|')[0]}
                    </h3>
                    {error.includes('|DEV_ERR|') && (
                      <details className="mt-2 text-xs text-red-700 opacity-80 cursor-pointer">
                        <summary>Payment initialization error (Dev Only)</summary>
                        <p className="mt-1 font-mono bg-red-100 p-2 rounded">{error.split('|DEV_ERR|')[1]}</p>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="w-1/3 min-w-[100px]">
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                    className="block w-full rounded-md border border-input bg-background py-2 pl-2 pr-8 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="+91">🇮🇳 India (+91)</option>
                    <option value="+1">🇺🇸 US (+1)</option>
                    <option value="+44">🇬🇧 UK (+44)</option>
                    <option value="+61">🇦🇺 AUS (+61)</option>
                    <option value="+971">🇦🇪 UAE (+971)</option>
                    <option value="+65">🇸🇬 SG (+65)</option>
                  </select>
                </div>
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    required
                    value={form.phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (form.countryCode === "+91") {
                        val = val.replace(/\D/g, "").slice(0, 10);
                      }
                      setForm({ ...form, phone: val });
                    }}
                    className="block w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder="8484153463"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-70"
            >
              {isProcessing ? "Processing..." : product.is_free ? "GET FREE ACCESS" : `PAY ₹${product.current_price} & GET ACCESS`}
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> One-time payment</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Instant access</span>
            </div>
          </form>
        </section>

        {/* RIGHT: Order Summary */}
        <section className="h-fit rounded-2xl border border-border bg-muted/20 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
          
          <div className="mt-6 flex items-start gap-4 border-b border-border pb-6">
            {product.preview_image_url ? (
              <img 
                src={resolvePreviewImageUrl(product.preview_image_url) || ""} 
                alt={product.title} 
                className="h-20 w-16 rounded border border-border object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-20 w-16 items-center justify-center rounded border border-border bg-muted">
                <span className="text-[10px] text-muted-foreground">No Preview</span>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
                {product.category || "Resume Template"}
              </p>
              <h3 className="line-clamp-2 font-bold text-foreground">{product.title}</h3>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-foreground">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Regular Price</span>
              <span className="line-through">₹{product.original_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-medium">{product.is_free ? "Free" : `₹${product.current_price}`}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-between border-t border-border pt-6">
            <span className="text-base font-bold text-foreground">TOTAL AMOUNT</span>
            <span className="text-2xl font-bold text-brand">{product.is_free ? "₹0" : `₹${product.current_price}`}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
