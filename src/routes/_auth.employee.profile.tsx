import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/employee/profile")({
  component: ProfilePage,
});

interface Profile {
  full_name: string | null;
  phone: string | null;
  email: string;
  designation: string | null;
  department: string | null;
  employee_id: string | null;
}

function ProfilePage() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [newPwd, setNewPwd] = useState("");

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("full_name, phone, email, designation, department, employee_id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setP(data as Profile | null));
  }, [user]);

  const save = async () => {
    if (!user || !p) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: p.full_name, phone: p.phone })
      .eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const changePwd = async () => {
    if (newPwd.length < 6) return toast.error("Password must be at least 6 chars");
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPwd("");
    }
  };

  if (!p) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={p.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={p.employee_id ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={p.full_name ?? ""}
                onChange={(e) => setP({ ...p, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={p.designation ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={p.department ?? ""} disabled />
            </div>
          </div>
          <Button onClick={save}>Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <Label>New Password</Label>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </div>
          <Button onClick={changePwd}>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
