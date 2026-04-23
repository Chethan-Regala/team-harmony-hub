import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_auth/admin/attendance")({
  component: AdminAttendance,
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

function AdminAttendance() {
  const [from, setFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logs, setLogs] = useState<Log[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("attendance_logs")
      .select("*")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
      .limit(500);
    setLogs((data as Log[]) ?? []);
    const ids = Array.from(new Set((data ?? []).map((l) => l.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, string> = {};
      (ps ?? []).forEach((p) => (map[p.id] = p.full_name ?? p.email));
      setNames(map);
    }
  };

  useEffect(() => {
    void load();
  }, [from, to]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Employee", "Check-in", "Check-out", "Late", "Off-site"].join(","),
      ...logs.map((l) =>
        [
          l.date,
          (names[l.user_id] ?? l.user_id).replace(/,/g, ""),
          l.check_in_at ?? "",
          l.check_out_at ?? "",
          l.is_late,
          l.is_offsite_flagged,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">All employees</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filter & Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{format(new Date(l.date), "PP")}</TableCell>
                  <TableCell>{names[l.user_id] ?? "—"}</TableCell>
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
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No records.
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
