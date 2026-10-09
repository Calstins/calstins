"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Edit, Eye, EyeOff, Plus, Save, Star, Trash2, X } from "lucide-react";
import { ConfirmDialog, Chip, EmptyState, Field, ListSkeleton, StringList, Toggle, api, useToast } from "@/components/admin/kit";
import { ICON_KEYS } from "@/lib/icon-keys";
import { STAGES, STAGE_ORDER, UNSTAGED } from "@/lib/stages";

interface SubItem { id?: string; heading: string; description: string; bullets: string[]; order: number }
interface ServiceRow {
  id?: string; title: string; slug: string; areaNumber: string; stage: string | null; tagline: string; description: string;
  icon: string | null; featured: boolean; published: boolean | null; order: number; seoTitle: string | null; seoDescription: string | null;
  scope: string[]; deliveryTimeline: string | null; ctaLabel: string | null; ctaUrl: string | null; subItems: SubItem[]; _count?: { packages: number };
}

const blank = (): ServiceRow => ({
  title: "", slug: "", areaNumber: "", stage: null, tagline: "", description: "", icon: null, featured: false, published: false,
  order: 0, seoTitle: "", seoDescription: "", scope: [], deliveryTimeline: "", ctaLabel: "", ctaUrl: "", subItems: [],
});

// Legacy rows have no `published` field and are live today: treat null as published.
const isLive = (s: { published: boolean | null }) => s.published !== false;

function SubItemEditor({ items, onChange }: { items: SubItem[]; onChange: (v: SubItem[]) => void }) {
  const update = (i: number, patch: Partial<SubItem>) => onChange(items.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-4">
      {items.map((sub, i) => (
        <div key={sub.id ?? `new-${i}`} className="bg-ink-light border border-ink-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mist">Detail section {i + 1}</span>
            <button type="button" aria-label={`Remove detail section ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))} className="text-mist hover:text-red-400 p-1"><X size={14} /></button>
          </div>
          <Field label="Heading">{(p) => <input {...p} value={sub.heading} onChange={(e) => update(i, { heading: e.target.value })} className="field-input" placeholder="e.g. Discovery & Validation" />}</Field>
          <Field label="Description">{(p) => <textarea {...p} value={sub.description} onChange={(e) => update(i, { description: e.target.value })} rows={2} className="field-input" />}</Field>
          <StringList label="Bullets" items={sub.bullets} onChange={(bullets) => update(i, { bullets })} placeholder="Bullet point" max={20} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { heading: "", description: "", bullets: [], order: items.length }])} className="btn-ghost text-xs py-2 w-full justify-center">
        <Plus size={12} /> Add detail section
      </button>
    </div>
  );
}

export default function AdminServicesPage() {
  const toast = useToast();
  const [items, setItems] = useState<ServiceRow[] | null>(null);
  const [form, setForm] = useState<ServiceRow | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ServiceRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);
  useEffect(() => {
    let alive = true;
    api<ServiceRow[]>("/api/services?all=1").then((r) => {
      if (!alive) return;
      if (r.ok) setItems(r.data ?? []);
      else { setItems([]); toast("err", r.error ?? "Could not load services"); }
    });
    return () => { alive = false; };
  }, [reloadKey, toast]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items ?? []).filter((s) =>
      (!needle || s.title.toLowerCase().includes(needle) || s.slug.includes(needle)) &&
      (stageFilter === "all" || (stageFilter === "none" ? !s.stage : s.stage === stageFilter)) &&
      (statusFilter === "all" || (statusFilter === "live" ? isLive(s) : !isLive(s))),
    );
  }, [items, q, stageFilter, statusFilter]);
  const filtering = !!q || stageFilter !== "all" || statusFilter !== "all";

  const openForm = (s: ServiceRow) => {
    setErrors({});
    setForm({ ...blank(), ...s, published: isLive(s), seoTitle: s.seoTitle ?? "", seoDescription: s.seoDescription ?? "", deliveryTimeline: s.deliveryTimeline ?? "", ctaLabel: s.ctaLabel ?? "", ctaUrl: s.ctaUrl ?? "", scope: s.scope ?? [], subItems: s.subItems ?? [] });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true); setErrors({});
    const { id, _count: _ignoredCount, ...payload } = form as ServiceRow & { createdAt?: string; updatedAt?: string };
    void _ignoredCount;
    delete (payload as any).createdAt; delete (payload as any).updatedAt;
    const r = await api<ServiceRow>(id ? `/api/services/${id}` : "/api/services", { method: id ? "PUT" : "POST", json: payload });
    setSaving(false);
    if (!r.ok) {
      setErrors(r.fields ?? {});
      toast("err", r.fields ? "Please fix the highlighted fields." : r.error ?? "Save failed");
      return;
    }
    toast("ok", id ? "Service updated" : "Service created");
    setForm(null); load();
  };

  const quickToggle = async (s: ServiceRow, patch: Partial<ServiceRow>) => {
    const { id, _count: _ignoredCount, ...rest } = s as any;
    void _ignoredCount;
    delete rest.createdAt; delete rest.updatedAt;
    const r = await api(`/api/services/${id}`, { method: "PUT", json: { ...rest, ...patch } });
    if (r.ok) { toast("ok", "Updated"); load(); } else toast("err", r.error ?? "Update failed");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    if (!items || filtering) return;
    const j = idx + dir; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[idx], next[j]] = [next[j], next[idx]];
    setItems(next);
    const r = await api("/api/services/reorder", { method: "POST", json: { ids: next.map((s) => s.id) } });
    if (!r.ok) { toast("err", r.error ?? "Reorder failed"); load(); }
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setDeleting(true);
    const r = await api(`/api/services/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (r.ok) { toast("ok", "Service deleted"); setToDelete(null); load(); } else toast("err", r.error ?? "Delete failed");
  };

  if (form) {
    const set = <K extends keyof ServiceRow>(k: K, v: ServiceRow[K]) => setForm({ ...form, [k]: v });
    return (
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setForm(null)} aria-label="Back to services" className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
          <h1 className="font-display font-bold text-snow text-xl">{form.id ? "Edit service" : "New service"}</h1>
          <div className="ml-auto"><button type="submit" disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50"><Save size={14} /> {saving ? "Saving…" : "Save"}</button></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="Title" required error={errors.title}>{(p) => <input {...p} value={form.title} onChange={(e) => set("title", e.target.value)} className="field-input" />}</Field>
          <Field label="Slug" error={errors.slug} hint="Leave blank to generate from the title.">{(p) => <input {...p} value={form.slug} onChange={(e) => set("slug", e.target.value)} className="field-input" />}</Field>
          <Field label="Journey stage" hint="Start / Build / Grow groups. Leave empty for core advisory services.">{(p) => (
            <select {...p} value={form.stage ?? ""} onChange={(e) => set("stage", e.target.value || null)} className="field-input">
              <option value="">{UNSTAGED.label}</option>
              {STAGE_ORDER.map((k) => <option key={k} value={k}>{STAGES[k].label} — {STAGES[k].kicker}</option>)}
            </select>)}</Field>
          <Field label="Icon" hint="Chosen from a fixed list.">{(p) => (
            <select {...p} value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value || null)} className="field-input">
              <option value="">Default</option>
              {ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>)}</Field>
          <Field label="Tagline" required error={errors.tagline} className="md:col-span-2">{(p) => <input {...p} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className="field-input" placeholder="One-sentence intro" />}</Field>
          <Field label="Description" required error={errors.description} className="md:col-span-2">{(p) => <textarea {...p} value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="field-input" />}</Field>
          <div className="md:col-span-2"><StringList label="What you get (inclusions)" items={form.scope} onChange={(v) => set("scope", v)} placeholder="e.g. Name availability search" error={errors.scope} /></div>
          <Field label="Delivery timeline" error={errors.deliveryTimeline}>{(p) => <input {...p} value={form.deliveryTimeline ?? ""} onChange={(e) => set("deliveryTimeline", e.target.value)} className="field-input" placeholder="e.g. 2–3 weeks, depending on scope" />}</Field>
          <Field label="Display order" error={errors.order}>{(p) => <input {...p} type="number" min={0} value={form.order} onChange={(e) => set("order", Number(e.target.value))} className="field-input" />}</Field>
          <Field label="Button label" error={errors.ctaLabel}>{(p) => <input {...p} value={form.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} className="field-input" placeholder="Talk to us" />}</Field>
          <Field label="Button link" error={errors.ctaUrl} hint="/contact, https://…, mailto: or tel:">{(p) => <input {...p} value={form.ctaUrl ?? ""} onChange={(e) => set("ctaUrl", e.target.value)} className="field-input" placeholder="/contact" />}</Field>
          <Field label="SEO title" error={errors.seoTitle} hint="Optional, max 70 characters.">{(p) => <input {...p} value={form.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} className="field-input" />}</Field>
          <Field label="SEO description" error={errors.seoDescription} hint="Optional, max 180 characters.">{(p) => <input {...p} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} className="field-input" />}</Field>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <Toggle label="Published" checked={!!form.published} onChange={(v) => set("published", v)} hint="Unpublished services never appear on the public site." />
            <Toggle label="Featured on home page" checked={form.featured} onChange={(v) => set("featured", v)} />
          </div>
        </div>

        <h2 className="field-label mb-3">Detail sections</h2>
        <SubItemEditor items={form.subItems} onChange={(v) => set("subItems", v)} />
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="font-display font-bold text-snow text-2xl">Services</h1><p className="text-mist text-sm mt-1">{items ? `${items.length} total` : "Loading…"}</p></div>
        <button type="button" onClick={() => openForm(blank())} className="btn-primary text-sm py-2.5"><Plus size={14} /> New service</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <input aria-label="Search services" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or slug" className="field-input max-w-xs" />
        <select aria-label="Filter by stage" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="field-input w-auto">
          <option value="all">All stages</option>
          {STAGE_ORDER.map((k) => <option key={k} value={k}>{STAGES[k].label}</option>)}
          <option value="none">{UNSTAGED.label}</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="field-input w-auto">
          <option value="all">Any status</option><option value="live">Published</option><option value="draft">Draft</option>
        </select>
      </div>
      {filtering && <p className="field-hint mb-3">Reordering is disabled while filters are active.</p>}

      {items === null ? <ListSkeleton /> : visible.length === 0 ? (
        <EmptyState>{items.length === 0 ? "No services yet. Create the first one." : "No services match these filters."}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((s) => {
            const idx = (items ?? []).findIndex((x) => x.id === s.id);
            return (
              <li key={s.id} className="card-base flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-semibold text-snow">{s.title}</span>
                    {s.stage ? <Chip tone="green">{STAGES[s.stage as keyof typeof STAGES]?.label ?? s.stage}</Chip> : <Chip>{UNSTAGED.label}</Chip>}
                    {isLive(s) ? <Chip tone="green">Published</Chip> : <Chip tone="amber">Draft</Chip>}
                    {s.featured && <Star size={12} className="text-volt fill-volt" aria-label="Featured" />}
                  </div>
                  <p className="text-mist text-xs truncate">{s.tagline}</p>
                  <p className="text-mist/60 text-xs mt-1">/{s.slug} · {s.subItems?.length ?? 0} detail sections · {s._count?.packages ?? 0} packages</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 items-center">
                  <button type="button" aria-label={`Move ${s.title} up`} disabled={filtering || idx <= 0} onClick={() => move(idx, -1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Move ${s.title} down`} disabled={filtering || idx === (items?.length ?? 0) - 1} onClick={() => move(idx, 1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" aria-label={isLive(s) ? `Unpublish ${s.title}` : `Publish ${s.title}`} onClick={() => quickToggle(s, { published: !isLive(s) })} className="p-2 text-mist hover:text-electric">{isLive(s) ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  <button type="button" aria-label={`Edit ${s.title}`} onClick={() => openForm(s)} className="p-2 text-mist hover:text-electric"><Edit size={14} /></button>
                  <button type="button" aria-label={`Delete ${s.title}`} onClick={() => setToDelete(s)} className="p-2 text-mist hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete} busy={deleting} title={`Delete “${toDelete?.title ?? ""}”?`}
        body={<>This removes the service and its detail sections. {(toDelete?._count?.packages ?? 0) > 0 ? <strong className="text-snow">{toDelete?._count?.packages} linked package(s) will be kept but unlinked from this service.</strong> : "Linked packages and FAQs, if any, are kept but unlinked."} This cannot be undone.</>}
        onConfirm={confirmDelete} onCancel={() => !deleting && setToDelete(null)}
      />
    </div>
  );
}
