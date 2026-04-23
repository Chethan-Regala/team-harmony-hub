import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/employee/updates")({
  component: UpdatesPage,
});

interface Update {
  id: string;
  date: string;
  content: string;
  created_at: string;
}

function UpdatesPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [updates, setUpdates] = useState<Update[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_updates")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30);
    setUpdates((data as Update[]) ?? []);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("daily_updates")
      .upsert({ user_id: user.id, date: today, content }, { onConflict: "user_id,date" });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Update saved");
      setContent("");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Updates</h1>
        <p className="text-muted-foreground">Submit your work log for today</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Today's Update — {format(new Date(), "PP")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <Textarea
              rows={6}
              maxLength={2000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What did you work on today?"
              required
            />
            <Button type="submit" disabled={submitting}>
              Save Update
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Past Updates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {updates.map((u) => (
            <div key={u.id} className="border-b pb-3 last:border-0">
              <div className="text-xs text-muted-foreground mb-1">{format(new Date(u.date), "PP")}</div>
              <p className="text-sm whitespace-pre-wrap">{u.content}</p>
            </div>
          ))}
          {updates.length === 0 && (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
