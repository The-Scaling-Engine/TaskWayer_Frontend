import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Users,
  BarChart2,
  Building2,
  FolderOpen,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepartmentStore } from '@/store/departmentStore';
import { useProjectStore } from '@/store/projectStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/tasks' },
  { icon: FolderOpen, label: 'Projects', path: '/dashboard/projects' },
  { icon: CalendarDays, label: 'Calendar', path: '/dashboard/calendar' },
  { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Admin Panel', path: '/dashboard/admin' },
  { icon: Users, label: 'Manage Users', path: '/dashboard/admin/users' },
  { icon: Building2, label: 'Departments', path: '/dashboard/admin/departments' },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const myDepartments = useDepartmentStore((s) => s.myDepartments);
  const recentDeptIds = useDepartmentStore((s) => s.recentDeptIds);
  const projects = useProjectStore((s) => s.projects);

  const topProjects = useMemo(
    () => projects.filter((p) => !p.archivedAt && !p.deletedAt).slice(0, 3),
    [projects]
  );

  const topDepts = useMemo(() => {
    return [...myDepartments]
      .sort((a, b) => {
        const ai = recentDeptIds.indexOf(a.department.id);
        const bi = recentDeptIds.indexOf(b.department.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
      .slice(0, 3);
  }, [myDepartments, recentDeptIds]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    if (path === '/dashboard/admin') return location.pathname === '/dashboard/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-[42] bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-border shrink-0',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <CheckSquare className="text-primary-foreground" size={22} />
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-foreground tracking-tight">Wayer Tasks</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {user?.role !== 'ADMIN' && navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}

          {user?.role !== 'ADMIN' && topDepts.length > 0 && (
            <>
              <div className={cn('mt-4 mb-2', collapsed ? 'text-center' : 'px-3')}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {collapsed ? 'Dept' : 'My Departments'}
                </span>
              </div>
              {topDepts.map((m) => {
                const isManagerRole = m.role === 'OWNER' || m.role === 'ADMIN';
                const deptPath = isManagerRole
                  ? `/dashboard/departments/${m.department.id}`
                  : `/dashboard/departments/${m.department.id}/tasks`;
                const active = isActive(deptPath);
                return (
                  <Link
                    key={m.id}
                    to={deptPath}
                    onClick={onMobileClose}
                    title={collapsed ? m.department.name : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Building2 size={20} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{m.department.name}</span>
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                          m.role === 'OWNER'
                            ? 'bg-[#FE812C]/10 text-[#FE812C]'
                            : 'bg-purple-500/10 text-purple-500'
                        )}>
                          {m.role}
                        </span>
                      </>
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {user?.role !== 'ADMIN' && topProjects.length > 0 && (
            <>
              <div className={cn('mt-4 mb-2', collapsed ? 'text-center' : 'px-3')}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {collapsed ? 'Proj' : 'My Projects'}
                </span>
              </div>
              {topProjects.map((project) => {
                const isOwner = project.ownerId === (user?.id ?? user?._id);
                const projectPath = isOwner
                  ? `/dashboard/projects/${project.id}`
                  : `/dashboard/projects/${project.id}/tasks`;
                const active = isActive(projectPath);
                return (
                  <Link
                    key={project.id}
                    to={projectPath}
                    onClick={onMobileClose}
                    title={collapsed ? project.name : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <FolderOpen size={20} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{project.name}</span>
                        {isOwner && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FE812C]/10 text-[#FE812C] shrink-0">
                            OWNER
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </>
          )}

          {user?.role === 'ADMIN' && (
            <>
              <div className={cn("mt-4 mb-2", collapsed ? "text-center" : "px-3")}>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {collapsed ? "Adm" : "Administration"}
                </span>
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-[#FE812C]/10 text-[#FE812C]'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon size={20} className="shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1">
          {!collapsed && (
            <Link
              to="/dashboard/profile"
              onClick={onMobileClose}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.email || 'User'}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {user?.name && (
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                )}
                <p className={`text-sm ${user?.name ? 'text-muted-foreground' : 'font-medium text-foreground'} truncate`}>
                  {user?.email || 'User'}
                </p>
              </div>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>

          <button
            onClick={onToggle}
            className={cn(
              'hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200',
              collapsed && 'justify-center px-2'
            )}
          >
            <ChevronLeft size={20} className={cn('shrink-0 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => mobileOpen ? onMobileClose() : onToggle()}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground shadow-sm"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
