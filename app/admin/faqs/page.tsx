"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Edit, Plus, Save, Trash2 } from "lucide-react";
import { ConfirmDialog, Chip, EmptyState, Field, ListSkeleton, Toggle, api, useToast } from "@/components/admin/kit";

interface Faq { id?: string; question: string; answer: string; serviceId: string | null; published: boolean; order: number }
const blank = (): Faq => ({ question: "", answer: "", serviceId: null, published: true, order: 0 });

export default function AdminFaqsPage() {
  const toast = useToast();
  const [items, setItems] = useState<Faq[] | null>(null);
  const [services, setServices] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState<Faq | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Faq | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);
  useEffect(() => {
    let alive = true;
    Promise.all([api<Faq[]>("/api/faqs?all=1"), api<{ id: string; title: string }[]>("/api/services?all=1")]).then(([f, s]) => {
      if (!alive) return;
      if (f.ok) setItems(f.data ?? []); else { setItems([]); toast("err", f.error ?? "Could not load FAQs"); }
      if (s.ok) setServices((s.data ?? []).map((x) => ({ id: x.id, title: x.title })));
    });
    return () => { alive = false; };
  }, [reloadKey, toast]);

  const save = async () => {
    if (!form) return;
    setSaving(true); setErrors({});
    const { id, ...payload } = form as Faq & { createdAt?: string; updatedAt?: string };
    delete (payload as any).createdAt; delete (payload as any).updatedAt;
    const r = await api(id ? `/api/faqs/${id}` : "/api/faqs", { method: id ? "PUT" : "POST", json: payload });
    setSaving(false);
    if (!r.ok) { setErrors(r.fields ?? {}); toast("err", r.fields ? "Please fix the highlighted fields." : r.error ?? "Save failed"); return; }
    toast("ok", "FAQ saved"); setForm(null); load();
  };

  // FAQs have no reorder endpoint: swap the two `order` values via normal updates.
  const move = async (idx: number, dir: -1 | 1) => {
    if (!items) return;
    const j = idx + dir; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
    const res = await Promise.all(next.map((f, i) => api(`/api/faqs/${f.id}`, { method: "PUT", json: { question: f.question, answer: f.answer, serviceId: f.serviceId, published: f.published, order: i } })));
    if (res.some((r) => !r.ok)) { toast("err", "Reorder partly failed. Reloading."); load(); }
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setDeleting(true);
    const r = await api(`/api/faqs/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (r.ok) { toast("ok", "FAQ deleted"); setToDelete(null); load(); } else toast("err", r.error ?? "Delete failed");
  };

  if (form) {
    const set = <K extends keyof Faq>(k: K, v: Faq[K]) => setForm({ ...form, [k]: v });
    return (
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setForm(null)} aria-label="Back to FAQs" className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
          <h1 className="font-display font-bold text-snow text-xl">{form.id ? "Edit FAQ" : "New FAQ"}</h1>
          <div className="ml-auto"><button type="submit" disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50"><Save size={14} /> {saving ? "Saving…" : "Save"}</button></div>
        </div>
        <div className="space-y-4">
          <Field label="Question" required error={errors.question}>{(p) => <input {...p} value={form.question} onChange={(e) => set("question", e.target.value)} className="field-input" />}</Field>
          <Field label="Answer" required error={errors.answer}>{(p) => <textarea {...p} rows={5} value={form.answer} onChange={(e) => set("answer", e.target.value)} className="field-input" />}</Field>
          <Field label="Attach to service" hint="Optional. Unattached FAQs appear on the home and pricing pages.">{(p) => (
            <select {...p} value={form.serviceId ?? ""} onChange={(e) => set("serviceId", e.target.value || null)} className="field-input">
              <option value="">General</option>{services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>)}</Field>
          <Toggle label="Published" checked={form.published} onChange={(v) => set("published", v)} />
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4"><div><h1 className="font-display font-bold text-snow text-2xl">FAQs</h1><p className="text-mist text-sm mt-1">{items ? `${items.length} total` : "Loading…"}</p></div>
        <button type="button" onClick={() => { setErrors({}); setForm({ ...blank(), order: items?.length ?? 0 }); }} className="btn-primary text-sm py-2.5"><Plus size={14} /> New FAQ</button></div>
      {items === null ? <ListSkeleton /> : items.length === 0 ? <EmptyState>No FAQs yet. The public FAQ sections stay hidden until you publish at least one.</EmptyState> : (
        <ul className="space-y-3">
          {items.map((f, idx) => (
            <li key={f.id} className="card-base flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="font-display font-semibold text-snow">{f.question}</span>{f.published ? <Chip tone="green">Published</Chip> : <Chip tone="amber">Draft</Chip>}</div>
                <p className="text-mist text-xs truncate">{f.answer}</p>
              </div>
              <div className="flex gap-1 items-center">
                <button type="button" aria-label="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Move down" disabled={idx === items.length - 1} onClick={() => move(idx, 1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label={`Edit ${f.question}`} onClick={() => { setErrors({}); setForm(f); }} className="p-2 text-mist hover:text-electric"><Edit size={14} /></button>
                <button type="button" aria-label={`Delete ${f.question}`} onClick={() => setToDelete(f)} className="p-2 text-mist hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!toDelete} busy={deleting} title="Delete this FAQ?" body="This cannot be undone." onConfirm={confirmDelete} onCancel={() => !deleting && setToDelete(null)} />
    </div>
  );
}
