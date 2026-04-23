import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/manager/updates")({
  component: TeamUpdates,
});

interface Update {
  id: string;
  user_id: string;
  date: string;
  content: string;
}

function TeamUpdates() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [updates, setUpdates] = useState<Update[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const team = await supabase.from("profiles").select("id, full_name, email").eq("manager_id", user.id);
      const ids = (team.data ?? []).map((t) => t.id);
      const map: Record<string, string> = {};
      (team.data ?? []).forEach((t) => (map[t.id] = t.full_name || t.email));
      setNames(map);
      if (ids.length === 0) return setUpdates([]);
      const { data } = await supabase
        .from("daily_updates")
        .select("*")
        .in("user_id", ids)
        .eq("date", date)
        .order("created_at", { ascending: false });
      setUpdates((data as Update[]) ?? []);
    })();
  }, [user, date]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Daily Updates</h1>
        <p className="text-muted-foreground">See what your team is working on</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {updates.map((u) => (
          <Card key={u.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{names[u.user_id] ?? "—"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{u.content}</p>
            </CardContent>
          </Card>
        ))}
        {updates.length === 0 && (
          <p className="text-sm text-muted-foreground">No updates submitted for this date.</p>
        )}
      </div>
    </div>
  );
}
