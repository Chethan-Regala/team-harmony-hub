import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CalendarDays, Megaphone } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/employee/")({
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const { user } = useAuth();
  const [todayLog, setTodayLog] = useState<{ check_in_at: string | null; check_out_at: string | null } | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    void Promise.all([
      supabase
        .from("attendance_logs")
        .select("check_in_at, check_out_at")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("leaves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3),
    ]).then(([log, leaves, ann]) => {
      setTodayLog(log.data);
      setPendingLeaves(leaves.count ?? 0);
      setAnnouncements(ann.data ?? []);
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM do yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              Check-in:{" "}
              <span className="font-medium">
                {todayLog?.check_in_at ? format(new Date(todayLog.check_in_at), "p") : "—"}
              </span>
            </div>
            <div className="text-sm">
              Check-out:{" "}
              <span className="font-medium">
                {todayLog?.check_out_at ? format(new Date(todayLog.check_out_at), "p") : "—"}
              </span>
            </div>
            <Button asChild size="sm" className="w-full mt-2">
              <Link to="/employee/attendance">Go to Attendance</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingLeaves}</div>
            <Button asChild size="sm" variant="outline" className="w-full mt-2">
              <Link to="/employee/leaves">Apply Leave</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Latest Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{announcements.length}</div>
            <Button asChild size="sm" variant="outline" className="w-full mt-2">
              <Link to="/employee/announcements">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{a.title}</h3>
                  <span className="text-xs text-muted-foreground">{format(new Date(a.created_at), "PP")}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
