import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createUser, setSalary } from "@/server/admin.functions";
import { Plus, Wallet } from "lucide-react";

export const Route = createFileRoute("/_auth/admin/users")({
  component: AdminUsers,
});

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  employee_id: string | null;
  designation: string | null;
  department: string | null;
  manager_id: string | null;
  is_active: boolean;
}
interface RoleRow {
  user_id: string;
  role: "admin" | "manager" | "employee";
}

function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState(false);
  const [salaryFor, setSalaryFor] = useState<UserRow | null>(null);

  // create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
  const [managerId, setManagerId] = useState<string>("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");

  // salary form
  const [basic, setBasic] = useState("0");
  const [hra, setHra] = useState("0");
  const [allowOther, setAllowOther] = useState("0");
  const [dedTax, setDedTax] = useState("0");
  const [effFrom, setEffFrom] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    const { data: u } = await supabase
      .from("profiles")
      .select("id, email, full_name, employee_id, designation, department, manager_id, is_active")
      .order("created_at", { ascending: false });
    setUsers((u as UserRow[]) ?? []);
    const { data: r } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, string[]> = {};
    ((r as RoleRow[]) ?? []).forEach((row) => {
      map[row.user_id] = [...(map[row.user_id] ?? []), row.role];
    });
    setRoles(map);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser({
        data: {
          email,
          password,
          full_name: name,
          role,
          manager_id: managerId || null,
          employee_id: empId || null,
          designation: designation || null,
          department: department || null,
        },
      });
      toast.success("User created");
      setOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setEmpId("");
      setManagerId("");
      setDesignation("");
      setDepartment("");
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const submitSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryFor) return;
    try {
      await setSalary({
        data: {
          user_id: salaryFor.id,
          basic: Number(basic),
          hra: Number(hra),
          allowances: { other: Number(allowOther) },
          deductions: { tax: Number(dedTax) },
          effective_from: effFrom,
        },
      });
      toast.success("Salary updated");
      setSalaryFor(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const toggleActive = async (u: UserRow) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !u.is_active })
      .eq("id", u.id);
    if (error) toast.error(error.message);
    else {
      toast.success(u.is_active ? "Deactivated" : "Activated");
      await load();
    }
  };

  const managers = users.filter((u) => roles[u.id]?.includes("manager") || roles[u.id]?.includes("admin"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage all users, roles, and salary</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <form onSubmit={submitUser} className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Temp Password</Label>
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1">
                <Label>Employee ID</Label>
                <Input value={empId} onChange={(e) => setEmpId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Designation</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label>Manager (optional)</Label>
                <Select value={managerId || "none"} onValueChange={(v) => setManagerId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name ?? m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="col-span-2">
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.employee_id ?? "—"}</TableCell>
                  <TableCell>
                    {(roles[u.id] ?? []).map((r) => (
                      <Badge key={r} variant="secondary" className="mr-1">
                        {r}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{u.department ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.is_active ? "default" : "outline"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setSalaryFor(u)}>
                      <Wallet className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!salaryFor} onOpenChange={(o) => !o && setSalaryFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Salary — {salaryFor?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitSalary} className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Basic</Label>
              <Input type="number" value={basic} onChange={(e) => setBasic(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>HRA</Label>
              <Input type="number" value={hra} onChange={(e) => setHra(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Other Allowances</Label>
              <Input type="number" value={allowOther} onChange={(e) => setAllowOther(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tax / Deductions</Label>
              <Input type="number" value={dedTax} onChange={(e) => setDedTax(e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Effective From</Label>
              <Input type="date" value={effFrom} onChange={(e) => setEffFrom(e.target.value)} />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="submit">Save Salary</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
