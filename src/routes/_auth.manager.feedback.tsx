import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/manager/feedback")({
  component: FeedbackPage,
});

interface Member {
  id: string;
  full_name: string | null;
  email: string;
}
interface FB {
  id: string;
  employee_id: string;
  content: string;
  created_at: string;
}

function FeedbackPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Member[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [content, setContent] = useState("");
  const [feedbacks, setFeedbacks] = useState<FB[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const t = await supabase.from("profiles").select("id, full_name, email").eq("manager_id", user.id);
    setTeam((t.data as Member[]) ?? []);
    const f = await supabase
      .from("feedback")
      .select("*")
      .eq("manager_id", user.id)
      .order("created_at", { ascending: false });
    setFeedbacks((f.data as FB[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeId || !content.trim()) return;
    const { error } = await supabase.from("feedback").insert({
      manager_id: user.id,
      employee_id: employeeId,
      content,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Feedback added");
      setContent("");
      await load();
    }
  };

  const nameOf = (id: string) => team.find((t) => t.id === id)?.full_name ?? id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
        <p className="text-muted-foreground">Notes you've shared with your team</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
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
            <Textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share constructive feedback..."
              maxLength={1000}
            />
            <Button type="submit">Add Feedback</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbacks.map((f) => (
            <div key={f.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{nameOf(f.employee_id)}</span>
                <span className="text-muted-foreground">{format(new Date(f.created_at), "PP")}</span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{f.content}</p>
            </div>
          ))}
          {feedbacks.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
