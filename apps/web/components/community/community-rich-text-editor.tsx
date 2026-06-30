'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { buildVimeoEmbedSrc, parseVideoEmbedUrl } from '@/lib/sanitize-html';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Youtube from '@tiptap/extension-youtube';
import { Node, mergeAttributes } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Video,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const STORAGE_KEY_ATTR = 'data-storage-key';

const RichTextImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      [STORAGE_KEY_ATTR]: {
        default: null,
        parseHTML: (element) => element.getAttribute(STORAGE_KEY_ATTR),
        renderHTML: (attributes) => {
          const key = attributes[STORAGE_KEY_ATTR];
          if (!key) {
            return {};
          }
          return { [STORAGE_KEY_ATTR]: key };
        },
      },
    };
  },
});

const VimeoEmbed = Node.create({
  name: 'vimeoEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-vimeo-video] iframe',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { 'data-vimeo-video': '' },
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          frameborder: '0',
          allowfullscreen: 'true',
          allow: 'autoplay; fullscreen; picture-in-picture',
        }),
      ],
    ];
  },
});

export interface CommunityRichTextEditorUploadTarget {
  downloadUrl: string;
  storageKey: string;
}

interface CommunityRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minHeightClassName?: string;
  onUploadImage: (file: File) => Promise<CommunityRichTextEditorUploadTarget>;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className="h-8 w-8 shrink-0"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function CommunityRichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Share your thoughts with the community…',
  minHeightClassName = 'min-h-56',
  onUploadImage,
}: CommunityRichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadingImageRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      RichTextImage.configure({
        inline: false,
        allowBase64: false,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: 'community-post-youtube',
        },
      }),
      VimeoEmbed,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'community-post-editor-content px-4 py-3 focus:outline-none',
          minHeightClassName,
        ),
      },
      handleScrollToSelection(view) {
        const scrollContainer = view.dom.closest('[data-app-scroll]');
        if (!(scrollContainer instanceof HTMLElement)) {
          return false;
        }

        const { from } = view.state.selection;
        const coords = view.coordsAtPos(from);
        const containerRect = scrollContainer.getBoundingClientRect();
        const margin = 24;

        if (coords.bottom > containerRect.bottom - margin) {
          scrollContainer.scrollTop += coords.bottom - containerRect.bottom + margin;
        } else if (coords.top < containerRect.top + margin) {
          scrollContainer.scrollTop -= containerRect.top + margin - coords.top;
        }

        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const uploadInlineImage = useCallback(
    async (file: File) => {
      if (!editor || uploadingImageRef.current) {
        return;
      }
      uploadingImageRef.current = true;
      try {
        const target = await onUploadImage(file);
        editor
          .chain()
          .focus()
          .setImage({
            src: target.downloadUrl,
            alt: file.name,
            [STORAGE_KEY_ATTR]: target.storageKey,
          } as { src: string; alt?: string })
          .run();
      } catch {
        toast.error('Failed to upload image');
      } finally {
        uploadingImageRef.current = false;
      }
    },
    [editor, onUploadImage],
  );

  function handleLink() {
    if (!editor) {
      return;
    }
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) {
      return;
    }
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  function handleVideoEmbed() {
    if (!editor) {
      return;
    }
    const url = window.prompt('YouTube or Vimeo URL');
    if (!url) {
      return;
    }
    const parsed = parseVideoEmbedUrl(url);
    if (!parsed) {
      toast.error('Enter a valid YouTube or Vimeo URL');
      return;
    }
    if (parsed.kind === 'youtube') {
      editor.commands.setYoutubeVideo({ src: url.trim() });
      return;
    }
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'vimeoEmbed',
        attrs: { src: buildVimeoEmbedSrc(parsed.videoId) },
      })
      .run();
  }

  if (!editor) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border border-input bg-muted/20',
          minHeightClassName,
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-input bg-background',
        disabled && 'opacity-60',
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/80 bg-muted/30 p-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive('bold')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive('italic')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive('bulletList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive('orderedList')}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive('link')} disabled={disabled} onClick={handleLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Upload image"
          disabled={disabled || uploadingImageRef.current}
          onClick={() => imageInputRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton label="Embed video" disabled={disabled} onClick={handleVideoEmbed}>
          <Video className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            void uploadInlineImage(file);
          }
        }}
      />
    </div>
  );
}
