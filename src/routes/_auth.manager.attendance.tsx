import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/manager/attendance")({
  component: TeamAttendance,
});

interface Log {
  id: string;
  user_id: string;
  date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  is_late: boolean;
  is_offsite_flagged: boolean;
}

function TeamAttendance() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logs, setLogs] = useState<Log[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const team = await supabase.from("profiles").select("id, full_name, email").eq("manager_id", user.id);
      const ids = (team.data ?? []).map((t) => t.id);
      const map: Record<string, string> = {};
      (team.data ?? []).forEach((t) => (map[t.id] = t.full_name || t.email));
      setNames(map);
      if (ids.length === 0) {
        setLogs([]);
        return;
      }
      const { data } = await supabase
        .from("attendance_logs")
        .select("*")
        .in("user_id", ids)
        .eq("date", date);
      setLogs((data as Log[]) ?? []);
    })();
  }, [user, date]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Attendance</h1>
        <p className="text-muted-foreground">View daily check-ins for your team</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="space-y-2 max-w-xs">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{names[l.user_id] ?? l.user_id}</TableCell>
                  <TableCell>{l.check_in_at ? format(new Date(l.check_in_at), "p") : "—"}</TableCell>
                  <TableCell>{l.check_out_at ? format(new Date(l.check_out_at), "p") : "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {l.is_late && <Badge variant="destructive">Late</Badge>}
                    {l.is_offsite_flagged && <Badge variant="outline">Off-site</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No records for selected date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
