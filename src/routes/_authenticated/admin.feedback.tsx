import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2, Mail, MailOpen, Search } from "lucide-react";
import { listFeedback, updateFeedbackStatus, deleteFeedback } from "@/lib/feedback.functions";

export const Route = createFileRoute("/_authenticated/admin/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const list = useServerFn(listFeedback);
  const markStatus = useServerFn(updateFeedbackStatus);
  const remove = useServerFn(deleteFeedback);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => list(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Unread" | "Read" }) =>
      markStatus({ data: { id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-feedback"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-feedback"] });
      if (selected?.id === selected?.id) setSelected(null);
    },
  });

  const items = (data ?? []) as any[];
  const filtered = items.filter(
    (f) =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase())
  );

  const unreadCount = items.filter((f) => f.status === "Unread").length;

  function handleDelete(item: any) {
    if (confirm(`Delete message from "${item.name}"?`)) {
      if (selected?.id === item.id) setSelected(null);
      deleteMutation.mutate(item.id);
    }
  }

  function handleOpen(item: any) {
    setSelected(item);
    if (item.status === "Unread") {
      statusMutation.mutate({ id: item.id, status: "Read" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Feedback
            {unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-semibold text-brand-foreground">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Messages submitted via the Contact page.</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border/50">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {search ? "No messages match your search." : "No feedback received yet."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border/50 bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map((item: any) => (
                  <tr
                    key={item.id}
                    onClick={() => handleOpen(item)}
                    className={`cursor-pointer transition-colors hover:bg-muted/20 ${
                      selected?.id === item.id ? "bg-brand/5" : ""
                    } ${item.status === "Unread" ? "font-medium" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      <p className="line-clamp-1">{item.subject}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "Unread"
                            ? "bg-brand/10 text-brand"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Toggle read/unread */}
                        <button
                          title={item.status === "Unread" ? "Mark as Read" : "Mark as Unread"}
                          onClick={() =>
                            statusMutation.mutate({
                              id: item.id,
                              status: item.status === "Unread" ? "Read" : "Unread",
                            })
                          }
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                        >
                          {item.status === "Unread" ? (
                            <MailOpen className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Message viewer */}
        <div className="rounded-xl border border-border/50 bg-surface/50">
          {selected ? (
            <div className="p-5">
              <div className="mb-4 border-b border-border pb-4">
                <p className="font-semibold">{selected.subject}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  From: <span className="text-foreground">{selected.name}</span>{" "}
                  &lt;{selected.email}&gt;
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(selected.created_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {selected.message}
              </p>
              <div className="mt-5 flex gap-2">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground hover:bg-brand/90"
                >
                  Reply by Email
                </a>
                <button
                  onClick={() => handleDelete(selected)}
                  className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              Select a message to read it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
