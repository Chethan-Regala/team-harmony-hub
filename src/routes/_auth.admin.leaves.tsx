import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/admin/leaves")({
  component: AdminLeaves,
});

interface Leave {
  id: string;
  user_id: string;
  type: string;
  from_date: string;
  to_date: string;
  half_day: boolean;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
}

function AdminLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("leaves")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLeaves((data as Leave[]) ?? []);
    const ids = Array.from(new Set((data ?? []).map((l) => l.user_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      const map: Record<string, string> = {};
      (ps ?? []).forEach((p) => (map[p.id] = p.full_name ?? p.email));
      setNames(map);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, status: "approved" | "rejected") => {
    if (!user) return;
    const { error } = await supabase
      .from("leaves")
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Leave ${status}`);
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Leaves</h1>
        <p className="text-muted-foreground">Override decisions on any request</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
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
                  <TableCell>
                    {format(new Date(l.from_date), "PP")} – {format(new Date(l.to_date), "PP")}
                  </TableCell>
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
                  <TableCell className="space-x-1">
                    {l.status !== "approved" && (
                      <Button size="sm" variant="outline" onClick={() => review(l.id, "approved")}>
                        Approve
                      </Button>
                    )}
                    {l.status !== "rejected" && (
                      <Button size="sm" variant="ghost" onClick={() => review(l.id, "rejected")}>
                        Reject
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
