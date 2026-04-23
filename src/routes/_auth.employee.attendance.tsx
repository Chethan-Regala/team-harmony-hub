import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, MapPin } from "lucide-react";
import { getCurrentPosition, haversineMeters } from "@/lib/geo";

export const Route = createFileRoute("/_auth/employee/attendance")({
  component: AttendancePage,
});

interface Log {
  id: string;
  date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  is_late: boolean;
  is_lop_half_day: boolean;
  is_offsite_flagged: boolean;
}

function AttendancePage() {
  const { user } = useAuth();
  const [today, setToday] = useState<Log | null>(null);
  const [history, setHistory] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    if (!user) return;
    const { data: t } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", todayStr)
      .maybeSingle();
    setToday(t as Log | null);
    const { data: h } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);
    setHistory((h as Log[]) ?? []);
  }, [user, todayStr]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCheckIn = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const now = new Date();
      const isLate = now.getHours() > 10 || (now.getHours() === 10 && now.getMinutes() > 30);

      const { data: locs } = await supabase.from("office_locations").select("*").eq("is_active", true);
      let offsite = false;
      if (locs && locs.length > 0) {
        offsite = locs.every(
          (l) => haversineMeters(lat, lng, l.latitude, l.longitude) > l.radius_meters,
        );
      }

      const { error } = await supabase.from("attendance_logs").insert({
        user_id: user.id,
        date: todayStr,
        check_in_at: now.toISOString(),
        check_in_lat: lat,
        check_in_lng: lng,
        is_late: isLate,
        is_lop_half_day: isLate,
        is_offsite_flagged: offsite,
      });
      if (error) throw error;
      toast.success(`Checked in${isLate ? " (late — half-day LOP)" : ""}${offsite ? " (off-site)" : ""}`);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !today) return;
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const { error } = await supabase
        .from("attendance_logs")
        .update({
          check_out_at: new Date().toISOString(),
          check_out_lat: pos.coords.latitude,
          check_out_lng: pos.coords.longitude,
        })
        .eq("id", today.id);
      if (error) throw error;
      toast.success("Checked out");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-muted-foreground">Check-in/out with live geolocation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today — {format(new Date(), "PP")}</CardTitle>
          <CardDescription>
            One check-in per day. Check-in after 10:30 AM marks half-day LOP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Check-in: </span>
              <span className="font-medium">
                {today?.check_in_at ? format(new Date(today.check_in_at), "p") : "Not yet"}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Check-out: </span>
              <span className="font-medium">
                {today?.check_out_at ? format(new Date(today.check_out_at), "p") : "Not yet"}
              </span>
            </div>
          </div>
          {today && (
            <div className="flex gap-2">
              {today.is_late && <Badge variant="destructive">Late (Half-day LOP)</Badge>}
              {today.is_offsite_flagged && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> Off-site
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={handleCheckIn} disabled={loading || !!today?.check_in_at}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Check In
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckOut}
              disabled={loading || !today?.check_in_at || !!today?.check_out_at}
            >
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{format(new Date(l.date), "PP")}</TableCell>
                  <TableCell>{l.check_in_at ? format(new Date(l.check_in_at), "p") : "—"}</TableCell>
                  <TableCell>{l.check_out_at ? format(new Date(l.check_out_at), "p") : "—"}</TableCell>
                  <TableCell className="space-x-1">
                    {l.is_late && <Badge variant="destructive">Late</Badge>}
                    {l.is_offsite_flagged && <Badge variant="outline">Off-site</Badge>}
                    {!l.is_late && !l.is_offsite_flagged && <Badge variant="secondary">OK</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No attendance records yet.
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
