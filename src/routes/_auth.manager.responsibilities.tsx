import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/manager/responsibilities")({
  component: RespPage,
});

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}
interface Resp {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "done";
}

function RespPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Member[]>([]);
  const [items, setItems] = useState<Resp[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const t = await supabase.from("profiles").select("id, full_name, email").eq("manager_id", user.id);
    setTeam((t.data as Member[]) ?? []);
    const ids = (t.data ?? []).map((m) => m.id);
    if (ids.length === 0) return setItems([]);
    const r = await supabase
      .from("responsibilities")
      .select("*")
      .in("employee_id", ids)
      .order("created_at", { ascending: false });
    setItems((r.data as Resp[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeId || !title.trim()) return;
    const { error } = await supabase.from("responsibilities").insert({
      assigned_by: user.id,
      employee_id: employeeId,
      title,
      description: desc,
      due_date: due || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Assigned");
      setTitle("");
      setDesc("");
      setDue("");
      await load();
    }
  };

  const nameOf = (id: string) => team.find((t) => t.id === id)?.full_name ?? id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Responsibilities</h1>
        <p className="text-muted-foreground">Assign tasks and track progress</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assign New</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {team.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name ?? m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={1000} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Assign</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{nameOf(r.employee_id)}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.due_date ? format(new Date(r.due_date), "PP") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "done" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No responsibilities assigned yet.
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
