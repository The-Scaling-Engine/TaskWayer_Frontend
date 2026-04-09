import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { adminService } from '@/services/adminService';
import type { AdminUser } from '@/types';
import { toast } from 'sonner';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';

export default function AdminUsersPage() {
  const currentUser = useAuthStore(s => s.user);
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getUsers({ 
        page: currentPage, 
        limit: 10, 
        search: debouncedSearch 
      });
      if (res.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pagination.totalPages);
        setTotalUsers(res.data.pagination.totalUsers);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users list');
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (user: AdminUser) => {
    // Prevent banning self
    if (user.id === currentUser?._id) {
      toast.error('You cannot change your own status');
      return;
    }

    const isBanning = user.status === 'ACTIVE';
    try {
      if (isBanning) {
        await adminService.banUser(user.id);
        toast.success(`User ${user.email} has been banned`);
      } else {
        await adminService.unbanUser(user.id);
        toast.success(`User ${user.email} has been unbanned`);
      }
      
      // Update local state without full refetch to be optimistically responsive
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: isBanning ? 'BANNED' : 'ACTIVE' } : u
      ));
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isBanning ? 'ban' : 'unban'} user`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage accounts, roles, and platform access</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Users size={18} />
            {totalUsers} Total Accounts
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by email address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border focus:border-primary/50 focus:bg-background rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">User details</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined at</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                    <span className="text-muted-foreground">Loading users...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID: {user.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.role === 'ADMIN' 
                          ? 'bg-[#FE812C]/10 border-[#FE812C]/20 text-[#FE812C]' 
                          : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.status === 'BANNED' 
                          ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'BANNED' ? 'bg-destructive' : 'bg-primary'}`} />
                        {user.status === 'BANNED' ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== currentUser?._id && user.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground'
                              : 'text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <>
                              <ShieldAlert size={14} /> Ban
                            </>
                          ) : (
                            <>
                              <ShieldCheck size={14} /> Restore
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of <span className="font-medium text-foreground">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
