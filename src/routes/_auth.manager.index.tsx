import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, FileText } from "lucide-react";

export const Route = createFileRoute("/_auth/manager/")({
  component: ManagerDashboard,
});

function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ team: 0, pendingLeaves: 0, todayUpdates: 0 });

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    void (async () => {
      const team = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", user.id);
      const teamIds = (await supabase.from("profiles").select("id").eq("manager_id", user.id)).data ?? [];
      const ids = teamIds.map((t) => t.id);
      const leaves = ids.length
        ? await supabase
            .from("leaves")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .in("user_id", ids)
        : { count: 0 };
      const updates = ids.length
        ? await supabase
            .from("daily_updates")
            .select("id", { count: "exact", head: true })
            .eq("date", today)
            .in("user_id", ids)
        : { count: 0 };
      setStats({
        team: team.count ?? 0,
        pendingLeaves: leaves.count ?? 0,
        todayUpdates: updates.count ?? 0,
      });
    })();
  }, [user]);

  const cards = [
    { label: "Team Size", value: stats.team, icon: Users },
    { label: "Pending Approvals", value: stats.pendingLeaves, icon: CalendarDays },
    { label: "Today's Updates", value: stats.todayUpdates, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-muted-foreground">Your team at a glance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
