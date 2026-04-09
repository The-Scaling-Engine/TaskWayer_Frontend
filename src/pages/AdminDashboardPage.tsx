import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminService } from '@/services/adminService';
import type { AdminDashboardStats, AdminUser } from '@/types';
import UserStatsChart from '@/components/charts/UserStatsChart';

import {
  Users,
  UserX,
  CheckSquare,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, usersRes] = await Promise.all([
          adminService.getDashboard(),
          // Fetch up to 50 latest users to show trends over recent signups
          adminService.getUsers({ limit: 50 })
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
        }
        if (usersRes.success) {
          setRecentUsers(usersRes.data.users);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Platform overview and user statistics for {user?.name || user?.email}</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
          <Loader2 className="animate-spin text-primary mb-4" size={40} />
          <p className="text-muted-foreground font-medium">Loading platform data...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="text-destructive shrink-0" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-destructive">Error Loading Data</h3>
            <p className="text-sm text-destructive mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Total Users */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-primary">{stats?.totalUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="text-primary" size={24} />
              </div>
            </div>

            {/* Banned Users */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Banned Users</p>
                <p className="text-3xl font-bold text-destructive">{stats?.bannedUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <UserX className="text-destructive" size={24} />
              </div>
            </div>

            {/* Total Tasks */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Total Tasks Tracked</p>
                <p className="text-3xl font-bold text-[#FE812C]">{stats?.totalTasks || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#FE812C]/10 rounded-xl flex items-center justify-center">
                <CheckSquare className="text-[#FE812C]" size={24} />
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 gap-6">
            <UserStatsChart 
              users={recentUsers} 
              loading={loading} 
            />
          </div>
        </>
      )}
    </div>
  );
}
