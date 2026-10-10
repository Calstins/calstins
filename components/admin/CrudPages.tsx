"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Save, Upload, Star, X } from "lucide-react";

// ── Generic Tag/Array Input ────────────────────────────────────────────────────
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) { onChange([...value, v]); setInput(""); }
  };
  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {value.map((t) => (
          <span key={t} className="flex items-center gap-1 text-xs font-mono text-electric border border-electric/20 bg-electric/5 px-2 py-0.5 rounded-sm">
            {t}
            <button onClick={() => onChange(value.filter(x => x !== t))} className="text-electric/60 hover:text-electric">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder || "Type and press Enter"}
          className="field-input flex-1 text-xs"
        />
        <button onClick={add} className="btn-ghost text-xs py-2 px-3">Add</button>
      </div>
    </div>
  );
}

// ── Image Upload Helper ────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", `calstins/${folder}`);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) onChange(data.url);
  };
  return (
    <div>
      <div className="flex gap-2">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." className="field-input flex-1 text-xs" />
        <label className="btn-ghost text-xs py-2 px-3 cursor-pointer flex-shrink-0">
          <Upload size={12} /> Upload
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>
      </div>
      {value && <img src={value} alt="preview" className="mt-2 h-20 rounded-sm object-cover border border-ink-border" />}
    </div>
  );
}

// ── SERVICES CRUD ──────────────────────────────────────────────────────────────
export function ServicesAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetch_ = () => fetch("/api/services").then(r => r.json()).then(setItems);
  useEffect(() => { fetch_(); }, []);

  const empty = { title: "", slug: "", description: "", longDesc: "", icon: "Code2", features: [], price: "", order: 0, featured: false };

  const save = async () => {
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/services/${form.id}` : "/api/services";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setMsg("Saved!"); fetch_();
    setTimeout(() => { setMsg(""); setForm(null); }, 1500);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    fetch_();
  };

  if (form) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setForm(null)} className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-700 text-snow text-xl">{form.id ? "Edit Service" : "New Service"}</h2>
        {msg && <span className="text-electric text-xs font-mono ml-2">{msg}</span>}
        <div className="ml-auto">
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50">
            <Save size={14} /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="field-label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="field-input font-mono text-xs" /></div>
        <div><label className="field-label">Icon (Lucide name)</label><input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="field-input" placeholder="Code2" /></div>
        <div><label className="field-label">Price</label><input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="field-input" placeholder="From ₦200,000" /></div>
        <div className="md:col-span-2"><label className="field-label">Short Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Long Description</label><textarea value={form.longDesc || ""} onChange={e => setForm({ ...form, longDesc: e.target.value })} rows={4} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Features</label><TagInput value={form.features || []} onChange={v => setForm({ ...form, features: v })} placeholder="Add feature and press Enter" /></div>
        <div><label className="field-label">Order</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} className="field-input" /></div>
        <div className="flex items-center gap-2 pt-5">
          <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-electric" id="feat" />
          <label htmlFor="feat" className="text-mist text-sm">Featured</label>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-700 text-snow text-2xl">Services</h1>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2.5"><Plus size={14} /> New Service</button>
      </div>
      <div className="space-y-3">
        {items.map(s => (
          <div key={s.id} className="card-base flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2"><span className="font-display font-600 text-snow">{s.title}</span>{s.featured && <Star size={12} className="text-volt fill-volt" />}</div>
              <p className="text-mist text-xs mt-0.5">{s.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm(s)} className="p-2 text-mist hover:text-electric transition-colors"><Edit size={14} /></button>
              <button onClick={() => del(s.id)} className="p-2 text-mist hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-mist text-sm">No services yet. <button onClick={() => setForm({ ...empty })} className="text-electric">Add one</button></div>}
      </div>
      <FieldStyles />
    </div>
  );
}

// ── PROJECTS CRUD ──────────────────────────────────────────────────────────────
export function ProjectsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetch_ = () => fetch("/api/projects").then(r => r.json()).then(setItems);
  useEffect(() => { fetch_(); }, []);

  const cats = ["E-Commerce", "Mobile App", "Web Platform", "Backend / API", "Fintech", "EdTech", "Corporate Website", "Other"];
  const empty = { title: "", slug: "", client: "", description: "", longDesc: "", url: "", tags: [], category: "Web Platform", featured: false, partnership: false, order: 0 };

  const save = async () => {
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/projects/${form.id}` : "/api/projects";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setMsg("Saved!"); fetch_();
    setTimeout(() => { setMsg(""); setForm(null); }, 1500);
  };

  const del = async (id: string) => {
    if (!confirm("Delete project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetch_();
  };

  if (form) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setForm(null)} className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-700 text-snow text-xl">{form.id ? "Edit Project" : "New Project"}</h2>
        {msg && <span className="text-electric text-xs font-mono ml-2">{msg}</span>}
        <div className="ml-auto">
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50"><Save size={14} /> {saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="field-label">Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Client</label><input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Slug</label><input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="field-input font-mono text-xs" /></div>
        <div><label className="field-label">URL</label><input value={form.url || ""} onChange={e => setForm({ ...form, url: e.target.value })} className="field-input" placeholder="https://..." /></div>
        <div><label className="field-label">Category</label>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field-input">
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="field-label">Order</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Cover Image</label><ImageUpload value={form.coverImage || ""} onChange={v => setForm({ ...form, coverImage: v })} folder="projects" /></div>
        <div className="md:col-span-2"><label className="field-label">Short Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Long Description</label><textarea value={form.longDesc || ""} onChange={e => setForm({ ...form, longDesc: e.target.value })} rows={4} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Tags / Tech Stack</label><TagInput value={form.tags || []} onChange={v => setForm({ ...form, tags: v })} placeholder="Next.js, Paystack, MongoDB..." /></div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-mist text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-electric" /> Featured</label>
          <label className="flex items-center gap-2 text-mist text-sm cursor-pointer"><input type="checkbox" checked={form.partnership} onChange={e => setForm({ ...form, partnership: e.target.checked })} className="accent-electric" /> Partnership</label>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-700 text-snow text-2xl">Projects</h1>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2.5"><Plus size={14} /> New Project</button>
      </div>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="card-base flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-600 text-snow">{p.title}</span>
                <span className="text-xs font-mono text-electric/60 border border-electric/20 px-1.5 py-0.5 rounded-sm">{p.category}</span>
                {p.featured && <Star size={11} className="text-volt fill-volt" />}
                {p.partnership && <span className="text-xs font-mono text-mist/40">Partnership</span>}
              </div>
              <p className="text-mist text-xs mt-0.5 truncate">{p.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => setForm(p)} className="p-2 text-mist hover:text-electric transition-colors"><Edit size={14} /></button>
              <button onClick={() => del(p.id)} className="p-2 text-mist hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-mist text-sm">No projects yet.</div>}
      </div>
      <FieldStyles />
    </div>
  );
}

// ── CLIENTS CRUD ──────────────────────────────────────────────────────────────
export function ClientsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetch_ = () => fetch("/api/clients").then(r => r.json()).then(setItems);
  useEffect(() => { fetch_(); }, []);

  const empty = { name: "", logo: "", url: "", industry: "", featured: false, order: 0 };

  const save = async () => {
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/clients/${form.id}` : "/api/clients";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); fetch_(); setForm(null);
  };

  const del = async (id: string) => {
    if (!confirm("Delete client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetch_();
  };

  if (form) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setForm(null)} className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-700 text-snow text-xl">{form.id ? "Edit Client" : "New Client"}</h2>
        <div className="ml-auto">
          <button onClick={save} disabled={saving} className="btn-primary text-sm py-2"><Save size={14} /> {saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="field-label">Company Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Industry</label><input value={form.industry || ""} onChange={e => setForm({ ...form, industry: e.target.value })} className="field-input" placeholder="E-Commerce, Fintech..." /></div>
        <div><label className="field-label">Website URL</label><input value={form.url || ""} onChange={e => setForm({ ...form, url: e.target.value })} className="field-input" placeholder="https://..." /></div>
        <div><label className="field-label">Display Order</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })} className="field-input" /></div>
        <div className="md:col-span-2"><label className="field-label">Logo Image</label><ImageUpload value={form.logo || ""} onChange={v => setForm({ ...form, logo: v })} folder="clients" /></div>
        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" id="cfeat" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-electric" />
          <label htmlFor="cfeat" className="text-mist text-sm">Show on homepage</label>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-700 text-snow text-2xl">Clients</h1>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2.5"><Plus size={14} /> Add Client</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(c => (
          <div key={c.id} className="card-base flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {c.logo ? <img src={c.logo} alt={c.name} className="w-10 h-10 object-contain rounded-sm bg-ink-light border border-ink-border p-1" /> : <div className="w-10 h-10 bg-electric/10 rounded-sm flex items-center justify-center font-display font-700 text-electric">{c.name[0]}</div>}
              <div>
                <p className="font-display font-600 text-snow text-sm">{c.name}</p>
                <p className="text-mist/50 text-xs">{c.industry}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setForm(c)} className="p-1.5 text-mist hover:text-electric"><Edit size={12} /></button>
              <button onClick={() => del(c.id)} className="p-1.5 text-mist hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="md:col-span-3 text-center py-12 text-mist text-sm">No clients yet.</div>}
      </div>
      <FieldStyles />
    </div>
  );
}

// ── TESTIMONIALS CRUD ──────────────────────────────────────────────────────────
export function TestimonialsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetch_ = () => fetch("/api/testimonials").then(r => r.json()).then(setItems);
  useEffect(() => { fetch_(); }, []);

  const empty = { name: "", role: "", company: "", quote: "", avatar: "", rating: 5, featured: false, order: 0 };

  const save = async () => {
    setSaving(true);
    const method = form.id ? "PUT" : "POST";
    const url = form.id ? `/api/testimonials/${form.id}` : "/api/testimonials";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rating: Number(form.rating) }) });
    setSaving(false); fetch_(); setForm(null);
  };

  const del = async (id: string) => {
    if (!confirm("Delete testimonial?")) return;
    await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    fetch_();
  };

  if (form) return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setForm(null)} className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
        <h2 className="font-display font-700 text-snow text-xl">{form.id ? "Edit Testimonial" : "New Testimonial"}</h2>
        <div className="ml-auto"><button onClick={save} disabled={saving} className="btn-primary text-sm py-2"><Save size={14} /> {saving ? "..." : "Save"}</button></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="field-label">Person&apos;s Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Role / Title</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="field-input" /></div>
        <div><label className="field-label">Rating (1–5)</label>
          <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} className="field-input">
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className="field-label">Avatar Image</label><ImageUpload value={form.avatar || ""} onChange={v => setForm({ ...form, avatar: v })} folder="testimonials" /></div>
        <div className="md:col-span-2"><label className="field-label">Quote *</label><textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={4} placeholder="What did they say?" className="field-input" /></div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="tfeat" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-electric" />
          <label htmlFor="tfeat" className="text-mist text-sm">Show on homepage</label>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-700 text-snow text-2xl">Testimonials</h1>
        <button onClick={() => setForm({ ...empty })} className="btn-primary text-sm py-2.5"><Plus size={14} /> Add Testimonial</button>
      </div>
      <div className="space-y-3">
        {items.map(t => (
          <div key={t.id} className="card-base flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm bg-electric/10 flex items-center justify-center font-display font-700 text-electric flex-shrink-0">{t.name[0]}</div>
              <div>
                <p className="font-display font-600 text-snow text-sm">{t.name} <span className="text-mist/50 font-normal">· {t.company}</span></p>
                <p className="text-volt text-xs">{"★".repeat(t.rating)}</p>
                <p className="text-mist text-xs mt-1 line-clamp-2 italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0 self-end sm:self-auto">
              <button onClick={() => setForm(t)} className="p-1.5 text-mist hover:text-electric"><Edit size={12} /></button>
              <button onClick={() => del(t.id)} className="p-1.5 text-mist hover:text-red-400"><Trash2 size={12} /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center py-12 text-mist text-sm">No testimonials yet.</div>}
      </div>
      <FieldStyles />
    </div>
  );
}

// ── Shared field styles ────────────────────────────────────────────────────────
function FieldStyles() {
  return (
    <style jsx global>{`
      .field-label { display: block; font-family: var(--font-mono); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgb(160 168 192); margin-bottom: 0.375rem; }
      .field-input { width: 100%; padding: 0.625rem 0.875rem; background: #12141A; border: 1px solid #252836; border-radius: 2px; color: #F0F2F8; font-size: 0.875rem; outline: none; transition: border-color 0.15s; display: block; }
      .field-input:focus { border-color: #00D4FF; }
      textarea.field-input { resize: vertical; }
      select.field-input { appearance: none; }
    `}</style>
  );
}
