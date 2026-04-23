import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, getDaysInMonth, getDay, parseISO } from "date-fns";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/_auth/employee/payslips")({
  component: PayslipsPage,
});

interface Salary {
  basic: number;
  hra: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  effective_from: string;
}

interface Att {
  date: string;
  is_lop_half_day: boolean;
}

interface Leave {
  from_date: string;
  to_date: string;
  half_day: boolean;
  type: string;
  status: string;
}

function workingDaysInMonth(year: number, month: number) {
  const total = getDaysInMonth(new Date(year, month));
  let count = 0;
  for (let d = 1; d <= total; d++) {
    const day = getDay(new Date(year, month, d));
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

function PayslipsPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [salary, setSalary] = useState<Salary | null>(null);
  const [attendance, setAttendance] = useState<Att[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);

  useEffect(() => {
    if (!user) return;
    const start = format(new Date(year, month, 1), "yyyy-MM-dd");
    const end = format(new Date(year, month + 1, 0), "yyyy-MM-dd");
    void Promise.all([
      supabase
        .from("salary_structures")
        .select("*")
        .eq("user_id", user.id)
        .lte("effective_from", end)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("attendance_logs")
        .select("date, is_lop_half_day")
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("leaves")
        .select("from_date, to_date, half_day, type, status")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .lte("from_date", end)
        .gte("to_date", start),
    ]).then(([s, a, l]) => {
      setSalary(s.data as Salary | null);
      setAttendance((a.data as Att[]) ?? []);
      setLeaves((l.data as Leave[]) ?? []);
    });
  }, [user, year, month]);

  const calc = useMemo(() => {
    if (!salary) return null;
    const workDays = workingDaysInMonth(year, month);
    const presentDates = new Set(attendance.map((a) => a.date));
    const halfDayLate = attendance.filter((a) => a.is_lop_half_day).length;

    let lopDays = 0;
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      const dateStr = format(d, "yyyy-MM-dd");
      if (presentDates.has(dateStr)) continue;
      const isLeave = leaves.some((l) => {
        return dateStr >= l.from_date && dateStr <= l.to_date;
      });
      if (isLeave) {
        const lopLeave = leaves.find(
          (l) => l.type === "LOP" && dateStr >= l.from_date && dateStr <= l.to_date,
        );
        if (lopLeave) lopDays += lopLeave.half_day ? 0.5 : 1;
      } else {
        lopDays += 1;
      }
    }
    lopDays += halfDayLate * 0.5;

    const basic = Number(salary.basic);
    const hra = Number(salary.hra);
    const allow = Object.values(salary.allowances || {}).reduce((s, v) => s + Number(v), 0);
    const ded = Object.values(salary.deductions || {}).reduce((s, v) => s + Number(v), 0);
    const gross = basic + hra + allow;
    const dailyRate = gross / workDays;
    const lopDeduction = dailyRate * lopDays;
    const net = gross - ded - lopDeduction;

    return { workDays, lopDays, basic, hra, allow, ded, gross, lopDeduction, net };
  }, [salary, attendance, leaves, year, month]);

  const monthLabel = format(new Date(year, month, 1), "MMMM yyyy");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payslips</h1>
        <p className="text-muted-foreground">Auto-generated from attendance</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between print:hidden">
          <CardTitle>Select Period</CardTitle>
          <div className="flex gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {format(new Date(2000, i, 1), "MMMM")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = now.getFullYear() - i;
                  return (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!salary ? (
            <p className="text-sm text-muted-foreground">
              No salary structure on file. Contact your administrator.
            </p>
          ) : !calc ? null : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Payslip — {monthLabel}</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic</TableCell>
                    <TableCell className="text-right">{calc.basic.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>HRA</TableCell>
                    <TableCell className="text-right">{calc.hra.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Allowances</TableCell>
                    <TableCell className="text-right">{calc.allow.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="font-medium">
                    <TableCell>Gross</TableCell>
                    <TableCell className="text-right">{calc.gross.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Deductions</TableCell>
                    <TableCell className="text-right text-destructive">
                      −{calc.ded.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      LOP ({calc.lopDays} days @ daily rate)
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      −{calc.lopDeduction.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold text-lg">
                    <TableCell>Net Pay</TableCell>
                    <TableCell className="text-right">{calc.net.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Working days: {calc.workDays} • Salary effective from{" "}
                {format(parseISO(salary.effective_from), "PP")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
