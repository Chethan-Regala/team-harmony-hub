import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { getCurrentPosition } from "@/lib/geo";

export const Route = createFileRoute("/_auth/admin/locations")({
  component: LocationsPage,
});

interface Loc {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
}

function LocationsPage() {
  const [items, setItems] = useState<Loc[]>([]);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("200");

  const load = useCallback(async () => {
    const { data } = await supabase.from("office_locations").select("*").order("created_at", { ascending: false });
    setItems((data as Loc[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const useMyLoc = async () => {
    try {
      const p = await getCurrentPosition();
      setLat(String(p.coords.latitude));
      setLng(String(p.coords.longitude));
      toast.success("Location captured");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("office_locations").insert({
      name,
      latitude: Number(lat),
      longitude: Number(lng),
      radius_meters: Number(radius),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Added");
      setName("");
      setLat("");
      setLng("");
      setRadius("200");
      await load();
    }
  };

  const toggle = async (l: Loc) => {
    await supabase.from("office_locations").update({ is_active: !l.is_active }).eq("id", l.id);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from("office_locations").delete().eq("id", id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Office Locations</h1>
        <p className="text-muted-foreground">Set geofences for off-site flagging</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Radius (meters)</Label>
              <Input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                required
                min={10}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={useMyLoc}>
                Use my current location
              </Button>
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Radius</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {l.latitude.toFixed(5)}, {l.longitude.toFixed(5)}
                  </TableCell>
                  <TableCell>{l.radius_meters}m</TableCell>
                  <TableCell>
                    <Switch checked={l.is_active} onCheckedChange={() => toggle(l)} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No locations yet — all check-ins will be flagged off-site.
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
