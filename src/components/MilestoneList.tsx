import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, XCircle, Loader2, ChevronDown } from 'lucide-react';
import { useMilestoneStore } from '@/store/milestoneStore';
import type { Milestone, MilestoneStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';

interface Props {
  projectId: string;
  canManage: boolean;
}

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; icon: typeof Circle; color: string }> = {
  ACTIVE:    { label: 'Active',    icon: Circle,       color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', icon: XCircle,      color: 'text-muted-foreground bg-muted/50 border-border' },
};

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface FormState {
  title: string;
  description: string;
  startDate: string;
  deadline: string;
  status?: MilestoneStatus;
}

const EMPTY_FORM: FormState = { title: '', description: '', startDate: '', deadline: '' };

export default function MilestoneList({ projectId, canManage }: Props) {
  const { milestones, loading, fetch, create, update, remove } = useMilestoneStore();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(projectId);
  }, [projectId, fetch]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCreating(true);
  };

  const openEdit = (m: Milestone) => {
    setForm({
      title:       m.title,
      description: m.description ?? '',
      startDate:   m.startDate ? m.startDate.slice(0, 10) : '',
      deadline:    m.deadline  ? m.deadline.slice(0, 10)  : '',
      status:      m.status,
    });
    setCreating(false);
    setEditingId(m.id);
  };

  const closeForm = () => { setCreating(false); setEditingId(null); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        startDate:   form.startDate ? new Date(form.startDate).toISOString() : null,
        deadline:    form.deadline  ? new Date(form.deadline).toISOString()  : null,
        ...(editingId && form.status !== undefined && { status: form.status }),
      };
      if (creating) {
        await create(projectId, payload);
        toast.success('Milestone created');
      } else if (editingId) {
        await update(projectId, editingId, payload);
        toast.success('Milestone updated');
      }
      closeForm();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await remove(projectId, id);
      toast.success('Milestone deleted');
      setDeleteConfirmId(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button
            onClick={openCreate}
            className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl gap-2"
          >
            <Plus size={15} /> New Milestone
          </Button>
        </div>
      )}

      {/* Create/Edit form */}
      {(creating || editingId !== null) && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">{creating ? 'New Milestone' : 'Edit Milestone'}</h3>

          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Milestone title"
              className="rounded-xl"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description..."
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          {editingId && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as MilestoneStatus }))}
                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <button
              onClick={closeForm}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl gap-2"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              {saving ? 'Saving...' : creating ? 'Create' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading && milestones.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <p className="text-sm text-muted-foreground">No milestones yet.</p>
          {canManage && (
            <p className="text-xs text-muted-foreground">Click <span className="text-[#FE812C] font-medium">New Milestone</span> to create one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map(m => {
            const cfg = STATUS_CONFIG[m.status];
            const Icon = cfg.icon;
            const isExpanded = expandedId === m.id;
            const isEditing = editingId === m.id;
            if (isEditing) return null;

            return (
              <div key={m.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                >
                  <Icon size={15} className={cn('shrink-0', cfg.color.split(' ')[0])} />
                  <span className="flex-1 font-medium text-sm text-foreground truncate">{m.title}</span>
                  <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0', cfg.color)}>
                    {cfg.label}
                  </span>
                  {(m.deadline || m.startDate) && (
                    <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
                      {fmt(m.startDate) && `${fmt(m.startDate)} → `}{fmt(m.deadline) ?? '—'}
                    </span>
                  )}
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(m.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <ChevronDown size={14} className={cn('text-muted-foreground transition-transform shrink-0', isExpanded && 'rotate-180')} />
                </div>

                {isExpanded && (
                  <div className="border-t border-border px-4 py-3 space-y-1 text-sm text-muted-foreground bg-muted/10">
                    {m.description && <p className="text-foreground">{m.description}</p>}
                    <div className="flex flex-wrap gap-4 text-xs pt-1">
                      {m.startDate && <span>Start: <span className="text-foreground">{fmt(m.startDate)}</span></span>}
                      {m.deadline  && <span>Deadline: <span className="text-foreground">{fmt(m.deadline)}</span></span>}
                      {m.completedAt && <span>Completed: <span className="text-emerald-600">{fmt(m.completedAt)}</span></span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold">Delete Milestone</h3>
            <p className="text-sm text-muted-foreground">
              Delete milestone <span className="font-semibold text-foreground">
                {milestones.find(m => m.id === deleteConfirmId)?.title}
              </span>? Tasks linked to this milestone will be unlinked.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={!!deletingId}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-destructive hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {deletingId && <Loader2 size={14} className="animate-spin" />}
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
