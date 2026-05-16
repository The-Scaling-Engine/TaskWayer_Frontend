import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDepartmentStore } from '@/store/departmentStore';
import { useAuthStore } from '@/store/authStore';
import { Building2, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MyDepartmentMembership } from '@/types';

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyDepartments();
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

      {/* Placeholder — workload & member management added in Steps 10.4–10.6 */}
      <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Building2 size={24} className="text-primary" />
        </div>
        <p className="text-foreground font-semibold">Department Overview coming soon</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          Workload table, member activity, and team management will appear here.
        </p>
      </div>
    </div>
  );
}
