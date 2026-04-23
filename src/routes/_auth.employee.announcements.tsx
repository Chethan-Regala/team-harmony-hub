import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export const Route = createFileRoute("/_auth/employee/announcements")({
  component: AnnouncementsPage,
});

interface Ann {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function AnnouncementsPage() {
  const [items, setItems] = useState<Ann[]>([]);

  useEffect(() => {
    void supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setItems((data as Ann[]) ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Company-wide updates</p>
      </div>
      <div className="space-y-4">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "PPp")}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{a.body}</p>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
