import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/employee/feedback")({
  component: FeedbackPage,
});

interface Feedback {
  id: string;
  content: string;
  created_at: string;
}
interface Resp {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: "pending" | "in_progress" | "done";
}

function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [resp, setResp] = useState<Resp[]>([]);

  const load = async () => {
    if (!user) return;
    const [f, r] = await Promise.all([
      supabase
        .from("feedback")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("responsibilities")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setFeedback((f.data as Feedback[]) ?? []);
    setResp((r.data as Resp[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, [user]);

  const updateStatus = async (id: string, status: Resp["status"]) => {
    const { error } = await supabase.from("responsibilities").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback & Responsibilities</h1>
        <p className="text-muted-foreground">Notes and tasks from your manager</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>My Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resp.length === 0 ? (
            <p className="text-sm text-muted-foreground">No responsibilities assigned.</p>
          ) : (
            resp.map((r) => (
              <div key={r.id} className="border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{r.title}</h3>
                    {r.description && (
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                    )}
                    {r.due_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {format(new Date(r.due_date), "PP")}
                      </p>
                    )}
                  </div>
                  <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v as Resp["status"])}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Manager Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="border-b pb-3 last:border-0">
                <p className="text-sm whitespace-pre-wrap">{f.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(f.created_at), "PPp")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
