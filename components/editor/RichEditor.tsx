"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import CodeBlock from "@tiptap/extension-code-block";
import { useRef, useCallback } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, AlignLeft, AlignCenter, AlignRight,
  Link2, ImageIcon, Undo, Redo, Highlighter, RemoveFormatting,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const ToolBtn = ({
  onClick, active, title, children,
}: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-sm transition-all ${
      active ? "bg-electric/20 text-electric" : "text-mist/60 hover:text-snow hover:bg-ink-border"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <span className="w-px h-5 bg-ink-border mx-1 self-center" />;

export default function RichEditor({ value, onChange }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlock,
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-electric underline" } }),
      Placeholder.configure({ placeholder: "Start writing your article here…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose-editor min-h-[420px] outline-none p-5 text-mist leading-relaxed",
      },
    },
  });

  // Upload image to Cloudinary via our API and insert into editor
  const uploadImage = useCallback(async (file: File) => {
    if (!editor) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "calstins/blog");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      editor.chain().focus().setImage({ src: data.url, alt: file.name }).run();
    }
  }, [editor]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadImage(file);
    e.target.value = "";
  };

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt("Enter URL:", editor.getAttributes("link").href || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  };

  if (!editor) return null;


  return (
    <div className="border border-ink-border rounded-sm bg-ink-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-ink-border bg-ink sticky top-0 z-10">
        {/* History */}
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo size={14} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo size={14} />
        </ToolBtn>
        <Divider />

        {/* Headings */}
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={14} />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={14} />
        </ToolBtn>
        <Divider />

        {/* Inline formatting */}
        <ToolBtn title="Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={14} />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={14} />
        </ToolBtn>
        <ToolBtn title="Highlight" active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={14} />
        </ToolBtn>
        <ToolBtn title="Inline code" active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={14} />
        </ToolBtn>
        <Divider />

        {/* Lists */}
        <ToolBtn title="Bullet list" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={14} />
        </ToolBtn>
        <ToolBtn title="Numbered list" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={14} />
        </ToolBtn>
        <ToolBtn title="Blockquote" active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={14} />
        </ToolBtn>
        <ToolBtn title="Code block" active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <span className="text-xs font-mono px-0.5">{"</>"}</span>
        </ToolBtn>
        <ToolBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={14} />
        </ToolBtn>
        <Divider />

        {/* Alignment */}
        <ToolBtn title="Align left" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={14} />
        </ToolBtn>
        <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={14} />
        </ToolBtn>
        <ToolBtn title="Align right" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={14} />
        </ToolBtn>
        <Divider />

        {/* Link */}
        <ToolBtn title="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={14} />
        </ToolBtn>

        {/* Image upload */}
        <ToolBtn title="Insert image from Cloudinary" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={14} />
        </ToolBtn>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* Clear formatting */}
        <ToolBtn title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().run()}>
          <RemoveFormatting size={14} />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {/* Tiptap editor styles */}
      <style jsx global>{`
        .prose-editor h2 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: #F0F2F8; margin: 1.5rem 0 0.75rem; }
        .prose-editor h3 { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: #F0F2F8; margin: 1.25rem 0 0.5rem; }
        .prose-editor p { margin-bottom: 0.875rem; color: #A0A8C0; line-height: 1.75; }
        .prose-editor strong { color: #F0F2F8; font-weight: 600; }
        .prose-editor em { color: #A0A8C0; }
        .prose-editor u { text-decoration: underline; }
        .prose-editor s { text-decoration: line-through; }
        .prose-editor mark { background: rgba(184,255,69,0.25); color: #F0F2F8; padding: 0 2px; border-radius: 2px; }
        .prose-editor code { font-family: var(--font-mono); background: #1A1D26; color: #00D4FF; padding: 2px 6px; border-radius: 3px; font-size: 0.85em; }
        .prose-editor pre { background: #1A1D26; border: 1px solid #252836; border-radius: 4px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .prose-editor pre code { background: none; color: #F0F2F8; padding: 0; }
        .prose-editor blockquote { border-left: 3px solid #00D4FF; padding-left: 1rem; margin: 1rem 0; color: #A0A8C0; font-style: italic; }
        .prose-editor ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.875rem; }
        .prose-editor ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.875rem; }
        .prose-editor li { color: #A0A8C0; margin-bottom: 0.25rem; line-height: 1.75; }
        .prose-editor hr { border: none; border-top: 1px solid #252836; margin: 1.5rem 0; }
        .prose-editor img { max-width: 100%; height: auto; border-radius: 4px; margin: 1rem 0; border: 1px solid #252836; }
        .prose-editor a { color: #00D4FF; text-decoration: underline; }
        .prose-editor .is-editor-empty::before { content: attr(data-placeholder); color: #374151; pointer-events: none; float: left; height: 0; }
        .ProseMirror-focused { outline: none; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #374151; pointer-events: none; height: 0; }
      `}</style>
    </div>
  );
}
