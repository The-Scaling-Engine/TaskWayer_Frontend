import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { useRef, useState } from 'react';
import { Bold, Italic, Link2, ImageIcon, Paperclip, Loader2 } from 'lucide-react';
import { uploadFile } from '@/services/uploadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ── Read-only renderer (used in TaskCard, assigned read-only state) ── */
export function DescriptionView({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, { ADD_TAGS: ['img'], ADD_ATTR: ['src', 'alt', 'href', 'target'] });
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-1',
        '[&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

interface DescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function DescriptionEditor({
  value,
  onChange,
  placeholder = 'Add a description (optional)...',
  disabled = false,
  className,
}: DescriptionEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExt.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      ImageExt.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  const handleUpload = async (file: File, type: 'image' | 'file') => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (type === 'image') {
        editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
      } else {
        editor?.chain().focus().insertContent(
          `<a href="${url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`
        ).run();
      }
    } catch {
      toast.error('Upload failed. Make sure the "task-attachments" Supabase Storage bucket exists.');
    } finally {
      setUploading(false);
    }
  };

  const confirmLink = () => {
    if (linkUrl.trim()) {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().setLink({ href, target: '_blank' }).run();
    } else {
      editor?.chain().focus().unsetLink().run();
    }
    setLinkMode(false);
    setLinkUrl('');
  };

  if (disabled) {
    return <DescriptionView html={value} className={className} />;
  }

  return (
    <div className={cn('border border-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-shadow', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/30 flex-wrap">
        <ToolbarBtn
          active={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold size={12} />
        </ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic size={12} />
        </ToolbarBtn>

        <div className="w-px h-3.5 bg-border mx-1" />

        <ToolbarBtn
          active={editor?.isActive('link') || linkMode}
          onClick={() => { setLinkMode(m => !m); setLinkUrl(editor?.getAttributes('link').href ?? ''); }}
          title="Insert link"
        >
          <Link2 size={12} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => imageInputRef.current?.click()}
          title="Upload image"
          disabled={uploading}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title="Upload PDF / file"
          disabled={uploading}
        >
          <Paperclip size={12} />
        </ToolbarBtn>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'image');
            e.target.value = '';
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f, 'file');
            e.target.value = '';
          }}
        />
      </div>

      {/* Inline link input */}
      {linkMode && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-muted/20">
          <input
            autoFocus
            type="url"
            placeholder="https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmLink(); } if (e.key === 'Escape') { setLinkMode(false); setLinkUrl(''); } }}
            className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={confirmLink}
            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary text-primary-foreground hover:opacity-90"
          >
            Apply
          </button>
        </div>
      )}

      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className={cn(
          'px-3 py-2 min-h-[90px] text-sm',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p]:my-0.5',
          '[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline',
          '[&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:my-1',
        )}
      />
    </div>
  );
}

function ToolbarBtn({
  children, onClick, active, title, disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  );
}
