
# HR Portal — Role-Based Web App

A scalable HR management portal with three roles (Admin, Manager, Employee), built on Lovable's stack: TanStack Start + React + Lovable Cloud (Supabase Postgres + Auth + Storage). Note: native Express/Node backend isn't supported here, but Lovable Cloud gives you the same capabilities (Postgres, JWT auth, RLS, server functions) production-ready out of the box.

## Auth & Roles
- Email/password authentication via Lovable Cloud (JWT-based sessions)
- Separate `user_roles` table with `app_role` enum (`admin`, `manager`, `employee`) — enforced by Postgres RLS to prevent privilege escalation
- Only Admin can create Manager/Employee accounts (admin-only "Add User" flow)
- Initial admin: seeded placeholder (`admin@hrportal.com` / temp password) — you'll rotate after first login via Profile settings
- Route guards via `_authenticated` and role-specific layout routes (`_admin`, `_manager`)

## Database Schema (Postgres)
- `profiles` — name, phone, avatar, employee_id, manager_id (FK self), join_date, designation, department
- `user_roles` — user_id, role
- `salary_structures` — user_id, basic, hra, allowances (jsonb), deductions (jsonb), effective_from
- `office_locations` — name, latitude, longitude, radius_meters
- `attendance_logs` — user_id, date (unique per user/day), check_in_at, check_out_at, check_in_lat/lng, check_out_lat/lng, is_late, is_lop_half_day, is_offsite_flagged
- `leaves` — user_id, type (CL/LOP), from_date, to_date, half_day, reason, status (pending/approved/rejected), reviewed_by, reviewed_at
- `daily_updates` — user_id, date, content, created_at
- `announcements` — title, body, posted_by, created_at
- `documents` — uploader_id, target_user_id (nullable = company-wide), title, file_path, visibility (all/role/user)
- `feedback` — manager_id, employee_id, content, created_at
- `responsibilities` — assigned_by, employee_id, title, description, due_date, status
- Indexes on `user_id`, `date`, `status`, `manager_id` for 1000-user scale; pagination on all lists

## Admin Dashboard
- Overview: total users, today's attendance, pending leaves, recent announcements
- **Users**: create/edit/deactivate users, assign role, assign manager, set salary structure
- **Attendance**: filterable table (by user, date range, off-site flag), CSV export
- **Leaves**: view/override all leave requests
- **Announcements**: create, edit, delete (visible to all)
- **Documents**: upload company-wide or user-specific files (Lovable Cloud Storage)
- **Office Locations**: set lat/lng + radius for off-site flagging
- **Policies**: managed as documents tagged "policy"

## Manager Dashboard
- Team overview (only employees where `manager_id = self`)
- Team attendance view + off-site flag indicators
- Leave approvals queue (approve/reject with note)
- Daily updates feed for their team (filter by employee/date)
- Feedback notes per team member
- Assign responsibilities/tasks with due dates

## Employee Dashboard
- **Check-in/out**: single button captures geolocation; one check-in per day; auto-marks half-day LOP if after 10:30 AM; flags off-site if outside any office radius
- **My Attendance**: monthly calendar view + history table
- **Apply Leave**: form with type (CL auto-validated to 1/month, else LOP), half-day toggle, manager approval flow
- **Daily Update**: submit today's work log, view past entries
- **Payslips**: auto-generated monthly from attendance — basic + HRA + allowances − deductions − (LOP days × daily rate); downloadable
- **Announcements**: read-only company feed
- **Documents**: view assigned + company-wide
- **Profile**: edit name, phone, avatar; change password
- **Feedback & Responsibilities**: view manager's notes and assigned tasks

## Geolocation Logic
- On check-in/out, browser Geolocation API captures lat/lng
- Server function compares to all `office_locations` (Haversine); if outside every radius → `is_offsite_flagged = true`
- Coordinates always stored; flag visible to manager/admin

## Payslip Logic
- Server function computes per month: working days, LOP days (full + half from late check-ins), then applies salary structure
- Generated on-demand and cacheable; downloadable as printable HTML/PDF view

## UI / Design
- Clean minimal interface — sidebar nav, role-aware menu, shadcn/ui components
- Responsive (desktop-first, mobile-friendly check-in)
- Light theme, professional palette (slate + indigo accent)

## Scalability
- All list views paginated (20/page) with server-side filtering
- DB indexes on hot paths
- RLS policies via SECURITY DEFINER `has_role()` function (no recursion)
- Server functions for all sensitive ops (leave approval, user creation, payslip calc)

## Out of Scope (v1)
- Mobile native apps
- SSO / external identity providers
- Real-time notifications (can add later)

After build, you'll log in as the seeded admin, change the password, and start adding managers/employees and office locations.
