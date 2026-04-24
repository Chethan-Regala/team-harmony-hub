import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/employee/documents")({
  component: DocsPage,
});

interface Doc {
  id: string;
  title: string;
  file_path: string;
  visibility: string;
  tag: string | null;
  created_at: string;
}

function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    void supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDocs((data as Doc[]) ?? []));
  }, []);

  const open = async (d: Doc) => {
    if (/^https?:\/\//i.test(d.file_path)) {
      window.open(d.file_path, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(d.file_path, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Could not open file");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Company files and your assigned documents</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents available.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => open(d)}
                      className="text-sm font-medium hover:underline text-left"
                    >
                      {d.title}
                    </button>
                    {d.tag && <Badge variant="secondary">{d.tag}</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(d.created_at), "PP")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
