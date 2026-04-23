export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  manager_id: string | null;
  designation: string | null;
  department: string | null;
  join_date: string | null;
  is_active: boolean;
};

export type Role = "admin" | "manager" | "employee";
