import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useTimeTrackingStore } from '@/store/timeTrackingStore';
import { useDepartmentStore } from '@/store/departmentStore';
import { useSocketStore } from '@/store/socketStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useTaskStore } from '@/store/taskStore';
import { toast } from 'sonner';
import type { Notification } from '@/types';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const token = useAuthStore((s) => s.token);
  const fetchActiveSession = useTimeTrackingStore((s) => s.fetchActiveSession);
  const user = useAuthStore((s) => s.user);
  const fetchMyDepartments = useDepartmentStore((s) => s.fetchMyDepartments);
  const fetchAllMemberships = useDepartmentStore((s) => s.fetchAllMemberships);
  const updateRecentDept = useDepartmentStore((s) => s.updateRecentDept);
  const { connect, disconnect, socket } = useSocketStore();
  const pushNotification = useNotificationStore((s) => s.pushNotification);
  const silentFetch = useTaskStore((s) => s.silentFetch);

  useEffect(() => {
    fetchProfile();
    fetchActiveSession();
  }, [fetchProfile, fetchActiveSession]);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      fetchMyDepartments();
      fetchAllMemberships();
    }
  }, [user?.role, fetchMyDepartments, fetchAllMemberships]);

  // Connect socket when authenticated
  useEffect(() => {
    if (!token) return;
    connect(token);
    return () => { disconnect(); };
  }, [token, connect, disconnect]);

  // Global socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: Notification) => {
      pushNotification(data);
      toast(data.title, { description: data.message, duration: 4000 });
      if (data.type === 'TASK_ASSIGNED' && typeof data.payload?.departmentId === 'string') {
        updateRecentDept(data.payload.departmentId);
      }
    };

    const handleTaskUpdated = () => {
      silentFetch();
    };

    socket.on('notification:new', handleNotification);
    socket.on('task:updated', handleTaskUpdated);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, pushNotification, silentFetch, updateRecentDept]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => {
          // On mobile, toggle the mobile drawer
          if (window.innerWidth < 1024) {
            setMobileOpen(!mobileOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <Topbar sidebarCollapsed={sidebarCollapsed} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
