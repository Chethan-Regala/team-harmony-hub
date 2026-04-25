import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  FileText,
  Megaphone,
  Users,
  MapPin,
  Folder,
  ClipboardList,
  MessageSquare,
  Wallet,
  UserCog,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const employeeNav: NavItem[] = [
  { to: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employee/attendance", label: "Attendance", icon: Clock },
  { to: "/employee/leaves", label: "Leaves", icon: CalendarDays },
  { to: "/employee/updates", label: "Daily Updates", icon: FileText },
  { to: "/employee/payslips", label: "Payslips", icon: Wallet },
  { to: "/employee/announcements", label: "Announcements", icon: Megaphone },
  { to: "/employee/documents", label: "Documents", icon: Folder },
  { to: "/employee/feedback", label: "Feedback & Tasks", icon: MessageSquare },
  { to: "/employee/profile", label: "Profile", icon: UserCog },
];

const managerNav: NavItem[] = [
  { to: "/manager", label: "Dashboard", icon: LayoutDashboard },
  { to: "/manager/team", label: "Team", icon: Users },
  { to: "/manager/attendance", label: "Team Attendance", icon: Clock },
  { to: "/manager/leaves", label: "Leave Approvals", icon: CalendarDays },
  { to: "/manager/updates", label: "Team Updates", icon: FileText },
  { to: "/manager/feedback", label: "Feedback", icon: MessageSquare },
  { to: "/manager/responsibilities", label: "Responsibilities", icon: ClipboardList },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/attendance", label: "Attendance", icon: Clock },
  { to: "/admin/leaves", label: "Leaves", icon: CalendarDays },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/documents", label: "Documents", icon: Folder },
  { to: "/admin/locations", label: "Office Locations", icon: MapPin },
];

export function AppShell({ section }: { section: "admin" | "manager" | "employee" }) {
  const { user, signOut, isAdmin, isManager } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav =
    section === "admin" ? adminNav : section === "manager" ? managerNav : employeeNav;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="HR Portal Logo" className="h-8 w-auto flex-shrink-0" />
            <h1 className="text-lg font-bold text-foreground">HR Portal</h1>
          </div>
          <p className="text-xs text-muted-foreground capitalize mt-1">{section} workspace</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          {(isAdmin || isManager) && section !== "employee" && (
            <Link
              to="/employee"
              className="block text-xs text-muted-foreground hover:text-foreground px-3"
            >
              Switch to employee view →
            </Link>
          )}
          {isAdmin && section !== "admin" && (
            <Link
              to="/admin"
              className="block text-xs text-muted-foreground hover:text-foreground px-3"
            >
              Admin workspace →
            </Link>
          )}
          {isManager && section !== "manager" && (
            <Link
              to="/manager"
              className="block text-xs text-muted-foreground hover:text-foreground px-3"
            >
              Manager workspace →
            </Link>
          )}
          <div className="px-3 pt-2">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
