"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Save, Eye, ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Load Tiptap only client-side (it needs window)
const RichEditor = dynamic(() => import("@/components/editor/RichEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-ink-border rounded-sm bg-ink-card min-h-[420px] flex items-center justify-center">
      <span className="text-mist/40 text-sm font-mono animate-pulse">Loading editor…</span>
    </div>
  ),
});

const categories = [
  "Technology Strategy", "IT Consulting", "Long-term Partnership",
  "Product & Software Delivery", "Case Study", "Fintech",
  "E-Commerce", "Nigeria Tech", "Government & Public Sector",
];

const emptyForm = {
  title: "", slug: "", excerpt: "", content: "", coverImage: "",
  category: "Technology Strategy", tags: "", published: false,
  metaTitle: "", metaDesc: "", focusKeyword: "", keywords: "", readTime: 7,
};

function TagPill({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 text-xs font-mono text-electric border border-electric/20 bg-electric/5 px-2 py-0.5 rounded-sm">
      {tag}
      <button type="button" onClick={onRemove} className="text-electric/60 hover:text-electric ml-0.5">
        <X size={9} />
      </button>
    </span>
  );
}

export default function BlogEditor({ isEdit = false }: { isEdit?: boolean }) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [form, setForm] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"ok" | "err">("ok");
  const [tab, setTab] = useState<"content" | "seo">("content");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit && slug) {
      fetch(`/api/blog/${slug}`).then(r => r.json()).then(p => {
        setForm({
          ...p,
          tags: Array.isArray(p.tags) ? p.tags.join(", ") : p.tags || "",
          keywords: Array.isArray(p.keywords) ? p.keywords.join(", ") : p.keywords || "",
        });
      });
    }
  }, [isEdit, slug]);

  const tagList: string[] = form.tags
    ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tagList.includes(v)) {
      setForm({ ...form, tags: [...tagList, v].join(", ") });
    }
    setTagInput("");
  };

  const removeTag = (t: string) => {
    setForm({ ...form, tags: tagList.filter(x => x !== t).join(", ") });
  };

  const autoSlug = () => {
    if (!form.slug && form.title) {
      setForm(f => ({
        ...f,
        slug: f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      }));
    }
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "calstins/blog");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setForm(f => ({ ...f, coverImage: data.url }));
    setUploading(false);
    e.target.value = "";
  };

  const save = async (publish?: boolean) => {
    setSaving(true);
    const payload = {
      ...form,
      tags: tagList,
      keywords: form.keywords.split(",").map((k: string) => k.trim()).filter(Boolean),
      published: publish !== undefined ? publish : form.published,
      readTime: Number(form.readTime),
    };

    const url = isEdit ? `/api/blog/${slug}` : "/api/blog";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsgType("ok");
      setMsg(publish ? "Published!" : "Saved as draft");
      if (!isEdit) router.push(`/admin/blog/${data.slug}/edit`);
    } else {
      setMsgType("err");
      setMsg(res.status === 401 ? "Session expired. Sign in again." : data?.error ? `Save failed: ${data.error}` : "Save failed — check all required fields");
    }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div>
      {/* Topbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin/blog" className="text-mist hover:text-snow p-1">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display font-700 text-snow text-xl">{isEdit ? "Edit Post" : "New Post"}</h1>
          {msg && (
            <p className={`text-xs font-mono mt-0.5 ${msgType === "ok" ? "text-electric" : "text-red-400"}`}>
              {msg}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {form.slug && (
            <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-mist hover:text-electric transition-colors p-2">
              <Eye size={16} />
            </a>
          )}
          <button onClick={() => save(false)} className="btn-ghost text-sm py-2">
            Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="btn-primary text-sm py-2 disabled:opacity-50">
            <Save size={14} />
            {saving ? "Saving…" : form.published ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-ink-card border border-ink-border rounded-sm p-1 w-fit">
        {(["content", "seo"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-mono rounded-sm transition-all capitalize ${
              tab === t ? "bg-electric/10 text-electric border border-electric/20" : "text-mist hover:text-snow"
            }`}>
            {t === "seo" ? "SEO" : "Content"}
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ── */}
      {tab === "content" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Title *</label>
              <input name="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                onBlur={autoSlug} placeholder="Article title" className="field-input" />
            </div>
            <div>
              <label className="field-label">Slug *</label>
              <input name="slug" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                placeholder="url-slug" className="field-input font-mono text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="field-input">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Read Time (mins)</label>
              <input type="number" value={form.readTime}
                onChange={e => setForm({ ...form, readTime: Number(e.target.value) })}
                className="field-input" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-mist text-sm cursor-pointer">
                <input type="checkbox" checked={form.published}
                  onChange={e => setForm({ ...form, published: e.target.checked })}
                  className="accent-electric w-4 h-4" />
                Published
              </label>
            </div>
          </div>

          <div>
            <label className="field-label">Excerpt *</label>
            <textarea name="excerpt" value={form.excerpt}
              onChange={e => setForm({ ...form, excerpt: e.target.value })}
              rows={2} placeholder="Brief summary shown in article listings"
              className="field-input" />
          </div>

          {/* Tags */}
          <div>
            <label className="field-label">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tagList.map(t => <TagPill key={t} tag={t} onRemove={() => removeTag(t)} />)}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Type tag and press Enter" className="field-input flex-1 text-xs" />
              <button type="button" onClick={addTag} className="btn-ghost text-xs py-2 px-3">Add</button>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="field-label">Cover Image</label>
            <div className="flex items-center gap-3">
              <input value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
                placeholder="https://... or upload below" className="field-input flex-1 text-xs" />
              <label className={`btn-ghost text-xs py-2 px-3 cursor-pointer flex-shrink-0 ${uploading ? "opacity-50" : ""}`}>
                <Upload size={12} /> {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/*" onChange={uploadCover} className="hidden" disabled={uploading} />
              </label>
            </div>
            {form.coverImage && (
              <div className="mt-2 relative w-fit">
                <img src={form.coverImage} alt="Cover" className="h-40 rounded-sm object-cover border border-ink-border" />
                <button onClick={() => setForm({ ...form, coverImage: "" })}
                  className="absolute top-1 right-1 bg-ink/80 text-mist hover:text-red-400 rounded-sm p-0.5">
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Rich text editor */}
          <div>
            <label className="field-label mb-2 block">Article Content</label>
            <RichEditor
              value={form.content}
              onChange={(html) => setForm(f => ({ ...f, content: html }))}
            />
            <p className="text-mist/30 text-xs mt-2 font-mono">
              Use the toolbar to format. Click the image icon (🖼) to upload images directly to Cloudinary.
            </p>
          </div>
        </div>
      )}

      {/* ── SEO TAB ── */}
      {tab === "seo" && (
        <div className="space-y-5">
          {/* SERP preview */}
          <div className="card-base">
            <p className="font-mono text-xs text-electric/60 uppercase tracking-wider mb-3">SERP Preview</p>
            <div className="bg-ink border border-ink-border rounded p-4">
              <p className="text-blue-400 text-sm font-medium truncate">
                {form.metaTitle || form.title || "Article title"}
              </p>
              <p className="text-green-600 text-xs">calstins.com/blog/{form.slug || "article-slug"}</p>
              <p className="text-mist/60 text-xs mt-1 line-clamp-2">
                {form.metaDesc || form.excerpt || "Meta description…"}
              </p>
            </div>
          </div>

          <div>
            <label className="field-label">Focus Keyword</label>
            <input value={form.focusKeyword}
              onChange={e => setForm({ ...form, focusKeyword: e.target.value })}
              placeholder="e.g. technology strategy Nigeria" className="field-input" />
            <p className="text-mist/30 text-xs mt-1 font-mono">The primary keyword this article targets</p>
          </div>

          <div>
            <label className="field-label">
              Meta Title <span className="text-mist/40 normal-case">{(form.metaTitle || form.title).length}/60</span>
            </label>
            <input value={form.metaTitle}
              onChange={e => setForm({ ...form, metaTitle: e.target.value })}
              placeholder={form.title} className="field-input" />
          </div>

          <div>
            <label className="field-label">
              Meta Description <span className="text-mist/40 normal-case">{form.metaDesc.length}/160</span>
            </label>
            <textarea value={form.metaDesc}
              onChange={e => setForm({ ...form, metaDesc: e.target.value })}
              rows={3} placeholder={form.excerpt} className="field-input" />
          </div>

          <div>
            <label className="field-label">Additional Keywords (comma-separated)</label>
            <input value={form.keywords}
              onChange={e => setForm({ ...form, keywords: e.target.value })}
              placeholder="nigeria, advisory, IT consulting, strategy" className="field-input" />
          </div>
        </div>
      )}

      <FieldStyles />
    </div>
  );
}

function FieldStyles() {
  return (
    <style jsx global>{`
      .field-label { display:block; font-family:var(--font-mono); font-size:0.65rem; text-transform:uppercase; letter-spacing:0.1em; color:rgb(160 168 192); margin-bottom:0.375rem; }
      .field-input { width:100%; padding:0.625rem 0.875rem; background:#12141A; border:1px solid #252836; border-radius:2px; color:#F0F2F8; font-size:0.875rem; outline:none; transition:border-color 0.15s; display:block; }
      .field-input:focus { border-color:#00D4FF; }
      textarea.field-input { resize:vertical; }
      select.field-input { appearance:none; }
    `}</style>
  );
}
