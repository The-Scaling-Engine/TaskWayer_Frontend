import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Task, Comment, ProjectMember } from '@/types';
import { commentService } from '@/services/commentService';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/services/api';
import { cn } from '@/lib/utils';
import { Send, Pencil, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/core';
import { createRoot, type Root } from 'react-dom/client';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';

// ─── Types ─────────────────────────────────────────────────────

interface MentionItem {
  id: string;    // username — used by BE @username regex
  label: string;
  avatar: string | null;
}

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  onCountUpdate?: (taskId: string, count: number) => void;
  highlightCommentId?: string;
  projectMembers?: ProjectMember[];
}

// ─── MentionList popup component (mounted via ReactRenderer) ────

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.id, label: item.label });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden min-w-[200px] max-w-[280px]">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectItem(i); }}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 w-full text-sm text-left transition-colors',
            i === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60'
          )}
        >
          {item.avatar ? (
            <img src={item.avatar} alt={item.label} className="w-6 h-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
              {item.label.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium truncate leading-none">{item.label}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">@{item.id}</p>
          </div>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';

// ─── Helpers ───────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getDisplayName(author: Comment['author']): string {
  return author?.name ?? author?.username ?? 'Unknown';
}

function serializeContent(node: JSONContent): string {
  if (node.type === 'mention') return `@${node.attrs?.['id'] ?? ''}`;
  if (node.text) return node.text;
  const children = (node.content ?? []).map(serializeContent).join('');
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'paragraph') return children + '\n';
  return children;
}

function renderWithMentions(content: string) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part)
      ? <span key={i} className="text-[#FE812C] font-medium">{part}</span>
      : part
  );
}

// ─── CommentDialog ─────────────────────────────────────────────

export default function CommentDialog({
  open, onClose, task, onCountUpdate, highlightCommentId, projectMembers,
}: CommentDialogProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { socket, joinTask } = useSocketStore();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);

  const commentsRef = useRef<Comment[]>(comments);
  const commentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => { commentsRef.current = comments; }, [comments]);

  // Ref always points to latest project members — safe to read inside Tiptap extension closure
  const mentionItemsRef = useRef<MentionItem[]>([]);
  useEffect(() => {
    mentionItemsRef.current = (projectMembers ?? [])
      .filter(m => m.profile?.username)
      .map(m => ({
        id: m.profile!.username!,
        label: m.profile?.name ?? m.profile!.username!,
        avatar: m.profile?.avatar ?? null,
      }));
  }, [projectMembers]);

  // Ref for whether suggestion popup is active (used in Enter key handler)
  const suggestionActiveRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Write a comment… type @ to mention' }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: ({ query }: { query: string }) =>
            mentionItemsRef.current
              .filter(m =>
                m.label.toLowerCase().includes(query.toLowerCase()) ||
                m.id.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 6),

          render: () => {
            let root: Root | null = null;
            let container: HTMLDivElement | null = null;
            let currentRef: MentionListRef | null = null;

            const renderList = (items: MentionItem[], command: (item: { id: string; label: string }) => void) => {
              root?.render(
                <MentionList
                  ref={(r) => { currentRef = r; }}
                  items={items}
                  command={command}
                />
              );
            };

            return {
              onStart: (props: Record<string, any>) => {
                suggestionActiveRef.current = true;
                const rect: DOMRect | null = props.clientRect?.();

                container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.zIndex = '9999';
                if (rect) {
                  container.style.left = `${rect.left}px`;
                  container.style.top = `${rect.bottom + 4}px`;
                }
                document.body.appendChild(container);

                root = createRoot(container);
                renderList(props.items, props.command);
              },

              onUpdate: (props: Record<string, any>) => {
                const rect: DOMRect | null = props.clientRect?.();
                if (rect && container) {
                  container.style.left = `${rect.left}px`;
                  container.style.top = `${rect.bottom + 4}px`;
                }
                renderList(props.items, props.command);
              },

              onKeyDown: ({ event }: { event: KeyboardEvent }) => {
                if (event.key === 'Escape') {
                  suggestionActiveRef.current = false;
                  container?.remove();
                  container = null;
                  const r = root; root = null;
                  setTimeout(() => r?.unmount(), 0);
                  event.stopPropagation();
                  return true;
                }
                const handled = currentRef?.onKeyDown({ event }) ?? false;
                if (handled) event.stopPropagation();
                return handled;
              },

              onExit: () => {
                suggestionActiveRef.current = false;
                container?.remove();
                container = null;
                currentRef = null;
                const r = root; root = null;
                setTimeout(() => r?.unmount(), 0);
              },
            };
          },
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'outline-none text-sm min-h-[40px] max-h-[100px] overflow-y-auto px-3 py-2',
      },
    },
  });

  const taskId = task._id || task.id || '';

  useEffect(() => {
    if (open && taskId) {
      setCommentsLoading(true);
      commentService
        .getComments(taskId)
        .then((res) => {
          if (res.success) {
            setComments(res.data);
            onCountUpdate?.(taskId, res.count);
          }
        })
        .catch((err) => toast.error(getApiErrorMessage(err, 'Failed to load comments')))
        .finally(() => setCommentsLoading(false));
      joinTask(taskId);
    }
    if (!open) {
      setComments([]);
      editor?.commands.clearContent();
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [open, taskId, joinTask]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !highlightCommentId || comments.length === 0 || commentsLoading) return;
    const el = commentRefs.current[highlightCommentId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(highlightCommentId);
      const timer = setTimeout(() => setHighlightedId(undefined), 2500);
      return () => clearTimeout(timer);
    }
  }, [open, highlightCommentId, comments, commentsLoading]);

  useEffect(() => {
    if (!socket || !open) return;

    const handleCreated = (data: {
      commentId: string; taskId: string; content: string;
      authorId: string; authorName: string | null;
      parentId: string | null; createdAt: string;
    }) => {
      if (data.taskId !== taskId) return;
      if (commentsRef.current.some((c) => c.id === data.commentId)) return;
      const newComment: Comment = {
        id: data.commentId, taskId: data.taskId, authorId: data.authorId,
        author: { id: data.authorId, name: data.authorName },
        content: data.content, parentId: data.parentId,
        createdAt: data.createdAt, updatedAt: data.createdAt,
      };
      setComments((prev) => {
        const updated = [...prev, newComment];
        onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
        return updated;
      });
    };

    const handleUpdated = (data: { commentId: string; taskId: string; content: string; updatedAt: string }) => {
      if (data.taskId !== taskId) return;
      setComments((prev) => prev.map((c) =>
        c.id === data.commentId ? { ...c, content: data.content, updatedAt: data.updatedAt } : c
      ));
    };

    const handleDeleted = (data: { commentId: string; taskId: string }) => {
      if (data.taskId !== taskId) return;
      setComments((prev) => {
        const updated = prev.map((c) =>
          c.id === data.commentId
            ? { ...c, deletedAt: new Date().toISOString(), content: '[deleted]' }
            : c
        );
        onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
        return updated;
      });
    };

    socket.on('comment:created', handleCreated);
    socket.on('comment:updated', handleUpdated);
    socket.on('comment:deleted', handleDeleted);
    return () => {
      socket.off('comment:created', handleCreated);
      socket.off('comment:updated', handleUpdated);
      socket.off('comment:deleted', handleDeleted);
    };
  }, [socket, open, taskId, onCountUpdate]);

  const activeComments = comments.filter((c) => !c.deletedAt);

  const getEditorText = (): string => {
    if (!editor) return '';
    const json = editor.getJSON();
    return (json.content ?? []).map(serializeContent).join('').trim().replace(/\n+$/, '');
  };

  const handleSend = async () => {
    const text = getEditorText();
    if (!text) return;
    setCommentSubmitting(true);
    try {
      const res = await commentService.createComment(taskId, { content: text });
      if (res.success) {
        const comment = res.data;
        if (currentUser && (!comment.author?.name && !comment.author?.username)) {
          comment.author = {
            id: currentUser.id ?? currentUser._id,
            name: currentUser.name ?? null,
            username: currentUser.username ?? null,
            avatar: currentUser.avatar ?? null,
          };
        }
        const updated = [...comments, comment];
        setComments(updated);
        editor?.commands.clearContent();
        onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to send comment'));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleEditSave = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await commentService.updateComment(commentId, { content: editContent.trim() });
      if (res.success) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? res.data : c)));
        setEditingId(null);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update comment'));
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      const updated = comments.map((c) =>
        c.id === commentId
          ? { ...c, deletedAt: new Date().toISOString(), content: '[deleted]' }
          : c
      );
      setComments(updated);
      setDeleteConfirmId(null);
      onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete comment'));
    }
  };

  const isOwnComment = (comment: Comment) => {
    const uid = currentUser?.id ?? currentUser?._id;
    return comment.author?.id === uid || comment.authorId === uid;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2">
            <MessageSquare size={17} className="text-muted-foreground shrink-0" />
            <DialogTitle className="font-bold line-clamp-1 flex-1">{task.title}</DialogTitle>
            {activeComments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground shrink-0">
                ({activeComments.length})
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Comment list */}
        <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1 mt-1">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={22} />
            </div>
          ) : activeComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <MessageSquare size={30} className="opacity-30" />
              <p className="text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            activeComments.map((comment) => (
              <div
                key={comment.id}
                ref={(el) => { commentRefs.current[comment.id] = el; }}
                className={cn(
                  'flex gap-3 group rounded-xl transition-all duration-500',
                  highlightedId === comment.id && 'ring-2 ring-primary/60 bg-primary/5 px-2 py-1'
                )}
              >
                {comment.author?.avatar ? (
                  <img src={comment.author.avatar} alt={getDisplayName(comment.author)} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0 mt-0.5">
                    {getDisplayName(comment.author).charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground leading-none">{getDisplayName(comment.author)}</span>
                    <span className="text-xs text-muted-foreground">{comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}</span>
                  </div>
                  {comment.author?.username && comment.author.username !== comment.author.name && (
                    <p className="text-xs text-muted-foreground -mt-0.5 mb-1">@{comment.author.username}</p>
                  )}

                  {deleteConfirmId === comment.id ? (
                    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                      <span className="text-sm text-destructive flex-1">Delete this comment?</span>
                      <button onClick={() => handleDelete(comment.id)} className="text-sm font-medium text-destructive hover:text-destructive/80">Yes</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="text-sm text-muted-foreground hover:text-foreground">No</button>
                    </div>
                  ) : editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full rounded-xl text-sm min-h-[64px] resize-none border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button onClick={() => handleEditSave(comment.id)} className="text-sm font-medium text-primary hover:text-primary/80">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {renderWithMentions(comment.content)}
                      </p>
                      {isOwnComment(comment) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} className="p-1 text-muted-foreground hover:text-primary transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteConfirmId(comment.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <div className="flex-1 rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/20 transition-shadow overflow-hidden">
            <EditorContent
              editor={editor}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !suggestionActiveRef.current) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className={cn(
                '[&_.ProseMirror]:outline-none [&_.ProseMirror]:text-sm',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/60',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
                '[&_.ProseMirror_p]:my-0',
                '[&_.mention]:text-[#FE812C] [&_.mention]:font-medium',
                '[&_.mention]:bg-[#FE812C]/10 [&_.mention]:rounded [&_.mention]:px-1 [&_.mention]:py-0.5',
              )}
            />
          </div>
          <Button
            type="button"
            disabled={!editor || editor.isEmpty || commentSubmitting}
            onClick={handleSend}
            className="rounded-xl bg-[#FE812C] hover:bg-[#e5732a] text-white shrink-0 px-3 self-end"
          >
            {commentSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
