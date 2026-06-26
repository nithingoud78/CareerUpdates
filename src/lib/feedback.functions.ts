import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

// ─── Public: Submit Feedback ──────────────────────────────────────────────────

const FeedbackInput = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type FeedbackInputType = z.infer<typeof FeedbackInput>;

export const submitFeedback = createServerFn({ method: "POST" })
  .validator((data: FeedbackInputType) => FeedbackInput.parse(data))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("feedback").insert({
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      status: "Unread",
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Admin: List Feedback ────────────────────────────────────────────────────

export const listFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("feedback")
      .select("id, name, email, subject, message, status, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Admin: Count Unread ──────────────────────────────────────────────────────

export const getUnreadFeedbackCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { count, error } = await context.supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "Unread");

    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });

// ─── Admin: Update Status ─────────────────────────────────────────────────────

export const updateFeedbackStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string; status: "Unread" | "Read" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["Unread", "Read"]) }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("feedback")
      .update({ status: data.status })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Admin: Delete ────────────────────────────────────────────────────────────

export const deleteFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("feedback").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
