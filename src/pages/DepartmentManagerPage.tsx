import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDepartmentStore } from '@/store/departmentStore';
import { useAuthStore } from '@/store/authStore';
import { departmentService } from '@/services/departmentService';
import { Building2, ChevronDown, RefreshCw, Loader2, Users, Clock, AlertTriangle, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MyDepartmentMembership, MemberWorkload } from '@/types';

const ROLE_COLORS = {
  OWNER: 'bg-[#FE812C]/10 text-[#FE812C] border-[#FE812C]/20',
  ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

export default function DepartmentManagerPage() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { myDepartments, loading: storeLoading, hasFetched, fetchMyDepartments } = useDepartmentStore();

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [workload, setWorkload] = useState<MemberWorkload[]>([]);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadPage, setWorkloadPage] = useState(1);
  const [workloadTotal, setWorkloadTotal] = useState(0);
  const [workloadTotalPages, setWorkloadTotalPages] = useState(1);
  const WORKLOAD_LIMIT = 10;

  const currentMembership: MyDepartmentMembership | undefined = myDepartments.find(
    (m) => m.department.id === departmentId
  );

  // Trigger fetch if store hasn't loaded yet
  useEffect(() => {
    if (!hasFetched && !storeLoading && user?.role !== 'ADMIN') {
      fetchMyDepartments();
    }
  }, []);

  // Redirect once fetch is done and user doesn't have access
  useEffect(() => {
    if (hasFetched && !storeLoading && !currentMembership) {
      navigate('/dashboard', { replace: true });
    }
  }, [hasFetched, storeLoading, currentMembership, navigate]);

  const fetchWorkload = useCallback(async (deptId: string, page: number) => {
    setWorkloadLoading(true);
    try {
      const res = await departmentService.getWorkload(deptId, { page, limit: WORKLOAD_LIMIT });
      if (res.success) {
        setWorkload(res.data);
        setWorkloadTotal(res.pagination.total);
        setWorkloadTotalPages(res.pagination.totalPages);
      }
    } catch {
      // silent
    } finally {
      setWorkloadLoading(false);
    }
  }, []);

  useEffect(() => {
    if (departmentId && currentMembership) {
      setWorkloadPage(1);
      fetchWorkload(departmentId, 1);
    }
  }, [departmentId, currentMembership, fetchWorkload]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMyDepartments(),
      departmentId ? fetchWorkload(departmentId, workloadPage) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (!currentMembership) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  const { department, role } = currentMembership;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FE812C]/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-[#FE812C]" />
          </div>

          {myDepartments.length > 1 ? (
            /* Switcher dropdown */
            <div className="relative">
              <button
                onClick={() => setSwitcherOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors"
              >
                <span className="font-bold text-foreground text-lg leading-tight">{department.name}</span>
                <ChevronDown size={16} className={cn('text-muted-foreground transition-transform', switcherOpen && 'rotate-180')} />
              </button>

              {switcherOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
                  <div className="absolute top-full mt-1 left-0 z-20 bg-card border border-border rounded-xl shadow-lg min-w-[200px] py-1 overflow-hidden">
                    {myDepartments.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSwitcherOpen(false);
                          navigate(`/dashboard/departments/${m.department.id}`);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors',
                          m.department.id === departmentId && 'bg-primary/5 text-primary font-medium'
                        )}
                      >
                        <Building2 size={14} className="shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{m.department.name}</span>
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0',
                          ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] ?? ''
                        )}>
                          {m.role}
                        </span>
                        {m.department.id === departmentId && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Static label */
            <span className="font-bold text-foreground text-xl">{department.name}</span>
          )}

          <span className={cn(
            'text-xs font-bold px-2.5 py-1 rounded-full border shrink-0',
            ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? ''
          )}>
            {role}
          </span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {department.description && (
        <p className="text-muted-foreground text-sm -mt-4">{department.description}</p>
      )}

      {/* Summary bar */}
      {(() => {
        const activeCount = workload.filter((m) => m.hasActiveSession).length;
        const overdueCount = workload.reduce((sum, m) => sum + m.tasks.overdue, 0);
        const highPriorityCount = workload.reduce((sum, m) => sum + m.tasks.highPriority, 0);
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Users, label: 'Members', value: workloadTotal, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Clock, label: 'Active Sessions', value: activeCount, color: 'text-green-500', bg: 'bg-green-500/10' },
              { icon: AlertTriangle, label: 'Overdue Tasks', value: overdueCount, color: 'text-red-500', bg: 'bg-red-500/10' },
              { icon: Zap, label: 'High Priority', value: highPriorityCount, color: 'text-[#FE812C]', bg: 'bg-[#FE812C]/10' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-none">{workloadLoading ? '–' : value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Workload table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Member Workload</h2>
        </div>

        {workloadLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : workload.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Users size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">No members found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Todo</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Doing</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Done</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {workload.map((m) => (
                    <tr
                      key={m.memberId}
                      className={cn(
                        'transition-colors hover:bg-muted/40 cursor-pointer',
                        m.tasks.overdue > 0 && 'bg-red-500/5'
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {m.profile.avatar ? (
                            <img src={m.profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {(m.profile.name || m.profile.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{m.profile.name || m.profile.email}</p>
                            {m.profile.jobTitle && (
                              <p className="text-xs text-muted-foreground truncate">{m.profile.jobTitle}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full border',
                          m.role === 'OWNER' ? 'bg-[#FE812C]/10 text-[#FE812C] border-[#FE812C]/20' :
                          m.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                          'bg-muted text-muted-foreground border-border'
                        )}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-foreground font-medium">{m.tasks.todo}</td>
                      <td className="px-3 py-3 text-center text-foreground font-medium">{m.tasks.doing}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{m.tasks.done}</td>
                      <td className="px-3 py-3 text-center">
                        {m.tasks.overdue > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                            <AlertTriangle size={12} />
                            {m.tasks.overdue}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.hasActiveSession ? (
                          <span className="inline-flex items-center gap-1.5 text-green-500 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Idle</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {workloadTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {workloadPage} of {workloadTotalPages} ({workloadTotal} members)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const p = workloadPage - 1;
                      setWorkloadPage(p);
                      fetchWorkload(departmentId!, p);
                    }}
                    disabled={workloadPage === 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const p = workloadPage + 1;
                      setWorkloadPage(p);
                      fetchWorkload(departmentId!, p);
                    }}
                    disabled={workloadPage === workloadTotalPages}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
