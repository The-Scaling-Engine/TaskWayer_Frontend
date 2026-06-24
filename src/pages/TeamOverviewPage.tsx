import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { adminTeamService } from '@/services/adminTeamService';
import { getApiErrorMessage } from '@/services/api';
import type { TeamOverviewMember, TeamOverviewTask } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Loader2, RefreshCw, X, UserPlus, ChevronRight,
  AlertCircle, FolderOpen,
} from 'lucide-react';
import AssignTaskDialog from '@/components/AssignTaskDialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TaskFilter = 'all' | 'todo' | 'doing' | 'done' | 'overdue';

const isOverdue = (task: TeamOverviewTask) =>
  !!task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

const formatDeadline = (deadline: string | null) => {
  if (!deadline) return null;
  return new Date(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusBadge: Record<string, string> = {
  todo:  'bg-muted text-muted-foreground border-border',
  doing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  done:  'bg-primary/10 text-primary border-primary/20',
};

const priorityBadge: Record<string, string> = {
  low:    'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
  high:   'bg-destructive/10 text-destructive border-destructive/20',
};

const filterTabs: { key: TaskFilter; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'todo',    label: 'Todo' },
  { key: 'doing',   label: 'Doing' },
  { key: 'done',    label: 'Done' },
  { key: 'overdue', label: 'Overdue' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TeamOverviewPage() {
  // ── Table state ──
  const [members, setMembers]       = useState<TeamOverviewMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // ── Drawer state ──
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamOverviewMember | null>(null);
  const [memberTasks, setMemberTasks]       = useState<TeamOverviewTask[]>([]);
  const [tasksLoading, setTasksLoading]     = useState(false);
  const [taskFilter, setTaskFilter]         = useState<TaskFilter>('all');

  // ── Assign Task dialog state ──
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // ── Load overview ──
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminTeamService.getOverview();
      setMembers(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load team overview'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchOverview(); }, [fetchOverview]);

  // ── Load member tasks ──
  const loadMemberTasks = useCallback(async (profileId: string) => {
    setTasksLoading(true);
    setMemberTasks([]);
    try {
      const tasks = await adminTeamService.getMemberTasks(profileId);
      setMemberTasks(tasks);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load tasks'));
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // ── Open drawer ──
  const openDrawer = (member: TeamOverviewMember) => {
    setSelectedMember(member);
    setTaskFilter('all');
    setDrawerOpen(true);
    void loadMemberTasks(member.profileId);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedMember(null);
    setMemberTasks([]);
  };

  // ── Filtered tasks ──
  const filteredTasks = memberTasks.filter(t => {
    if (taskFilter === 'all')     return true;
    if (taskFilter === 'overdue') return isOverdue(t);
    return t.status === taskFilter;
  });

  const overdueCount = memberTasks.filter(isOverdue).length;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor workload and task status across all team members</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold">
            {members.length} Members
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Member</th>
                <th className="px-6 py-4 font-semibold text-center">Total</th>
                <th className="px-6 py-4 font-semibold text-center">Todo</th>
                <th className="px-6 py-4 font-semibold text-center">Doing</th>
                <th className="px-6 py-4 font-semibold text-center">Done</th>
                <th className="px-6 py-4 font-semibold text-center">Overdue</th>
                <th className="px-6 py-4 font-semibold">Completion</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                    <span className="text-muted-foreground">Loading team overview...</span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <AlertCircle className="text-destructive mx-auto mb-2" size={24} />
                    <span className="text-destructive">{error}</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No team members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.profileId}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Member */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name ?? member.email} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {(member.name ?? member.email).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{member.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Counts */}
                    <td className="px-6 py-4 text-center font-semibold text-foreground">{member.totalTasks}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {member.todoCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {member.doingCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {member.doneCount}
                      </span>
                    </td>

                    {/* Overdue */}
                    <td className="px-6 py-4 text-center">
                      {member.overdueCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                          {member.overdueCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    {/* Completion Rate */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${member.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">
                          {member.completionRate}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openDrawer(member)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        View Tasks
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Drawer backdrop + panel (portal → always above all stacking contexts) ── */}
      {createPortal(
        <>
          {drawerOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-[43]"
              onClick={closeDrawer}
            />
          )}

          <div
            className={cn(
              'fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l border-border z-[44] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl',
              drawerOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
        {selectedMember && (
          <>
            {/* Drawer header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {selectedMember.avatar ? (
                  <img src={selectedMember.avatar} alt={selectedMember.name ?? selectedMember.email} className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {(selectedMember.name ?? selectedMember.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{selectedMember.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedMember.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAssignDialog(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <UserPlus size={13} />
                  Assign Task
                </button>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-5 py-3 border-b border-border shrink-0 overflow-x-auto">
              {filterTabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setTaskFilter(tab.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    taskFilter === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {tab.key === 'overdue' && overdueCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">
                      {overdueCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto">
              {tasksLoading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Loader2 className="animate-spin text-primary" size={22} />
                  <span className="text-sm text-muted-foreground">Loading tasks...</span>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                  <FolderOpen size={32} className="opacity-40" />
                  <p className="text-sm">No tasks found</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredTasks.map(task => {
                    const overdue = isOverdue(task);
                    return (
                      <li key={task.id} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn(
                            'text-sm font-medium leading-snug flex-1',
                            overdue ? 'text-destructive' : 'text-foreground'
                          )}>
                            {task.title}
                          </p>
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize shrink-0',
                            statusBadge[task.status]
                          )}>
                            {task.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {task.priority && (
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize',
                              priorityBadge[task.priority]
                            )}>
                              {task.priority}
                            </span>
                          )}
                          {task.deadline && (
                            <span className={cn(
                              'text-[11px]',
                              overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
                            )}>
                              {overdue ? '⚠ ' : ''}{formatDeadline(task.deadline)}
                            </span>
                          )}
                          {task.project && (
                            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                              <FolderOpen size={10} />
                              {task.project.name}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-3 border-t border-border shrink-0">
              <p className="text-xs text-muted-foreground">
                {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
                {taskFilter !== 'all' ? ` · ${taskFilter}` : ''}
              </p>
            </div>
          </>
        )}
          </div>
        </>,
        document.body
      )}

      <AssignTaskDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        member={selectedMember}
        onSuccess={() => selectedMember && void loadMemberTasks(selectedMember.profileId)}
      />
    </div>
  );
}
