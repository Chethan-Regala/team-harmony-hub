import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DocViewer } from "@/components/DocViewer";

export const Route = createFileRoute("/_auth/admin/documents")({
  component: AdminDocs,
});

interface Doc {
  id: string;
  title: string;
  file_path: string;
  visibility: string;
  tag: string | null;
  target_user_id: string | null;
  created_at: string;
}

function AdminDocs() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState("policy");
  const [visibility, setVisibility] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<{ url: string | null; title: string; filename: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocs((data as Doc[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const { error } = await supabase.from("documents").insert({
        uploader_id: user.id,
        title,
        file_path: path,
        visibility,
        tag,
      });
      if (error) {
        await supabase.storage.from("documents").remove([path]);
        throw error;
      }
      toast.success("Document uploaded");
      setTitle("");
      setFile(null);
      (document.getElementById("doc-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("doc-file") as HTMLInputElement).value = "");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (d: Doc) => {
    // Backwards-compat: legacy entries stored full URLs
    if (/^https?:\/\//i.test(d.file_path)) {
      window.open(d.file_path, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(d.file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error(error?.message ?? "Could not generate link");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async (d: Doc) => {
    const { error } = await supabase.from("documents").delete().eq("id", d.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!/^https?:\/\//i.test(d.file_path)) {
      await supabase.storage.from("documents").remove([d.file_path]);
    }
    toast.success("Deleted");
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">Upload policies and shared files</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="handbook">Handbook</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={uploading || !file}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => download(d)}
                      className="text-left hover:underline"
                    >
                      {d.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.tag ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(d.created_at), "PP")}</TableCell>
                  <TableCell className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => download(d)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(d)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
