import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, Users, Archive, Trash2, Settings2, Loader2,
  ArchiveRestore, FolderX, Building2, Search, X, ChevronDown,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { useDepartmentStore } from '@/store/departmentStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

type RoleFilter = 'all' | 'owned' | 'managing' | 'member';
type SortKey = 'name' | 'members' | 'tasks' | 'newest' | 'oldest';

export default function ProjectsPage() {
  const navigate = useNavigate();
  const {
    projects, loading, hasFetched,
    fetchProjects, createProject, archiveProject, unarchiveProject, deleteProject,
  } = useProjectStore();
  const currentUser = useAuthStore((s) => s.user);
  const allMemberships = useDepartmentStore((s) => s.allMemberships);

  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);

  useEffect(() => {
    if (!hasFetched) fetchProjects();
  }, [hasFetched, fetchProjects]);

  const currentUserId = currentUser?.id ?? currentUser?._id;
  const activeProjects = projects.filter((p) => !p.archivedAt && !p.deletedAt);
  const archivedProjects = projects.filter((p) => p.archivedAt && !p.deletedAt);

  const myDepts = useMemo(() => {
    const seen = new Set<string>();
    return allMemberships
      .filter((m) => m.status === 'ACTIVE')
      .filter((m) => { if (seen.has(m.department.id)) return false; seen.add(m.department.id); return true; })
      .map((m) => ({ id: m.department.id, name: m.department.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMemberships]);

  const displayProjects = useMemo(() => {
    const base = tab === 'active' ? activeProjects : archivedProjects;

    const filtered = base.filter((p) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'all') {
        const isOwner = p.ownerId === currentUserId;
        const myRole = p.members?.find((m) => m.profileId === currentUserId)?.role;
        if (roleFilter === 'owned' && !isOwner) return false;
        if (roleFilter === 'managing' && myRole !== 'MANAGER') return false;
        if (roleFilter === 'member' && myRole !== 'MEMBER' && myRole !== 'VIEWER') return false;
      }
      if (deptFilter) {
        const linked = (p.departments ?? []).some((d) => d.departmentId === deptFilter);
        if (!linked) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'members') return (b._count?.members ?? 0) - (a._count?.members ?? 0);
      if (sortKey === 'tasks') return (b._count?.tasks ?? 0) - (a._count?.tasks ?? 0);
      if (sortKey === 'oldest') return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [tab, activeProjects, archivedProjects, search, roleFilter, deptFilter, sortKey, currentUserId]);

  const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'owned', label: 'Owned by me' },
    { key: 'managing', label: 'Managing' },
    { key: 'member', label: 'Member' },
  ];

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'newest', label: 'Newest' },
    { key: 'oldest', label: 'Oldest' },
    { key: 'name', label: 'Name A→Z' },
    { key: 'members', label: 'Most members' },
    { key: 'tasks', label: 'Most tasks' },
  ];

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const newProject = await createProject({ name: createName.trim(), description: createDesc.trim() || undefined });
      toast.success('Project created');
      setCreateOpen(false);
      setCreateName('');
      setCreateDesc('');
      navigate(`/dashboard/projects/${newProject.id}/tasks`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create project'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveProject(id);
      toast.success('Project archived');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to archive project'));
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveProject(id);
      toast.success('Project restored');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to restore project'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await deleteProject(deleteConfirm);
      toast.success('Project deleted');
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete project'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FE812C]/10 flex items-center justify-center shrink-0">
            <FolderOpen size={18} className="text-[#FE812C]" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">Projects</h1>
            <p className="text-xs text-muted-foreground">{activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Project</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(['active', 'archived'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'active' ? `Active (${activeProjects.length})` : `Archived (${archivedProjects.length})`}
          </button>
        ))}
      </div>

      {/* Search + Filter + Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-8 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border',
                roleFilter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dept filter dropdown */}
        {myDepts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setDeptOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-colors',
                deptFilter
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              <Building2 size={13} />
              <span className="max-w-[120px] truncate">
                {deptFilter ? (myDepts.find((d) => d.id === deptFilter)?.name ?? 'Department') : 'Department'}
              </span>
              {deptFilter
                ? <X size={12} onClick={(e) => { e.stopPropagation(); setDeptFilter(null); }} className="hover:text-destructive" />
                : <ChevronDown size={13} className={cn('transition-transform', deptOpen && 'rotate-180')} />
              }
            </button>
            {deptOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDeptOpen(false)} />
                <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] max-h-52 overflow-y-auto">
                  {myDepts.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setDeptFilter(d.id); setDeptOpen(false); }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs font-medium transition-colors truncate',
                        deptFilter === d.id
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? 'Sort'}</span>
            <ChevronDown size={13} className={cn('transition-transform', sortOpen && 'rotate-180')} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setSortOpen(false); }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs font-medium transition-colors',
                      sortKey === opt.key
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project list */}
      {loading && !hasFetched ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : displayProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          {search || roleFilter !== 'all' || deptFilter ? (
            <>
              <FolderX size={32} className="text-muted-foreground/40" />
              <div className="text-center">
                <p className="font-medium text-foreground">No projects match</p>
                <p className="text-sm mt-1">Try a different search or filter</p>
              </div>
              <button
                onClick={() => { setSearch(''); setRoleFilter('all'); setDeptFilter(null); }}
                className="text-xs text-primary hover:underline"
              >
                Clear filters
              </button>
            </>
          ) : tab === 'active' ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[#FE812C]/10 flex items-center justify-center">
                <FolderOpen size={28} className="text-[#FE812C]" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No projects yet</p>
                <p className="text-sm mt-1">Create your first project to start organizing tasks</p>
              </div>
              <Button
                onClick={() => setCreateOpen(true)}
                className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl gap-2"
              >
                <Plus size={16} /> Create Project
              </Button>
            </>
          ) : (
            <>
              <FolderX size={32} className="text-muted-foreground/40" />
              <p className="text-sm">No archived projects</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProjects.map((project) => {
            const isOwner = project.ownerId === currentUserId;
            const myRole = project.members?.find((m) => m.profileId === currentUserId)?.role;
            const isOwnerOrManager = isOwner || myRole === 'MANAGER';
            const managedLinkedDepts = (project.departments ?? []).filter((link) =>
              allMemberships.some(
                (m) => m.department.id === link.departmentId &&
                       ['OWNER', 'ADMIN'].includes(m.role) &&
                       m.status === 'ACTIVE'
              )
            );
            return (
              <div
                key={project.id}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col gap-3"
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FE812C]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FolderOpen size={16} className="text-[#FE812C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{project.description}</p>
                    )}
                  </div>
                  {isOwner && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FE812C]/10 text-[#FE812C] border border-[#FE812C]/20 shrink-0">
                      OWNER
                    </span>
                  )}
                  {project.visibilitySource === 'DEPARTMENT' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                      via {project.departments?.[0]?.department?.name ?? 'Department'}
                    </span>
                  )}
                  {project.visibilitySource === 'ORG_ADMIN' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                      Admin view
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {project._count?.members ?? 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderOpen size={11} />
                    {project._count?.tasks ?? 0} tasks
                  </span>
                  {managedLinkedDepts.length > 0 && (
                    <span
                      className="flex items-center gap-1"
                      title={managedLinkedDepts.map((l) => l.department?.name ?? l.departmentId).join(', ')}
                    >
                      <Building2 size={11} />
                      {managedLinkedDepts.length === 1
                        ? (managedLinkedDepts[0].department?.name ?? 'Department')
                        : managedLinkedDepts.length === 2
                          ? `${managedLinkedDepts[0].department?.name ?? 'Dept'} +1`
                          : `${managedLinkedDepts.length} depts`}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${project.id}/tasks`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FE812C]/10 text-[#FE812C] hover:bg-[#FE812C]/20 text-xs font-semibold transition-colors"
                  >
                    <FolderOpen size={12} />
                    Tasks
                  </button>
                  {isOwnerOrManager && (
                    <button
                      onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
                    >
                      <Settings2 size={12} />
                      Manage
                    </button>
                  )}
                  {isOwnerOrManager && tab === 'active' && (
                    <button
                      onClick={() => handleArchive(project.id)}
                      className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Archive project"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                  {isOwnerOrManager && tab === 'archived' && (
                    <button
                      onClick={() => handleUnarchive(project.id)}
                      className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Restore project"
                    >
                      <ArchiveRestore size={14} />
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={() => setDeleteConfirm(project.id)}
                      className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create project dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-foreground">New Project</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. Product Launch Q3"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="project-desc"
                  placeholder="What is this project about?"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setCreateOpen(false); setCreateName(''); setCreateDesc(''); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createLoading || !createName.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#FE812C] hover:bg-[#e5732a] disabled:opacity-60 transition-colors"
              >
                {createLoading && <Loader2 size={14} className="animate-spin" />}
                {createLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-foreground">Delete Project</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the project and all its data. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
