import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  full_name: z.string().min(1).max(100),
  role: z.enum(["admin", "manager", "employee"]),
  manager_id: z.string().uuid().nullable().optional(),
  employee_id: z.string().max(50).nullable().optional(),
  designation: z.string().max(100).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
});

async function assertAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newId = created.user.id;

    // wait briefly for trigger; then update profile fields
    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        manager_id: data.manager_id ?? null,
        employee_id: data.employee_id ?? null,
        designation: data.designation ?? null,
        department: data.department ?? null,
      })
      .eq("id", newId);

    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: data.role });

    return { id: newId };
  });

const SetSalarySchema = z.object({
  user_id: z.string().uuid(),
  basic: z.number().min(0),
  hra: z.number().min(0),
  allowances: z.record(z.string(), z.number()).default({}),
  deductions: z.record(z.string(), z.number()).default({}),
  effective_from: z.string(),
});

export const setSalary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SetSalarySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("salary_structures").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SeedAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).default("Administrator"),
});

// Bootstrap: only works if no admin exists yet
export const seedInitialAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SeedAdminSchema.parse(input))
  .handler(async ({ data }) => {
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      throw new Error("An admin already exists. Setup is closed.");
    }
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newId = created.user.id;
    await supabaseAdmin.from("profiles").update({ full_name: data.full_name }).eq("id", newId);
    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: "admin" });
    return { ok: true };
  });

export const checkAdminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});
