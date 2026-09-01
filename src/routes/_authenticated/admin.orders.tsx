import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Download
} from "lucide-react";
import { getAdminOrders } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const getOrders = useServerFn(getAdminOrders);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "created" | "failed">("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getOrders(),
  });

  const filteredOrders = (orders || []).filter((order) => {
    // Status filter
    if (filter !== "all" && order.status !== filter) return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      return (
        order.buyer_email?.toLowerCase().includes(q) ||
        order.buyer_name?.toLowerCase().includes(q) ||
        order.productTitle?.toLowerCase().includes(q) ||
        order.razorpay_order_id?.toLowerCase().includes(q) ||
        order.razorpay_payment_id?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders & Payments</h1>
        <p className="mt-2 text-muted-foreground">
          View all purchases, payment statuses, and transaction details.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, order ID..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-md border border-input bg-background py-2 pl-3 pr-8 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid</option>
            <option value="created">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Razorpay IDs</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{order.buyer_name || "Guest"}</div>
                      <div className="text-xs text-muted-foreground">{order.buyer_email}</div>
                      {order.buyer_phone && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {order.country_code} {order.buyer_phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px] truncate font-medium text-foreground" title={order.productTitle}>
                        {order.productTitle}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {order.id.split("-")[0]}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">₹{(order.amount / 100).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground uppercase">{order.currency}</div>
                    </td>
                    <td className="px-4 py-3">
                      {order.status === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Paid
                        </span>
                      ) : order.status === "failed" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground space-y-1">
                      {order.razorpay_order_id && (
                        <div className="truncate max-w-[150px]" title={order.razorpay_order_id}>
                          O: {order.razorpay_order_id}
                        </div>
                      )}
                      {order.razorpay_payment_id && (
                        <div className="truncate max-w-[150px]" title={order.razorpay_payment_id}>
                          P: {order.razorpay_payment_id}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString()}
                      <div className="mt-0.5">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
