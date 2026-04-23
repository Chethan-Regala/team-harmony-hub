import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_auth/admin/announcements")({
  component: AnnPage,
});

interface Ann {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function AnnPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Ann[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    setItems((data as Ann[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({ title, body, posted_by: user.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Posted");
      setTitle("");
      setBody("");
      await load();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Post company-wide updates</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={5} maxLength={2000} />
            </div>
            <Button type="submit">Post</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle>{a.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "PPp")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
