import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { BoardColumn, ProjectMember } from '@/types';
import { boardColumnService } from '@/services/boardColumnService';
import { projectService } from '@/services/projectService';
import { taskService, type DraftTask } from '@/services/taskService';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { Sparkles, Trash2, Loader2, ArrowLeft, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Priority = 'low' | 'medium' | 'high';

interface DraftItem extends DraftTask {
  assignedTo: string; // profileId — '' means Unassigned
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated?: (count: number) => void;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low:    'text-blue-500',
  medium: 'text-yellow-500',
  high:   'text-red-500',
};

const PRIORITY_BG: Record<Priority, string> = {
  low:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  high:   'bg-red-500/10 text-red-600 dark:text-red-400',
};

type Step = 'input' | 'review';

function matchAssignee(aiName: string | undefined, members: ProjectMember[]): string {
  if (!aiName?.trim()) return '';
  const lower = aiName.toLowerCase();
  const match = members.find(m => {
    const memberName = m.profile?.name?.toLowerCase() ?? '';
    return memberName && (memberName.includes(lower) || lower.includes(memberName));
  });
  return match?.profileId ?? '';
}

export default function ImportMarkdownDialog({ open, onClose, projectId, onCreated }: Props) {
  const [step, setStep]               = useState<Step>('input');
  const [markdown, setMarkdown]       = useState('');
  const [drafts, setDrafts]           = useState<DraftItem[]>([]);
  const [columns, setColumns]         = useState<BoardColumn[]>([]);
  const [members, setMembers]         = useState<ProjectMember[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [extracting, setExtracting]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    boardColumnService.getColumns(projectId)
      .then(res => {
        const sorted = [...res.data].sort((a, b) => a.order - b.order);
        setColumns(sorted);
        setSelectedColumnId(prev => prev || (sorted[0]?.id ?? ''));
      })
      .catch(() => {});
    projectService.getMembers(projectId)
      .then(res => setMembers(res.data))
      .catch(() => {});
  }, [open, projectId]);

  useEffect(() => {
    if (!open) {
      setStep('input');
      setMarkdown('');
      setDrafts([]);
      setSelectedColumnId('');
    }
  }, [open]);

  const handleExtract = async () => {
    if (!markdown.trim()) return;
    setExtracting(true);
    try {
      const result = await taskService.importDraftFromMarkdown(projectId, markdown);
      if (result.length === 0) {
        toast.info('No action items found in the provided text.');
        return;
      }
      setDrafts(result.map(d => ({
        ...d,
        assignedTo: matchAssignee(d.assignee, members),
      })));
      setStep('review');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExtracting(false);
    }
  };

  const updateDraft = (index: number, patch: Partial<DraftItem>) => {
    setDrafts(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));
  };

  const removeDraft = (index: number) => {
    setDrafts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (drafts.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(drafts.map(d => taskService.createTask({
        title:       d.title,
        description: d.description,
        priority:    d.priority,
        deadline:    d.dueDate ? new Date(d.dueDate).toISOString() : undefined,
        assignedTo:  d.assignedTo || undefined,
        projectId,
        columnId:    selectedColumnId || null,
      })));
      toast.success(`${drafts.length} task${drafts.length === 1 ? '' : 's'} created`);
      onCreated?.(drafts.length);
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (extracting || submitting) return;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#FE812C]" />
            Import Tasks from Notes
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Paste markdown ── */}
        {step === 'input' && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-1 pr-1">
              <div>
                <Label className="mb-1.5 block text-sm">
                  Paste your meeting notes or markdown text:
                </Label>
                <Textarea
                  placeholder={`Example:\n- John will fix the login bug by Friday\n- Sarah to prepare Q3 report\n- Schedule kickoff meeting next week [high]`}
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  rows={10}
                  className="resize-none text-sm font-mono"
                  autoFocus
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  AI will extract action items, assignees, deadlines, and priority from your text.
                </p>
              </div>
            </div>

            <DialogFooter className="shrink-0 pt-2 gap-2">
              <Button variant="outline" onClick={handleClose} disabled={extracting}>
                Cancel
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!markdown.trim() || extracting}
                className="bg-[#FE812C] hover:bg-[#e5732a] text-white gap-2"
              >
                {extracting ? (
                  <><Loader2 size={15} className="animate-spin" /> Extracting...</>
                ) : (
                  <><Sparkles size={15} /> Extract Tasks</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Review & edit drafts ── */}
        {step === 'review' && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-1 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              <p className="text-sm text-muted-foreground">
                {drafts.length} task{drafts.length !== 1 ? 's' : ''} extracted — review and edit before creating:
              </p>

              {drafts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All tasks removed. Go back to re-extract.
                </p>
              )}

              {drafts.map((draft, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={draft.title}
                        onChange={e => updateDraft(i, { title: e.target.value })}
                        placeholder="Task title"
                        className="h-8 text-sm font-medium"
                      />
                      <Textarea
                        value={draft.description ?? ''}
                        onChange={e => updateDraft(i, { description: e.target.value || undefined })}
                        placeholder="Description (optional)"
                        rows={2}
                        className="resize-none text-xs text-muted-foreground"
                      />
                    </div>
                    <button
                      onClick={() => removeDraft(i)}
                      className="mt-0.5 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Priority */}
                    <Select
                      value={draft.priority}
                      onValueChange={v => updateDraft(i, { priority: v as Priority })}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[200]">
                        {(['low', 'medium', 'high'] as Priority[]).map(p => (
                          <SelectItem key={p} value={p}>
                            <span className={cn('font-semibold uppercase text-[11px]', PRIORITY_COLORS[p])}>
                              {p}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Due date */}
                    <Input
                      type="date"
                      value={draft.dueDate ?? ''}
                      onChange={e => updateDraft(i, { dueDate: e.target.value || undefined })}
                      className="h-7 w-36 text-xs"
                    />

                    {/* Assignee select */}
                    <Select
                      value={draft.assignedTo || '__unassigned__'}
                      onValueChange={v => updateDraft(i, { assignedTo: v === '__unassigned__' ? '' : v })}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs gap-1">
                        <UserCircle2 size={12} className="text-muted-foreground shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[200]">
                        <SelectItem value="__unassigned__">
                          <span className="text-muted-foreground">Unassigned</span>
                        </SelectItem>
                        {members.map(m => (
                          <SelectItem key={m.profileId} value={m.profileId}>
                            <div className="flex items-center gap-1.5">
                              {m.profile?.avatar ? (
                                <img src={m.profile.avatar} className="w-4 h-4 rounded-full object-cover" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                                  {m.profile?.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                              )}
                              <span>{m.profile?.name ?? m.profileId}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Priority badge */}
                    <span className={cn('text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ml-auto', PRIORITY_BG[draft.priority])}>
                      {draft.priority}
                    </span>
                  </div>
                </div>
              ))}

              {/* Column selector */}
              {columns.length > 0 && (
                <div className="pt-1">
                  <Label className="mb-1.5 block text-sm">Add to column</Label>
                  <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[200]">
                      {columns.map(col => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 pt-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('input')}
                disabled={submitting}
                className="gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={drafts.length === 0 || submitting}
                className="bg-[#FE812C] hover:bg-[#e5732a] text-white gap-2"
              >
                {submitting ? (
                  <><Loader2 size={15} className="animate-spin" /> Creating...</>
                ) : (
                  `Create ${drafts.length} Task${drafts.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
