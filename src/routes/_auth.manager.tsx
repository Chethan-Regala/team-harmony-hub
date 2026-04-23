import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_auth/manager")({
  component: ManagerLayout,
});

function ManagerLayout() {
  const { loading, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const allowed = isManager || isAdmin;

  useEffect(() => {
    if (!loading && !allowed) navigate({ to: "/" });
  }, [loading, allowed, navigate]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <AppShell section="manager" />;
}
