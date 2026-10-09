"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Edit, Eye, EyeOff, Plus, Save, Star, Trash2 } from "lucide-react";
import { ConfirmDialog, Chip, EmptyState, Field, ListSkeleton, StringList, Toggle, api, useToast } from "@/components/admin/kit";
import { formatPrice, type BillingPeriod, type PriceType } from "@/lib/pricing";
import { STAGES, STAGE_ORDER } from "@/lib/stages";

interface Pkg {
  id?: string; name: string; slug: string; serviceId: string | null; stage: string | null; audience: string | null; summary: string;
  priceType: PriceType; priceAmount: number | null; priceMin: number | null; priceMax: number | null; currency: string; billingPeriod: BillingPeriod;
  deliveryTimeline: string | null; features: string[]; exclusions: string[]; notes: string | null; featured: boolean; published: boolean; order: number;
  ctaLabel: string | null; ctaUrl: string | null;
}
interface ServiceOpt { id: string; title: string }

const blank = (): Pkg => ({
  name: "", slug: "", serviceId: null, stage: null, audience: "", summary: "", priceType: "CUSTOM_QUOTE", priceAmount: null, priceMin: null, priceMax: null,
  currency: "NGN", billingPeriod: "ONE_OFF", deliveryTimeline: "", features: [], exclusions: [], notes: "", featured: false, published: false, order: 0, ctaLabel: "", ctaUrl: "",
});

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v.replace(/[,\s]/g, "")));

export default function AdminPackagesPage() {
  const toast = useToast();
  const [items, setItems] = useState<Pkg[] | null>(null);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [form, setForm] = useState<Pkg | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Pkg | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => setReloadKey((k) => k + 1), []);
  useEffect(() => {
    let alive = true;
    Promise.all([api<Pkg[]>("/api/packages?all=1"), api<ServiceOpt[]>("/api/services?all=1")]).then(([p, s]) => {
      if (!alive) return;
      if (p.ok) setItems(p.data ?? []); else { setItems([]); toast("err", p.error ?? "Could not load packages"); }
      if (s.ok) setServices((s.data ?? []).map((x) => ({ id: x.id, title: x.title })));
    });
    return () => { alive = false; };
  }, [reloadKey, toast]);

  const filtering = !!q || status !== "all";
  const visible = useMemo(() => (items ?? []).filter((p) =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (status === "all" || (status === "live" ? p.published : !p.published))), [items, q, status]);
  const svcName = (id: string | null) => services.find((s) => s.id === id)?.title;

  const openForm = (p: Pkg) => {
    setErrors({});
    setForm({ ...blank(), ...p, audience: p.audience ?? "", deliveryTimeline: p.deliveryTimeline ?? "", notes: p.notes ?? "", ctaLabel: p.ctaLabel ?? "", ctaUrl: p.ctaUrl ?? "" });
  };

  const save = async () => {
    if (!form) return;
    setSaving(true); setErrors({});
    const { id, ...payload } = form as Pkg & { createdAt?: string; updatedAt?: string };
    delete (payload as any).createdAt; delete (payload as any).updatedAt;
    const r = await api(id ? `/api/packages/${id}` : "/api/packages", { method: id ? "PUT" : "POST", json: payload });
    setSaving(false);
    if (!r.ok) { setErrors(r.fields ?? {}); toast("err", r.fields ? "Please fix the highlighted fields." : r.error ?? "Save failed"); return; }
    toast("ok", id ? "Package updated" : "Package created (draft until published)");
    setForm(null); load();
  };

  const quickPatch = async (p: Pkg, patch: Partial<Pkg>) => {
    const { id, ...rest } = p as any; delete rest.createdAt; delete rest.updatedAt;
    const r = await api(`/api/packages/${id}`, { method: "PUT", json: { ...rest, ...patch } });
    if (r.ok) { toast("ok", "Updated"); load(); } else toast("err", r.fields ? Object.values(r.fields)[0] : r.error ?? "Update failed");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    if (!items || filtering) return;
    const j = idx + dir; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[idx], next[j]] = [next[j], next[idx]]; setItems(next);
    const r = await api("/api/packages/reorder", { method: "POST", json: { ids: next.map((p) => p.id) } });
    if (!r.ok) { toast("err", r.error ?? "Reorder failed"); load(); }
  };

  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    setDeleting(true);
    const r = await api(`/api/packages/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (r.ok) { toast("ok", "Package deleted"); setToDelete(null); load(); } else toast("err", r.error ?? "Delete failed");
  };

  if (form) {
    const set = <K extends keyof Pkg>(k: K, v: Pkg[K]) => setForm({ ...form, [k]: v });
    const preview = formatPrice(form);
    const needsAmount = form.priceType === "FIXED" || form.priceType === "STARTING_AT";
    return (
      <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => setForm(null)} aria-label="Back to packages" className="text-mist hover:text-snow p-1"><ArrowLeft size={18} /></button>
          <h1 className="font-display font-bold text-snow text-xl">{form.id ? "Edit package" : "New package"}</h1>
          <div className="ml-auto"><button type="submit" disabled={saving} className="btn-primary text-sm py-2 disabled:opacity-50"><Save size={14} /> {saving ? "Saving…" : "Save"}</button></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Field label="Name" required error={errors.name}>{(p) => <input {...p} value={form.name} onChange={(e) => set("name", e.target.value)} className="field-input" />}</Field>
          <Field label="Slug" error={errors.slug} hint="Leave blank to generate from the name.">{(p) => <input {...p} value={form.slug} onChange={(e) => set("slug", e.target.value)} className="field-input" />}</Field>
          <Field label="Linked service" error={errors.serviceId}>{(p) => (
            <select {...p} value={form.serviceId ?? ""} onChange={(e) => set("serviceId", e.target.value || null)} className="field-input">
              <option value="">Standalone (no linked service)</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>)}</Field>
          <Field label="Journey stage">{(p) => (
            <select {...p} value={form.stage ?? ""} onChange={(e) => set("stage", e.target.value || null)} className="field-input">
              <option value="">None</option>{STAGE_ORDER.map((k) => <option key={k} value={k}>{STAGES[k].label}</option>)}
            </select>)}</Field>
          <Field label="Who it is for" error={errors.audience} className="md:col-span-2">{(p) => <input {...p} value={form.audience ?? ""} onChange={(e) => set("audience", e.target.value)} className="field-input" placeholder="e.g. Founders registering their first business" />}</Field>
          <Field label="Summary" required error={errors.summary} className="md:col-span-2">{(p) => <textarea {...p} rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)} className="field-input" />}</Field>
        </div>

        <fieldset className="border border-ink-border rounded-lg p-4 mb-8">
          <legend className="field-label px-2">Pricing</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Price type" error={errors.priceType}>{(p) => (
              <select {...p} value={form.priceType} onChange={(e) => set("priceType", e.target.value as PriceType)} className="field-input">
                <option value="FIXED">Fixed price</option><option value="STARTING_AT">Starting from</option><option value="RANGE">Price range</option><option value="CUSTOM_QUOTE">Custom quote (no figure shown)</option>
              </select>)}</Field>
            <Field label="Currency" error={errors.currency} hint="3-letter code, e.g. NGN">{(p) => <input {...p} maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} className="field-input" />}</Field>
            <Field label="Billing" error={errors.billingPeriod}>{(p) => (
              <select {...p} value={form.billingPeriod} onChange={(e) => set("billingPeriod", e.target.value as BillingPeriod)} className="field-input">
                <option value="ONE_OFF">One-off</option><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="ANNUAL">Annual</option>
              </select>)}</Field>
            {needsAmount && <Field label="Amount (whole units)" required error={errors.priceAmount} hint="No decimals or commas needed.">{(p) => <input {...p} inputMode="numeric" value={form.priceAmount ?? ""} onChange={(e) => set("priceAmount", num(e.target.value))} className="field-input" />}</Field>}
            {form.priceType === "RANGE" && (<>
              <Field label="Lowest price" required error={errors.priceMin}>{(p) => <input {...p} inputMode="numeric" value={form.priceMin ?? ""} onChange={(e) => set("priceMin", num(e.target.value))} className="field-input" />}</Field>
              <Field label="Highest price" required error={errors.priceMax}>{(p) => <input {...p} inputMode="numeric" value={form.priceMax ?? ""} onChange={(e) => set("priceMax", num(e.target.value))} className="field-input" />}</Field>
            </>)}
          </div>
          <p className="mt-4 text-sm text-mist" aria-live="polite">Public label preview: <strong className="text-snow">{preview.typeLabel}</strong>{preview.amount ? <> · <span className="text-electric">{preview.amount}</span> {preview.period}</> : <> · visitors see “Request a quote”</>}</p>
        </fieldset>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="md:col-span-2"><StringList label="What's included" items={form.features} onChange={(v) => set("features", v)} placeholder="e.g. Name availability search" error={errors.features} /></div>
          <div className="md:col-span-2"><StringList label="Not included (optional)" items={form.exclusions} onChange={(v) => set("exclusions", v)} placeholder="e.g. Government filing fees" max={20} /></div>
          <Field label="Delivery timeline" error={errors.deliveryTimeline}>{(p) => <input {...p} value={form.deliveryTimeline ?? ""} onChange={(e) => set("deliveryTimeline", e.target.value)} className="field-input" />}</Field>
          <Field label="Display order" error={errors.order}>{(p) => <input {...p} type="number" min={0} value={form.order} onChange={(e) => set("order", Number(e.target.value))} className="field-input" />}</Field>
          <Field label="Note / disclaimer" error={errors.notes} className="md:col-span-2">{(p) => <textarea {...p} rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="field-input" />}</Field>
          <Field label="Button label" error={errors.ctaLabel}>{(p) => <input {...p} value={form.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} className="field-input" placeholder="Request this package" />}</Field>
          <Field label="Button link" error={errors.ctaUrl} hint="Blank = contact page with this package pre-selected.">{(p) => <input {...p} value={form.ctaUrl ?? ""} onChange={(e) => set("ctaUrl", e.target.value)} className="field-input" />}</Field>
          <div className="flex flex-wrap gap-6 md:col-span-2">
            <Toggle label="Published" checked={form.published} onChange={(v) => set("published", v)} hint="Drafts are invisible to visitors. Only publish once the price is owner-approved." />
            <Toggle label="Featured (highlighted card)" checked={form.featured} onChange={(v) => set("featured", v)} />
          </div>
          {errors.features && <p className="field-error md:col-span-2" role="alert">{errors.features}</p>}
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div><h1 className="font-display font-bold text-snow text-2xl">Packages &amp; pricing</h1><p className="text-mist text-sm mt-1">{items ? `${items.length} total · ${items.filter((p) => p.published).length} published` : "Loading…"}</p></div>
        <button type="button" onClick={() => openForm(blank())} className="btn-primary text-sm py-2.5"><Plus size={14} /> New package</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <input aria-label="Search packages" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="field-input max-w-xs" />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="field-input w-auto"><option value="all">Any status</option><option value="live">Published</option><option value="draft">Draft</option></select>
      </div>
      {filtering && <p className="field-hint mb-3">Reordering is disabled while filters are active.</p>}
      {items === null ? <ListSkeleton /> : visible.length === 0 ? (
        <EmptyState>{items.length === 0 ? "No packages yet. New packages start as drafts, so nothing goes public until you publish it." : "No packages match these filters."}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => {
            const idx = (items ?? []).findIndex((x) => x.id === p.id);
            const price = formatPrice(p);
            return (
              <li key={p.id} className="card-base flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-semibold text-snow">{p.name}</span>
                    {p.published ? <Chip tone="green">Published</Chip> : <Chip tone="amber">Draft</Chip>}
                    {p.featured && <Star size={12} className="text-volt fill-volt" aria-label="Featured" />}
                  </div>
                  <p className="text-sm text-snow">{price.typeLabel}{price.amount ? <> · <span className="text-electric">{price.amount}</span> <span className="text-mist">{price.period}</span></> : null}</p>
                  <p className="text-mist text-xs mt-1 truncate">{svcName(p.serviceId) ? `${svcName(p.serviceId)} · ` : "Standalone · "}{p.features.length} inclusions</p>
                </div>
                <div className="flex gap-1 flex-shrink-0 items-center">
                  <button type="button" aria-label={`Move ${p.name} up`} disabled={filtering || idx <= 0} onClick={() => move(idx, -1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" aria-label={`Move ${p.name} down`} disabled={filtering || idx === (items?.length ?? 0) - 1} onClick={() => move(idx, 1)} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" aria-label={p.published ? `Unpublish ${p.name}` : `Publish ${p.name}`} onClick={() => quickPatch(p, { published: !p.published })} className="p-2 text-mist hover:text-electric">{p.published ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  <button type="button" aria-label={`Edit ${p.name}`} onClick={() => openForm(p)} className="p-2 text-mist hover:text-electric"><Edit size={14} /></button>
                  <button type="button" aria-label={`Delete ${p.name}`} onClick={() => setToDelete(p)} className="p-2 text-mist hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog open={!!toDelete} busy={deleting} title={`Delete “${toDelete?.name ?? ""}”?`} body="This permanently removes the package and its pricing. This cannot be undone." onConfirm={confirmDelete} onCancel={() => !deleting && setToDelete(null)} />
    </div>
  );
}
