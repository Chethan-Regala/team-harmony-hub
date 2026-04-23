import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_auth/manager/team")({
  component: TeamPage,
});

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  designation: string | null;
  department: string | null;
  employee_id: string | null;
}

function TeamPage() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Member[]>([]);

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("id, full_name, email, designation, department, employee_id")
      .eq("manager_id", user.id)
      .then(({ data }) => setTeam((data as Member[]) ?? []));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Team</h1>
        <p className="text-muted-foreground">{team.length} member(s)</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Department</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.full_name ?? "—"}</TableCell>
                  <TableCell>{m.email}</TableCell>
                  <TableCell>{m.employee_id ?? "—"}</TableCell>
                  <TableCell>{m.designation ?? "—"}</TableCell>
                  <TableCell>{m.department ?? "—"}</TableCell>
                </TableRow>
              ))}
              {team.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No team members assigned to you yet.
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
