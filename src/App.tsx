import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AdminRoute from '@/components/AdminRoute';
import GuestRoute from '@/components/GuestRoute';
import UserRoute from '@/components/UserRoute';

// ── Static imports — core routes loaded immediately ──────────────
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import InvitationPage from '@/pages/InvitationPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import DeptTasksPage from '@/pages/DeptTasksPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';

// ── Lazy imports — chunks fetched only when the route is first visited ──
const CalendarPage         = lazy(() => import('@/pages/CalendarPage'));
const AnalyticsPage        = lazy(() => import('@/pages/AnalyticsPage'));
const DepartmentManagerPage = lazy(() => import('@/pages/DepartmentManagerPage'));
const AdminDashboardPage   = lazy(() => import('@/pages/AdminDashboardPage'));
const AdminUsersPage       = lazy(() => import('@/pages/AdminUsersPage'));
const AdminDepartmentsPage = lazy(() => import('@/pages/AdminDepartmentsPage'));

// ── Fallback spinner shown while a lazy chunk is downloading ─────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[240px]">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      {/* Suspense wraps Routes so any lazy page shows the spinner while loading */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invitations/accept" element={<InvitationPage />} />

          {/* Protected routes — share DashboardLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<UserRoute><TasksPage /></UserRoute>} />
            <Route path="calendar" element={<UserRoute><CalendarPage /></UserRoute>} />
            <Route path="analytics" element={<UserRoute><AnalyticsPage /></UserRoute>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="departments/:departmentId" element={<DepartmentManagerPage />} />
            <Route path="departments/:departmentId/tasks" element={<DeptTasksPage />} />

            {/* Admin-only routes */}
            <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="admin/departments" element={<AdminRoute><AdminDepartmentsPage /></AdminRoute>} />
          </Route>
        </Routes>
      </Suspense>

      {/* Toaster stays outside Suspense so toasts work during chunk loading */}
      <Toaster position="top-right" richColors closeButton />
    </Router>
  );
}

export default App;
