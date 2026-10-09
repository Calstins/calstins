"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, X, ArrowUp, ArrowDown, Plus } from "lucide-react";

// ── API helper ────────────────────────────────────────────────────────────────
export interface ApiResult<T = unknown> { ok: boolean; status: number; data: T | null; error?: string; fields?: Record<string, string> }

export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      credentials: "same-origin",
    });
    let body: any = null;
    try { body = await res.json(); } catch { /* empty body */ }
    if (res.status === 401 && typeof window !== "undefined") {
      // Hard redirect on purpose: drop all client state when the session has expired.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/admin/login";
    }
    if (!res.ok) return { ok: false, status: res.status, data: null, error: body?.error || `Request failed (${res.status})`, fields: body?.fields };
    return { ok: true, status: res.status, data: body as T };
  } catch {
    return { ok: false, status: 0, data: null, error: "Network error. Check your connection and try again." };
  }
}

// ── Toasts ───────────────────────────────────────────────────────────────────
type Toast = { id: number; tone: "ok" | "err"; text: string };
const ToastCtx = createContext<(tone: Toast["tone"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "err" ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg max-w-sm ${t.tone === "ok" ? "bg-ink-card border-electric/40 text-snow" : "bg-ink-card border-red-400/50 text-red-200"}`}>
            {t.tone === "ok" ? <CheckCircle2 size={16} className="text-electric mt-0.5 shrink-0" /> : <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Confirm dialog (native <dialog>: focus trap + Esc handled by the browser) ─
export function ConfirmDialog({ open, title, body, confirmLabel = "Delete", busy, onConfirm, onCancel }: {
  open: boolean; title: string; body: ReactNode; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="admin-dialog" onCancel={(e) => { e.preventDefault(); if (!busy) onCancel(); }} aria-labelledby="confirm-title">
      <h2 id="confirm-title" className="font-display text-lg font-bold mb-2">{title}</h2>
      <div className="text-mist text-sm mb-6">{body}</div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost text-sm py-2">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-red-500 text-white text-sm font-semibold hover:bg-red-400 disabled:opacity-50">
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

// ── Form pieces ──────────────────────────────────────────────────────────────
export function Field({ label, error, hint, required, children, className = "" }: { label: string; error?: string; hint?: string; required?: boolean; children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode; className?: string }) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}{required && <span aria-hidden> *</span>}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? msgId : undefined })}
      {error ? <p id={msgId} className="field-error" role="alert">{error}</p> : hint ? <p id={msgId} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm text-snow cursor-pointer select-none">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#7FDC8A]" />
        {label}
      </label>
      {hint && <p className="field-hint ml-6">{hint}</p>}
    </div>
  );
}

/** Editable list of one-line strings (inclusions, exclusions, bullets). Reorderable. */
export function StringList({ label, items, onChange, placeholder, error, max = 30 }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder?: string; error?: string; max?: number }) {
  const set = (i: number, v: string) => onChange(items.map((x, k) => (k === i ? v : x)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-1.5">
            <input aria-label={`${label} ${i + 1}`} value={it} onChange={(e) => set(i, e.target.value)} placeholder={placeholder} className="field-input flex-1" />
            <button type="button" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowUp size={14} /></button>
            <button type="button" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-2 text-mist hover:text-snow disabled:opacity-30"><ArrowDown size={14} /></button>
            <button type="button" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(items.filter((_, k) => k !== i))} className="p-2 text-mist hover:text-red-400"><X size={14} /></button>
          </div>
        ))}
      </div>
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ""])} className="mt-2 inline-flex items-center gap-1 text-xs text-electric hover:underline"><Plus size={12} /> Add item</button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </fieldset>
  );
}

export function Chip({ tone, children }: { tone?: "green" | "amber" | "red"; children: ReactNode }) {
  return <span className="admin-chip" data-tone={tone}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="text-center py-14 text-mist text-sm border border-dashed border-ink-border rounded-lg">{children}</div>;
}

export function ListSkeleton() {
  return <div className="space-y-3" aria-hidden>{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-ink-card/60 animate-pulse" />)}</div>;
}
