import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { Task, Comment } from '@/types';
import { commentService } from '@/services/commentService';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { toast } from 'sonner';
import { Send, Pencil, Trash2, MessageSquare, Loader2 } from 'lucide-react';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  task: Task;
  onCountUpdate?: (taskId: string, count: number) => void;
}

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

export default function CommentDialog({ open, onClose, task, onCountUpdate }: CommentDialogProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { socket, joinTask } = useSocketStore();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Keep a ref to comments so socket handlers always have latest value
  const commentsRef = useRef<Comment[]>(comments);
  useEffect(() => { commentsRef.current = comments; }, [comments]);

  // Fetch comments + join task room when dialog opens
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
        .catch(() => toast.error('Failed to load comments'))
        .finally(() => setCommentsLoading(false));

      joinTask(taskId);
    }
    if (!open) {
      setComments([]);
      setCommentInput('');
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [open, taskId, joinTask]);

  // Real-time comment events
  useEffect(() => {
    if (!socket || !open) return;

    const handleCreated = (data: { commentId: string; taskId: string; content: string; authorId: string; authorName: string | null; parentId: string | null; createdAt: string }) => {
      if (data.taskId !== taskId) return;
      // Deduplicate: skip if already added optimistically by the current user
      if (commentsRef.current.some((c) => c.id === data.commentId)) return;
      const newComment: Comment = {
        id: data.commentId,
        taskId: data.taskId,
        authorId: data.authorId,
        author: { id: data.authorId, name: data.authorName },
        content: data.content,
        parentId: data.parentId,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
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
          c.id === data.commentId ? { ...c, deletedAt: new Date().toISOString(), content: '[deleted]' } : c
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

  const handleSend = async () => {
    if (!commentInput.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await commentService.createComment(taskId, { content: commentInput.trim() });
      if (res.success) {
        // Inject current user info if BE response has incomplete author
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
        setCommentInput('');
        onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
      }
    } catch {
      toast.error('Failed to send comment');
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
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId);
      const updated = comments.map((c) =>
        c.id === commentId ? { ...c, deletedAt: new Date().toISOString(), content: '[deleted]' } : c
      );
      setComments(updated);
      setDeleteConfirmId(null);
      onCountUpdate?.(taskId, updated.filter((c) => !c.deletedAt).length);
    } catch {
      toast.error('Failed to delete comment');
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
              <div key={comment.id} className="flex gap-3 group">
                {/* Avatar */}
                {comment.author?.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={getDisplayName(comment.author)}
                    className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0 mt-0.5">
                    {getDisplayName(comment.author).charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Author info */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground leading-none">
                      {getDisplayName(comment.author)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.createdAt ? formatRelativeTime(comment.createdAt) : ''}
                    </span>
                  </div>
                  {comment.author?.username && comment.author.username !== comment.author.name && (
                    <p className="text-xs text-muted-foreground -mt-0.5 mb-1">
                      @{comment.author.username}
                    </p>
                  )}

                  {/* Content */}
                  {deleteConfirmId === comment.id ? (
                    <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                      <span className="text-sm text-destructive flex-1">Delete this comment?</span>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-sm font-medium text-destructive hover:text-destructive/80"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        No
                      </button>
                    </div>
                  ) : editingId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="rounded-xl text-sm min-h-[64px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditSave(comment.id)}
                          className="text-sm font-medium text-primary hover:text-primary/80"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                      {isOwnComment(comment) && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(comment.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* New comment input */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Textarea
            placeholder="Write a comment... (Enter to send, Shift+Enter for new line)"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="rounded-xl text-sm min-h-[40px] max-h-[100px] resize-none flex-1"
          />
          <Button
            type="button"
            disabled={!commentInput.trim() || commentSubmitting}
            onClick={handleSend}
            className="rounded-xl bg-[#FE812C] hover:bg-[#e5732a] text-white shrink-0 px-3 self-end"
          >
            {commentSubmitting
              ? <Loader2 className="animate-spin" size={16} />
              : <Send size={16} />
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
