import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";

export const Route = createFileRoute("/_auth/employee/leaves")({
  component: LeavesPage,
});

interface Leave {
  id: string;
  type: "CL" | "LOP";
  from_date: string;
  to_date: string;
  half_day: boolean;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
}

function LeavesPage() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [type, setType] = useState<"CL" | "LOP">("CL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("leaves")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setLeaves((data as Leave[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      if (type === "CL") {
        const monthStart = format(startOfMonth(new Date(from)), "yyyy-MM-dd");
        const { data: existing } = await supabase
          .from("leaves")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "CL")
          .gte("from_date", monthStart)
          .neq("status", "rejected");
        if ((existing?.length ?? 0) >= 1) {
          toast.error("You've already used your 1 CL for this month. Apply LOP instead.");
          setSubmitting(false);
          return;
        }
      }
      const { error } = await supabase.from("leaves").insert({
        user_id: user.id,
        type,
        from_date: from,
        to_date: to,
        half_day: halfDay,
        reason,
      });
      if (error) throw error;
      toast.success("Leave request submitted");
      setFrom("");
      setTo("");
      setReason("");
      setHalfDay(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Leaves</h1>
        <p className="text-muted-foreground">Apply for leave and view history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Apply for Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "CL" | "LOP")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CL">Casual Leave (1/month)</SelectItem>
                  <SelectItem value="LOP">Loss of Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-center gap-3 pt-7">
              <Switch checked={halfDay} onCheckedChange={setHalfDay} id="half" />
              <Label htmlFor="half">Half-day</Label>
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={submitting}>
                Submit Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Half-day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.type}</TableCell>
                  <TableCell>
                    {format(new Date(l.from_date), "PP")} – {format(new Date(l.to_date), "PP")}
                  </TableCell>
                  <TableCell>{l.half_day ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.status === "approved"
                          ? "default"
                          : l.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {l.review_note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No leave requests yet.
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
