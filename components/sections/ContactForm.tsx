"use client";
import { useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";

const BUDGETS = ["Under ₦500,000", "₦500,000 – ₦1.5M", "₦1.5M – ₦5M", "₦5M+", "Let's discuss"];
type Field = "name" | "email" | "message";
const EMPTY = { name: "", email: "", phone: "", company: "", service: "", budget: "", message: "", website: "" };

function validate(f: typeof EMPTY): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (f.name.trim().length < 2) e.name = "Please enter your name (at least 2 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email address, like name@company.com.";
  if (f.message.trim().length < 10) e.message = "Please tell us a little more (at least 10 characters).";
  return e;
}

export default function ContactForm({ serviceOptions, initialService = "" }: { serviceOptions: string[]; initialService?: string }) {
  const [form, setForm] = useState({ ...EMPTY, service: initialService });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const summary = useRef<HTMLDivElement>(null);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (k in errors) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate(form);
    setErrors(found);
    const first = (["name", "email", "message"] as Field[]).find((k) => found[k]);
    if (first) { ({ name: nameRef, email: emailRef, message: messageRef })[first].current?.focus(); return; }

    setStatus("loading"); setServerError("");
    try {
      const { website, ...rest } = form;
      const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rest, website }) });
      if (res.ok) { setStatus("success"); setForm({ ...EMPTY }); requestAnimationFrame(() => summary.current?.focus()); return; }
      const d = await res.json().catch(() => ({}));
      setServerError(d.error === "Invalid input" ? "Some details look invalid. Please check the form and try again." : d.error || "We could not send your message. Please try again.");
      setStatus("error");
    } catch {
      setServerError("Network error. Please check your connection and try again, or email us directly.");
      setStatus("error");
    }
    requestAnimationFrame(() => summary.current?.focus());
  };

  const err = (k: Field) => errors[k];
  return (
    <form onSubmit={submit} noValidate className="space-y-6" aria-describedby="form-status">
      <div id="form-status" ref={summary} tabIndex={-1} role={status === "error" ? "alert" : "status"} aria-live="polite" className="outline-none">
        {status === "success" && <p className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-leaf/25 p-4 font-medium"><CheckCircle2 className="mt-0.5 shrink-0" aria-hidden /> Thank you. Your message has been sent and we will be in touch.</p>}
        {status === "error" && <p className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-[#b42318]/40 bg-[#b42318]/10 p-4 font-medium text-[#7a1810]"><AlertCircle className="mt-0.5 shrink-0" aria-hidden /> {serverError}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Name <span aria-hidden>*</span></label>
          <input id="c-name" ref={nameRef} className="input" autoComplete="name" required value={form.name} onChange={set("name")} aria-invalid={!!err("name")} aria-describedby={err("name") ? "c-name-err" : undefined} />
          {err("name") && <p id="c-name-err" className="field-msg">{err("name")}</p>}
        </div>
        <div>
          <label className="label" htmlFor="c-email">Email <span aria-hidden>*</span></label>
          <input id="c-email" ref={emailRef} type="email" inputMode="email" className="input" autoComplete="email" required value={form.email} onChange={set("email")} aria-invalid={!!err("email")} aria-describedby={err("email") ? "c-email-err" : undefined} />
          {err("email") && <p id="c-email-err" className="field-msg">{err("email")}</p>}
        </div>
        <div>
          <label className="label" htmlFor="c-phone">Phone <span className="muted font-normal">(optional)</span></label>
          <input id="c-phone" type="tel" inputMode="tel" className="input" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="label" htmlFor="c-company">Company <span className="muted font-normal">(optional)</span></label>
          <input id="c-company" className="input" autoComplete="organization" value={form.company} onChange={set("company")} />
        </div>
        <div>
          <label className="label" htmlFor="c-service">What do you need? <span className="muted font-normal">(optional)</span></label>
          <select id="c-service" className="input" value={form.service} onChange={set("service")}>
            <option value="">Select a service</option>
            {serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="Other / not sure">Other / not sure</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="c-budget">Budget <span className="muted font-normal">(optional)</span></label>
          <select id="c-budget" className="input" value={form.budget} onChange={set("budget")}>
            <option value="">Select a range</option>
            {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="c-message">How can we help? <span aria-hidden>*</span></label>
        <textarea id="c-message" ref={messageRef} className="input" required rows={6} value={form.message} onChange={set("message")} aria-invalid={!!err("message")} aria-describedby={err("message") ? "c-message-err" : undefined} />
        {err("message") && <p id="c-message-err" className="field-msg">{err("message")}</p>}
      </div>

      {/* Honeypot: invisible to people and assistive tech, tempting to bots. The API silently drops submissions that fill it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="c-website">Leave this field empty</label>
        <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      </div>

      <button type="submit" disabled={status === "loading"} className="btn btn-ink w-full sm:w-auto disabled:opacity-60">
        {status === "loading" ? "Sending…" : "Send message"}<span className="btn-arrow"><Send size={16} aria-hidden /></span>
      </button>
    </form>
  );
}
