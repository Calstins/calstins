"use client";
import { useState, useEffect } from "react";
import { saveJson } from "@/lib/admin-save";
import { Plus, Edit, Trash2, ArrowLeft, Save, Star, X } from "lucide-react";

const cats = ["E-Commerce & Digital Growth","Logistics Platform","Community & Mobile Platform","Event & Ticketing Infrastructure","Fintech Infrastructure","SaaS Product","Commerce Platform","EdTech Platform","Professional Services","Other"];
const empty = { title:"", slug:"", client:"", category:"E-Commerce & Digital Growth", description:"", longDesc:"", outcome:"", url:"", tags:[], featured:false, partnership:false, order:0 };

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !value.includes(v)) { onChange([...value, v]); setInput(""); } };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 text-xs font-mono text-electric border border-electric/20 bg-electric/5 px-2 py-0.5 rounded-sm">
            {t}<button onClick={() => onChange(value.filter(x => x !== t))}><X size={9} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder || "Add tag, press Enter"} className="field-input flex-1 text-xs" />
        <button onClick={add} className="btn-ghost text-xs py-2 px-3">Add</button>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = () => fetch("/api/projects").then(r => r.json()).then(d => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title?.trim()) { setErr("Title is required."); return; }
    setSaving(true); setErr("");
    const r = await saveJson(form.id ? `/api/projects/${form.id}` : "/api/projects", form.id ? "PUT" : "POST", form);
    setSaving(false);
    if (!r.ok) { setErr(r.error); return; }
    setMsg("Saved!"); load();
    setTimeout(() => { setMsg(""); setForm(null); }, 900);
  };

  const del = async (id: string) => {
    if (!confirm("Delete project?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) alert("Could not delete this project.");
    load();
  };

  if (form) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setForm(null)} className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-700 text-snow text-xl">{form.id ? "Edit Project" : "New Project"}</h2>
        {msg && <span className="text-electric text-xs font-mono ml-2">{msg}</span>}
        <div className="ml-auto"><button onClick={save} disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50"><Save size={14} /> {saving ? "Saving..." : "Save"}</button></div>
      </div>
      {err && <p role="alert" className="mb-4 rounded-sm border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">{err}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="field-label">Title *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="field-input" /></div>
        <div><label className="field-label">Client</label><input value={form.client ?? ""} onChange={e => setForm({...form, client: e.target.value})} className="field-input" /></div>
        <div><label className="field-label">Slug</label><input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} className="field-input font-mono text-xs" /></div>
        <div><label className="field-label">Category</label><select value={form.category ?? ""} onChange={e => setForm({...form, category: e.target.value})} className="field-input">{cats.map(c => <option key={c}>{c}</option>)}</select></div>
        <div><label className="field-label">URL</label><input value={form.url || ""} onChange={e => setForm({...form, url: e.target.value})} className="field-input" placeholder="https://..." /></div>
        <div><label className="field-label">Display Order</label><input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Short Description</label><textarea value={form.description ?? ""} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="field-input" placeholder="One-line project description shown on cards" /></div>
        <div className="md:col-span-2"><label className="field-label">Full Engagement Description</label><textarea value={form.longDesc || ""} onChange={e => setForm({...form, longDesc: e.target.value})} rows={3} className="field-input" placeholder="Detailed description of the engagement scope and delivery" /></div>
        <div className="md:col-span-2"><label className="field-label">Outcome</label><textarea value={form.outcome || ""} onChange={e => setForm({...form, outcome: e.target.value})} rows={2} className="field-input" placeholder="What was delivered / the result" /></div>
        <div className="md:col-span-2"><label className="field-label">Engagement Tags (no tech stack)</label><TagInput value={form.tags || []} onChange={v => setForm({...form, tags: v})} placeholder="e.g. Architecture Design, Full Build..." /></div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-mist text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="accent-electric" />Featured</label>
          <label className="flex items-center gap-2 text-mist text-sm cursor-pointer"><input type="checkbox" checked={form.partnership} onChange={e => setForm({...form, partnership: e.target.checked})} className="accent-electric" />Partnership</label>
        </div>
      </div>
      <FieldStyles />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display font-700 text-snow text-2xl">Projects</h1><p className="text-mist text-sm mt-1">{items.length} projects</p></div>
        <button onClick={() => setForm({...empty})} className="btn-primary text-sm py-2.5"><Plus size={14} /> New Project</button>
      </div>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="card-base flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-display font-600 text-snow">{p.title}</span>
                <span className="text-xs font-mono text-electric/60 border border-electric/20 px-1.5 py-0.5 rounded-sm">{p.category}</span>
                {p.featured && <Star size={11} className="text-volt fill-volt" />}
                {p.partnership && <span className="text-xs font-mono text-mist/40">Partnership</span>}
              </div>
              <p className="text-mist text-xs truncate">{p.description}</p>
              {p.outcome && <p className="text-mist/40 text-xs mt-0.5 italic truncate">Outcome: {p.outcome}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0 self-end sm:self-auto">
              <button onClick={() => setForm(p)} className="p-2 text-mist hover:text-electric"><Edit size={14} /></button>
              <button onClick={() => del(p.id)} className="p-2 text-mist hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-mist text-sm">No projects yet.</div>}
      </div>
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
