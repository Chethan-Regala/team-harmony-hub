import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/manager/leaves")({
  component: LeaveApprovals,
});

interface Leave {
  id: string;
  user_id: string;
  type: "CL" | "LOP";
  from_date: string;
  to_date: string;
  half_day: boolean;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
}

function LeaveApprovals() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Leave | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const team = await supabase.from("profiles").select("id, full_name, email").eq("manager_id", user.id);
    const ids = (team.data ?? []).map((t) => t.id);
    const map: Record<string, string> = {};
    (team.data ?? []).forEach((t) => (map[t.id] = t.full_name || t.email));
    setNames(map);
    if (ids.length === 0) return setLeaves([]);
    const { data } = await supabase
      .from("leaves")
      .select("*")
      .in("user_id", ids)
      .order("created_at", { ascending: false });
    setLeaves((data as Leave[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (status: "approved" | "rejected") => {
    if (!selected || !user) return;
    const { error } = await supabase
      .from("leaves")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: note,
      })
      .eq("id", selected.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Leave ${status}`);
      setSelected(null);
      setNote("");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leave Approvals</h1>
        <p className="text-muted-foreground">Review your team's leave requests</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{names[l.user_id] ?? "—"}</TableCell>
                  <TableCell>
                    {l.type} {l.half_day && "(½)"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(l.from_date), "PP")} – {format(new Date(l.to_date), "PP")}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{l.reason ?? "—"}</TableCell>
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
                  <TableCell>
                    {l.status === "pending" && (
                      <Dialog
                        open={selected?.id === l.id}
                        onOpenChange={(o) => {
                          if (!o) setSelected(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelected(l)}>
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Leave Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <p className="text-sm">
                              <strong>{names[l.user_id]}</strong> · {l.type}{" "}
                              {l.half_day && "(half-day)"}
                            </p>
                            <p className="text-sm text-muted-foreground">{l.reason}</p>
                            <Textarea
                              placeholder="Note (optional)"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                            />
                          </div>
                          <DialogFooter>
                            <Button variant="destructive" onClick={() => review("rejected")}>
                              Reject
                            </Button>
                            <Button onClick={() => review("approved")}>Approve</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No requests.
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
