import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Megaphone } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, todayAttendance: 0, pendingLeaves: 0 });
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    void Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("attendance_logs").select("id", { count: "exact", head: true }).eq("date", today),
      supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("announcements").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
    ]).then(([u, a, l, ann]) => {
      setStats({
        users: u.count ?? 0,
        todayAttendance: a.count ?? 0,
        pendingLeaves: l.count ?? 0,
      });
      setAnnouncements(ann.data ?? []);
    });
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Today's Check-ins", value: stats.todayAttendance, icon: Clock },
    { label: "Pending Leaves", value: stats.pendingLeaves, icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" /> Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <ul className="space-y-2">
              {announcements.map((a) => (
                <li key={a.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground">{format(new Date(a.created_at), "PP")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
