import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Briefcase, LayoutDashboard, LogOut, Plus, Settings, Cpu, BookOpen, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!data);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading admin…</div>;
  }

  if (!isAdmin) {
    return <NeedsAdmin onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link to="/admin" className="mr-4 flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
              <Briefcase className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Career Updates · Admin</span>
          </Link>
          <AdminLink to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <AdminLink to="/admin/jobs/new" icon={Plus} label="New Job" />
          <AdminLink to="/admin/site-settings" icon={Settings} label="Site Settings" />
          <AdminLink to="/admin/settings" icon={Cpu} label="AI Settings" />
          <AdminLink to="/admin/blog" icon={BookOpen} label="Blog" />
          <AdminLink to="/admin/feedback" icon={Inbox} label="Feedback" />
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">View site →</Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

function AdminLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link
      to={to as any}
      activeProps={{ className: "bg-accent text-foreground" }}
      activeOptions={{ exact: to === "/admin" }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function NeedsAdmin({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="glass-strong max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-xl font-bold">Admin role required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account is signed in but does not have the <code className="rounded bg-muted px-1">admin</code> role.
          Ask an existing admin to grant you the role, or run this SQL in the Cloud SQL editor:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-3 text-left text-[11px]">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'your@email.com'
ON CONFLICT DO NOTHING;`}
        </pre>
        <button
          onClick={onSignOut}
          className="mt-5 rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
