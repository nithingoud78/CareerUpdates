import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Download, ExternalLink, RefreshCw } from "lucide-react";
import { getOrderStatus, getPaidOrderDownloadUrl } from "@/lib/payments.functions";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/payment/success/$orderId")({
  component: PaymentSuccessPage,
  loader: async ({ params }) => {
    const order = await getOrderStatus({ data: { orderId: params.orderId } });
    return { order };
  },
});

function PaymentSuccessPage() {
  const { order } = Route.useLoaderData();
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [isPreparingView, setIsPreparingView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-download removed as per requirement

  const handleDownload = async (isAuto = false) => {
    if (isPreparingDownload) return;
    setIsPreparingDownload(true);
    setError(null);
    try {
      const res = await getPaidOrderDownloadUrl({ data: { orderId: order.id } });
      if (res.downloadUrl) {
        // Trigger download
        const a = document.createElement("a");
        a.href = res.downloadUrl;
        // The signed url is returned with download parameter, so clicking it triggers download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (!isAuto) {
        setError("Unable to prepare the download. Please try again.");
      }
    } finally {
      setIsPreparingDownload(false);
    }
  };

  const handleViewFile = async () => {
    if (isPreparingView) return;
    setIsPreparingView(true);
    setError(null);
    try {
      const res = await getPaidOrderDownloadUrl({ data: { orderId: order.id } });
      if (res.viewUrl) {
        // Open in new tab for viewing
        window.open(res.viewUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      setError("Unable to open the file. Please try again.");
    } finally {
      setIsPreparingView(false);
    }
  };

  if (order.status !== "paid") {
    return (
      <main className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
          <RefreshCw className="h-10 w-10 animate-spin text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Payment Processing</h1>
        <p className="mt-4 text-muted-foreground">
          We are currently verifying your payment (Status: {order.status}). Please check back in a moment or refresh the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 rounded-full border border-border bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Refresh Status
        </button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="glass overflow-hidden rounded-3xl border border-border bg-background shadow-sm">
        <div className="bg-emerald-50 px-8 py-10 text-center dark:bg-emerald-950/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">Payment Successful!</h1>
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-border pb-4">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs">{order.id}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-4">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium text-foreground text-right max-w-[60%]">{order.productTitle}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-4">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-medium text-foreground">₹{order.amount / 100}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Buyer Email</span>
              <span className="font-medium text-foreground">{order.buyer_email}</span>
            </div>
          </div>
          
          {error && (
            <div className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                window.open("https://omg10.com/4/11702415", "_blank");
                handleDownload(false);
              }}
              disabled={isPreparingDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
            >
              <Download className="h-4 w-4" />
              {isPreparingDownload ? "Preparing..." : "Download File"}
            </button>
            <button
              onClick={handleViewFile}
              disabled={isPreparingView}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background py-3 text-sm font-medium text-foreground shadow-sm transition-transform hover:bg-accent disabled:opacity-70"
            >
              <ExternalLink className="h-4 w-4" />
              {isPreparingView ? "Preparing..." : "View File"}
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            A secure download link has been generated for your purchase.
          </p>
        </div>
      </div>
    </main>
  );
}
