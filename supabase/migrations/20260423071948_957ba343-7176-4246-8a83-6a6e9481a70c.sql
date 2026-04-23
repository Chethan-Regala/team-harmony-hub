
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE public.leave_type AS ENUM ('CL', 'LOP');
CREATE TYPE public.leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.responsibility_status AS ENUM ('pending', 'in_progress', 'done');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  employee_id TEXT UNIQUE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  designation TEXT,
  department TEXT,
  join_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_manager ON public.profiles(manager_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- has_role function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- get current user roles
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
$$;

-- is manager of given employee
CREATE OR REPLACE FUNCTION public.is_manager_of(_employee_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _employee_id AND manager_id = auth.uid())
$$;

-- Salary structures
CREATE TABLE public.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances JSONB NOT NULL DEFAULT '{}'::jsonb,
  deductions JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_salary_user ON public.salary_structures(user_id, effective_from DESC);

-- Office locations
CREATE TABLE public.office_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance
CREATE TABLE public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  check_in_lat DOUBLE PRECISION,
  check_in_lng DOUBLE PRECISION,
  check_out_lat DOUBLE PRECISION,
  check_out_lng DOUBLE PRECISION,
  is_late BOOLEAN NOT NULL DEFAULT false,
  is_lop_half_day BOOLEAN NOT NULL DEFAULT false,
  is_offsite_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX idx_attendance_user_date ON public.attendance_logs(user_id, date DESC);
CREATE INDEX idx_attendance_date ON public.attendance_logs(date DESC);

-- Leaves
CREATE TABLE public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.leave_type NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  half_day BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  status public.leave_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leaves_user ON public.leaves(user_id, from_date DESC);
CREATE INDEX idx_leaves_status ON public.leaves(status);

-- Daily updates
CREATE TABLE public.daily_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
CREATE INDEX idx_updates_user_date ON public.daily_updates(user_id, date DESC);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  posted_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ann_created ON public.announcements(created_at DESC);

-- Documents
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'all',
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_docs_target ON public.documents(target_user_id);

-- Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feedback_employee ON public.feedback(employee_id, created_at DESC);

-- Responsibilities
CREATE TABLE public.responsibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status public.responsibility_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_resp_employee ON public.responsibilities(employee_id, status);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsibilities ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin views all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Manager views team profiles" ON public.profiles FOR SELECT USING (manager_id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin updates any profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin inserts profiles" ON public.profiles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = id);

-- USER_ROLES policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin views all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- SALARY policies
CREATE POLICY "Users view own salary" ON public.salary_structures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manages salary" ON public.salary_structures FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- OFFICE LOCATIONS policies
CREATE POLICY "All authenticated read locations" ON public.office_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages locations" ON public.office_locations FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ATTENDANCE policies
CREATE POLICY "Users view own attendance" ON public.attendance_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manager views team attendance" ON public.attendance_logs FOR SELECT USING (public.is_manager_of(user_id));
CREATE POLICY "Admin views all attendance" ON public.attendance_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own attendance" ON public.attendance_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attendance" ON public.attendance_logs FOR UPDATE USING (auth.uid() = user_id);

-- LEAVES policies
CREATE POLICY "Users view own leaves" ON public.leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Manager views team leaves" ON public.leaves FOR SELECT USING (public.is_manager_of(user_id));
CREATE POLICY "Admin views all leaves" ON public.leaves FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own leaves" ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manager reviews team leaves" ON public.leaves FOR UPDATE USING (public.is_manager_of(user_id) OR public.has_role(auth.uid(), 'admin'));

-- DAILY UPDATES policies
CREATE POLICY "Users manage own updates" ON public.daily_updates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Manager views team updates" ON public.daily_updates FOR SELECT USING (public.is_manager_of(user_id));
CREATE POLICY "Admin views all updates" ON public.daily_updates FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ANNOUNCEMENTS policies
CREATE POLICY "All read announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manages announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DOCUMENTS policies
CREATE POLICY "Users view own/all documents" ON public.documents FOR SELECT USING (visibility = 'all' OR target_user_id = auth.uid() OR uploader_id = auth.uid());
CREATE POLICY "Admin manages documents" ON public.documents FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- FEEDBACK policies
CREATE POLICY "Employee views own feedback" ON public.feedback FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Manager views/manages own feedback" ON public.feedback FOR ALL USING (auth.uid() = manager_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = manager_id OR public.has_role(auth.uid(), 'admin'));

-- RESPONSIBILITIES policies
CREATE POLICY "Employee views own responsibilities" ON public.responsibilities FOR SELECT USING (auth.uid() = employee_id);
CREATE POLICY "Employee updates own responsibility status" ON public.responsibilities FOR UPDATE USING (auth.uid() = employee_id);
CREATE POLICY "Manager/Admin manage responsibilities" ON public.responsibilities FOR ALL USING (auth.uid() = assigned_by OR public.is_manager_of(employee_id) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = assigned_by OR public.is_manager_of(employee_id) OR public.has_role(auth.uid(), 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
