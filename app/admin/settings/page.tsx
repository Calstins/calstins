"use client";

import { useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { Field, ListSkeleton, StringList, Toggle, api, useToast } from "@/components/admin/kit";

interface Settings {
  companyName: string; legalName: string; registrationNumber: string; registrationVerified: boolean; publicEmail: string; phone: string; whatsapp: string;
  addressLine: string; city: string; country: string; tagline: string; storyHeadline: string; storyBody: string; storyPublished: boolean; mission: string;
  milestones: { label: string; title: string; body: string }[]; values: { title: string; body: string }[];
  linkedin: string; twitter: string; instagram: string; facebook: string; github: string; contactCtaTitle: string; contactCtaBody: string; pricingDisclaimer: string;
  showContactDetails: boolean; contactPromises: string[];
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const hydrate = (r: any): Settings => ({
  companyName: s(r?.companyName) || "Calstins Ltd", legalName: s(r?.legalName), registrationNumber: s(r?.registrationNumber), registrationVerified: !!r?.registrationVerified,
  publicEmail: s(r?.publicEmail) || "info@calstins.com", phone: s(r?.phone), whatsapp: s(r?.whatsapp), addressLine: s(r?.addressLine), city: s(r?.city) || "Abuja", country: s(r?.country) || "Nigeria",
  tagline: s(r?.tagline), storyHeadline: s(r?.storyHeadline), storyBody: s(r?.storyBody), storyPublished: !!r?.storyPublished, mission: s(r?.mission),
  milestones: (r?.milestones ?? []).map((m: any) => ({ label: s(m.label), title: s(m.title), body: s(m.body) })),
  values: (r?.values ?? []).map((m: any) => ({ title: s(m.title), body: s(m.body) })),
  linkedin: s(r?.linkedin), twitter: s(r?.twitter), instagram: s(r?.instagram), facebook: s(r?.facebook), github: s(r?.github),
  contactCtaTitle: s(r?.contactCtaTitle), contactCtaBody: s(r?.contactCtaBody), pricingDisclaimer: s(r?.pricingDisclaimer),
  showContactDetails: !!r?.showContactDetails, contactPromises: Array.isArray(r?.contactPromises) ? r.contactPromises.map(s) : [],
});

function Section({ title, children, note }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink-border rounded-lg p-5 mb-6">
      <h2 className="font-display font-semibold text-snow text-lg">{title}</h2>
      {note && <p className="text-mist text-sm mt-1 mb-4">{note}</p>}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${note ? "" : "mt-4"}`}>{children}</div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [f, setF] = useState<Settings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api("/api/settings?raw=1");
      if (r.ok) setF(hydrate(r.data)); else { setF(hydrate(null)); toast("err", r.error ?? "Could not load settings"); }
    })();
  }, [toast]);

  if (!f) return <ListSkeleton />;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF({ ...f, [k]: v });
  const text = (k: keyof Settings, label: string, opts: { hint?: string; area?: boolean; type?: string; className?: string } = {}) => (
    <Field label={label} error={errors[k]} hint={opts.hint} className={opts.className}>
      {(p) => opts.area
        ? <textarea {...p} rows={4} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} className="field-input" />
        : <input {...p} type={opts.type ?? "text"} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} className="field-input" />}
    </Field>
  );

  const save = async () => {
    setSaving(true); setErrors({});
    const r = await api("/api/settings", { method: "PUT", json: f });
    setSaving(false);
    if (!r.ok) { setErrors(r.fields ?? {}); toast("err", r.fields ? "Please fix the highlighted fields." : r.error ?? "Save failed"); return; }
    toast("ok", "Settings saved. Public pages update within moments.");
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate className="max-w-4xl">
      <div className="flex items-center mb-6"><h1 className="font-display font-bold text-snow text-2xl">Company &amp; story</h1>
        <button type="submit" disabled={saving} className="btn-primary text-sm py-2 ml-auto disabled:opacity-50"><Save size={14} /> {saving ? "Saving…" : "Save changes"}</button></div>

      <Section title="Company" >
        {text("companyName", "Company name")}{text("legalName", "Registered legal name (optional)")}{text("tagline", "Tagline (optional)", { className: "md:col-span-2" })}
      </Section>

      <Section title="Registration number" note="Shown in the footer, About and Contact pages only when verified. Enter the exact number from your CAC certificate. If it is blank or unverified, the site shows “Registration number available on request” and never publishes a guess.">
        {text("registrationNumber", "CAC / RC number", { hint: "e.g. RC 1234567, copy it exactly as on the certificate." })}
        <div className="flex items-end pb-1"><Toggle label="I have checked this against the certificate" checked={f.registrationVerified} onChange={(v) => set("registrationVerified", v)} /></div>
        {errors.registrationNumber && <p className="field-error md:col-span-2" role="alert">{errors.registrationNumber}</p>}
      </Section>

      <Section title="Contact" note="Phone, WhatsApp and social links may contain PLACEHOLDERS. They stay hidden from the public site until you replace them with real details and switch the option below on.">
        <div className="md:col-span-2"><Toggle label="Show phone, WhatsApp and social links on the site" checked={f.showContactDetails} onChange={(v) => set("showContactDetails", v)} hint="Off = visitors only see your email and location." /></div>
        {text("publicEmail", "Public email", { type: "email" })}{text("phone", "Phone", { hint: "Optional. Only shown if filled in." })}
        {text("whatsapp", "WhatsApp number", { hint: "Optional. Adds a WhatsApp link only if filled in." })}{text("addressLine", "Street address (optional)")}
        {text("city", "City")}{text("country", "Country")}
        {text("contactCtaTitle", "Contact page headline (optional)", { className: "md:col-span-2" })}{text("contactCtaBody", "Contact page intro (optional)", { area: true, className: "md:col-span-2" })}
        <div className="md:col-span-2"><StringList label="“What to expect” promises on the contact page" items={f.contactPromises} onChange={(v) => set("contactPromises", v)} placeholder="e.g. Response within 24 hours" max={8} error={errors.contactPromises} />
          <p className="text-mist text-xs mt-2">Only list commitments you can keep. Leave empty to use the default four.</p></div>
      </Section>

      <Section title="Social links" note="https:// links only. Empty ones are not shown.">
        {text("linkedin", "LinkedIn")}{text("twitter", "X / Twitter")}{text("instagram", "Instagram")}{text("facebook", "Facebook")}{text("github", "GitHub")}
      </Section>

      <Section title="Our story" note="Until you publish this, the About page uses the existing approved copy. Add only milestones that really happened; dates are free text and never auto-generated.">
        <div className="md:col-span-2"><Toggle label="Use this story on the About page" checked={f.storyPublished} onChange={(v) => set("storyPublished", v)} hint="Leave off until the text below is approved." /></div>
        {text("storyHeadline", "Headline", { className: "md:col-span-2" })}
        {text("storyBody", "Story (blank line between paragraphs)", { area: true, className: "md:col-span-2" })}
        {text("mission", "Mission statement (optional)", { area: true, className: "md:col-span-2" })}

        <div className="md:col-span-2">
          <p className="field-label">Milestones</p>
          <div className="space-y-3">
            {f.milestones.map((m, i) => (
              <div key={i} className="bg-ink-light border border-ink-border rounded-lg p-3 grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] gap-3">
                <input aria-label={`Milestone ${i + 1} label`} placeholder="Year / phase" value={m.label} onChange={(e) => set("milestones", f.milestones.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className="field-input" />
                <input aria-label={`Milestone ${i + 1} title`} placeholder="Title" value={m.title} onChange={(e) => set("milestones", f.milestones.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="field-input" />
                <button type="button" aria-label={`Remove milestone ${i + 1}`} onClick={() => set("milestones", f.milestones.filter((_, k) => k !== i))} className="p-2 text-mist hover:text-red-400"><X size={14} /></button>
                <textarea aria-label={`Milestone ${i + 1} description`} placeholder="What happened" rows={2} value={m.body} onChange={(e) => set("milestones", f.milestones.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)))} className="field-input md:col-span-3" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("milestones", [...f.milestones, { label: "", title: "", body: "" }])} className="mt-2 inline-flex items-center gap-1 text-xs text-electric hover:underline"><Plus size={12} /> Add milestone</button>
        </div>

        <div className="md:col-span-2">
          <p className="field-label">Values</p>
          <div className="space-y-3">
            {f.values.map((v, i) => (
              <div key={i} className="bg-ink-light border border-ink-border rounded-lg p-3 grid grid-cols-1 md:grid-cols-[14rem_1fr_auto] gap-3">
                <input aria-label={`Value ${i + 1} title`} placeholder="Value" value={v.title} onChange={(e) => set("values", f.values.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} className="field-input" />
                <input aria-label={`Value ${i + 1} description`} placeholder="One sentence" value={v.body} onChange={(e) => set("values", f.values.map((x, k) => (k === i ? { ...x, body: e.target.value } : x)))} className="field-input" />
                <button type="button" aria-label={`Remove value ${i + 1}`} onClick={() => set("values", f.values.filter((_, k) => k !== i))} className="p-2 text-mist hover:text-red-400"><X size={14} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => set("values", [...f.values, { title: "", body: "" }])} className="mt-2 inline-flex items-center gap-1 text-xs text-electric hover:underline"><Plus size={12} /> Add value</button>
        </div>
      </Section>

      <Section title="Pricing disclaimer">{text("pricingDisclaimer", "Shown under package pricing", { area: true, className: "md:col-span-2", hint: "e.g. Prices exclude government fees and VAT where applicable. Only add wording you have confirmed." })}</Section>
    </form>
  );
}
