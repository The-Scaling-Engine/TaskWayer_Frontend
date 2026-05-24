import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import { useRef, useState, useMemo } from 'react';
import { Bold, Italic, Link2, ImageIcon, Paperclip, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { uploadFile } from '@/services/uploadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const GALLERY_MAX = 3; // visible slots before overflow

// ── HTML helpers ────────────────────────────────────────────────
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['img'],
    ADD_ATTR: ['src', 'alt', 'href', 'target', 'rel'],
  });
}

function extractImages(html: string): { textHtml: string; images: string[] } {
  const clean = sanitizeHtml(html);
  const div = document.createElement('div');
  div.innerHTML = clean;
  const imgEls = Array.from(div.querySelectorAll('img'));
  const images = imgEls.map(img => img.getAttribute('src') ?? '').filter(Boolean);
  imgEls.forEach(img => img.remove());
  return { textHtml: div.innerHTML, images };
}

function buildHtml(textHtml: string, images: string[]): string {
  const text = textHtml === '<p></p>' ? '' : textHtml;
  const imgHtml = images.map(s => `<img src="${s}" />`).join('');
  return text + imgHtml;
}

// ── Lightbox ────────────────────────────────────────────────────
function ImageLightbox({ images, index, onClose, onNav }: {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}) {
  return (
    <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-full p-3 border-none bg-black/95 [&>button]:text-white/60">
        <div className="relative flex items-center justify-center min-h-[35vh]">
          <img
            src={images[index]}
            alt={`Image ${index + 1} of ${images.length}`}
            className="max-w-full max-h-[78vh] object-contain rounded-lg"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onNav((index - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => onNav((index + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/55 bg-black/50 px-2.5 py-0.5 rounded-full select-none">
                {index + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared gallery row (editor + read-only) ──────────────────────
function ImageGalleryRow({ images, onLightbox, onRemove }: {
  images: string[];
  onLightbox: (i: number) => void;
  onRemove?: (i: number) => void;
}) {
  if (images.length === 0) return null;
  const visible = images.slice(0, GALLERY_MAX);
  const overflow = images.length - GALLERY_MAX;

  return (
    <div className="flex gap-1.5 flex-nowrap">
      {visible.map((src, i) => (
        <div
          key={i}
          className="relative shrink-0 h-[72px] w-[72px] rounded-lg overflow-hidden group cursor-pointer"
          onClick={() => onLightbox(i)}
        >
          <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              className="absolute top-0.5 right-0.5 w-[18px] h-[18px] rounded-full bg-black/65 text-white text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
      ))}

      {overflow > 0 && images[GALLERY_MAX] !== undefined && (
        <div
          className="relative shrink-0 h-[72px] w-[72px] rounded-lg overflow-hidden cursor-pointer"
          onClick={() => onLightbox(GALLERY_MAX)}
        >
          <img
            src={images[GALLERY_MAX]}
            alt="More images"
            className="w-full h-full object-cover blur-[2px] scale-110"
          />
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-white font-bold text-base leading-none">+{overflow}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Read-only renderer ───────────────────────────────────────────
export function DescriptionView({ html, className }: { html: string; className?: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { textHtml, images } = useMemo(() => {
    if (!html) return { textHtml: '', images: [] as string[] };
    return extractImages(html);
  }, [html]);

  if (!html) return null;

  return (
    <div className={cn('text-sm break-words', className)}>
      {textHtml && (
        <div
          className={cn(
            'prose prose-sm dark:prose-invert max-w-none line-clamp-2',
            '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:cursor-pointer',
            '[&_p]:my-0 [&_ul]:my-0.5 [&_ol]:my-0.5',
          )}
          dangerouslySetInnerHTML={{ __html: textHtml }}
        />
      )}
      {images.length > 0 && (
        <div className="mt-1.5">
          <ImageGalleryRow images={images} onLightbox={setLightboxIndex} />
        </div>
      )}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  );
}

// ── Editor component ─────────────────────────────────────────────
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Parse initial value once — parent uses key= prop to force remount on task change
  const initialRef = useRef<{ textHtml: string; images: string[] } | null>(null);
  if (initialRef.current === null) {
    initialRef.current = value ? extractImages(value) : { textHtml: '', images: [] };
  }
  const { textHtml: initialText, images: initialImages } = initialRef.current;

  const [images, setImages] = useState<string[]>(initialImages);
  // Ref so TipTap's onUpdate closure always reads latest images without stale closure
  const imagesRef = useRef<string[]>(initialImages);
  imagesRef.current = images;

  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExt.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialText || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(buildHtml(editor.getHTML(), imagesRef.current));
    },
  });

  // Helpers to mutate images and emit combined HTML synchronously
  const addImages = (urls: string[]) => {
    const next = [...imagesRef.current, ...urls];
    imagesRef.current = next;
    setImages(next);
    onChange(buildHtml(editor?.getHTML() ?? '', next));
  };

  const removeImage = (i: number) => {
    const next = imagesRef.current.filter((_, idx) => idx !== i);
    imagesRef.current = next;
    setImages(next);
    onChange(buildHtml(editor?.getHTML() ?? '', next));
  };

  const handleUploadImages = async (files: File[]) => {
    setUploading(true);
    try {
      const results = await Promise.allSettled(files.map(f => uploadFile(f)));
      const urls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) toast.error(`${failed} image(s) failed to upload`);
      if (urls.length > 0) addImages(urls);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      editor?.chain().focus()
        .insertContent(`<a href="${url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`)
        .run();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const confirmLink = () => {
    if (linkUrl.trim()) {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      const { empty } = editor!.state.selection;
      if (empty) {
        editor?.chain().focus()
          .insertContent(`<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`)
          .run();
      } else {
        editor?.chain().focus().setLink({ href, target: '_blank' }).run();
      }
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
        ><Bold size={12} /></ToolbarBtn>
        <ToolbarBtn
          active={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
        ><Italic size={12} /></ToolbarBtn>

        <div className="w-px h-3.5 bg-border mx-1" />

        <ToolbarBtn
          active={editor?.isActive('link') || linkMode}
          onClick={() => { setLinkMode(m => !m); setLinkUrl(editor?.getAttributes('link').href ?? ''); }}
          title="Insert link"
        ><Link2 size={12} /></ToolbarBtn>
        <ToolbarBtn
          onClick={() => imageInputRef.current?.click()}
          title="Upload images (multiple)"
          disabled={uploading}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => fileInputRef.current?.click()}
          title="Upload PDF"
          disabled={uploading}
        ><Paperclip size={12} /></ToolbarBtn>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) handleUploadImages(files);
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
            if (f) handleUploadFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Inline link bar */}
      {linkMode && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-muted/20">
          <input
            autoFocus
            type="url"
            placeholder="https://... (select text first to make it a hyperlink)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); confirmLink(); }
              if (e.key === 'Escape') { setLinkMode(false); setLinkUrl(''); }
            }}
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

      {/* Text editor */}
      <EditorContent
        editor={editor}
        className={cn(
          'px-3 py-2 min-h-[80px] text-sm',
          '[&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.ProseMirror_p]:my-0.5',
          '[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline',
        )}
      />

      {/* Image gallery row */}
      {images.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <ImageGalleryRow
            images={images}
            onLightbox={setLightboxIndex}
            onRemove={removeImage}
          />
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}
    </div>
  );
}

function ToolbarBtn({ children, onClick, active, title, disabled }: {
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
