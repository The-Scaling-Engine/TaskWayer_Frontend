import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import TasksPage from '@/pages/TasksPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import AdminRoute from '@/components/AdminRoute';
import GuestRoute from '@/components/GuestRoute';
import UserRoute from '@/components/UserRoute';
import AdminDepartmentsPage from '@/pages/AdminDepartmentsPage';
import InvitationPage from '@/pages/InvitationPage';
import DepartmentManagerPage from '@/pages/DepartmentManagerPage';
import DeptTasksPage from '@/pages/DeptTasksPage';
import CalendarPage from '@/pages/CalendarPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invitations/accept" element={<InvitationPage />} />

        {/* Protected routes with Dashboard Layout */}
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

          {/* Admin Routes */}
          <Route 
            path="admin" 
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } 
          />
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/departments"
            element={
              <AdminRoute>
                <AdminDepartmentsPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>

      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
    </Router>
  );
}

export default App;
