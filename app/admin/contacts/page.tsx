"use client";

import { useEffect, useMemo, useState } from "react";
import { Building, CheckCheck, Mail, MailOpen, Phone, Send, Trash2, ExternalLink } from "lucide-react";
import { ConfirmDialog, EmptyState, Field, ListSkeleton, api, useToast, Chip } from "@/components/admin/kit";

interface Reply { subject: string; message: string; sentAt: string; emailSent: boolean; sentBy?: string | null }
interface Contact {
  id: string; name: string; email: string; phone?: string | null; company?: string | null; service?: string | null; budget?: string | null;
  message: string; read: boolean; replied: boolean; replies?: Reply[]; createdAt: string;
}
type Filter = "all" | "unread" | "awaiting";

const fmt = (d: string) => new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function AdminContacts() {
  const toast = useToast();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await api<Contact[]>("/api/contacts");
      if (r.ok) setContacts(Array.isArray(r.data) ? r.data : []); else { setContacts([]); toast("err", r.error ?? "Could not load enquiries"); }
    })();
  }, [toast]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (contacts ?? []).filter((c) =>
      (filter === "all" || (filter === "unread" ? !c.read : !c.replied)) &&
      (!q || [c.name, c.email, c.company, c.service, c.message].some((v) => v?.toLowerCase().includes(q))));
  }, [contacts, filter, query]);

  const selected = contacts?.find((c) => c.id === selectedId) ?? null;
  const patch = (id: string, p: Partial<Contact>) => setContacts((cs) => (cs ?? []).map((c) => (c.id === id ? { ...c, ...p } : c)));

  const open = (c: Contact) => {
    setSelectedId(c.id); setSubject(`Re: Your enquiry to Calstins Ltd`); setMessage(""); setErrors({});
    if (!c.read) { patch(c.id, { read: true }); api(`/api/contacts/${c.id}`, { method: "PUT", json: { read: true } }); }
  };

  const toggleReplied = async (c: Contact) => {
    const next = !c.replied;
    patch(c.id, { replied: next });
    const r = await api(`/api/contacts/${c.id}`, { method: "PUT", json: { replied: next } });
    if (!r.ok) { patch(c.id, { replied: !next }); toast("err", r.error ?? "Could not update"); }
  };

  const send = async () => {
    if (!selected) return;
    setSending(true); setErrors({});
    const r = await api<Contact>(`/api/contacts/${selected.id}/reply`, { method: "POST", json: { subject, message } });
    setSending(false);
    if (!r.ok) { setErrors(r.fields ?? {}); toast("err", r.fields ? "Please fix the highlighted fields." : r.error ?? "Could not send"); return; }
    patch(selected.id, { ...(r.data as Contact) });
    setMessage("");
    toast("ok", `Reply sent to ${selected.email}.`);
  };

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const r = await api(`/api/contacts/${toDelete.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!r.ok) { toast("err", r.error ?? "Could not delete"); return; }
    setContacts((cs) => (cs ?? []).filter((c) => c.id !== toDelete.id));
    if (selectedId === toDelete.id) setSelectedId(null);
    setToDelete(null); toast("ok", "Enquiry deleted.");
  };

  if (!contacts) return <ListSkeleton />;
  const unread = contacts.filter((c) => !c.read).length;
  const awaiting = contacts.filter((c) => !c.replied).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-snow text-2xl">Enquiries</h1>
        <p className="text-mist text-sm mt-1">{unread} unread · {awaiting} awaiting reply · {contacts.length} total</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <div className="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="Filter enquiries">
            {([["all", `All (${contacts.length})`], ["unread", `Unread (${unread})`], ["awaiting", `Awaiting reply (${awaiting})`]] as [Filter, string][]).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-full text-xs border ${filter === k ? "border-electric text-electric" : "border-ink-border text-mist hover:text-snow"}`}>{label}</button>
            ))}
          </div>
          <input aria-label="Search enquiries" placeholder="Search name, email, message…" value={query} onChange={(e) => setQuery(e.target.value)} className="field-input mb-3 w-full" />

          <div className="space-y-2">
            {list.length === 0 ? <EmptyState>{contacts.length === 0 ? "No enquiries yet. They appear here when someone uses the contact form." : "Nothing matches this filter."}</EmptyState> : list.map((c) => (
              <div key={c.id} className={`card-base transition-all ${selectedId === c.id ? "border-electric/40" : "hover:border-electric/20"} ${!c.read ? "bg-electric/5" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => open(c)} className="flex flex-1 items-start gap-2.5 min-w-0 text-left" aria-current={selectedId === c.id}>
                    <span className="mt-0.5 shrink-0">{c.read ? <MailOpen size={14} className="text-mist/50" /> : <Mail size={14} className="text-electric" />}</span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-display font-semibold truncate ${!c.read ? "text-snow" : "text-mist"}`}>{c.name}</span>
                      <span className="block text-mist/70 text-xs truncate">{c.email}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {c.service && <span className="text-xs font-mono text-electric/70 border border-electric/20 px-1.5 py-0.5 rounded-sm">{c.service}</span>}
                        {c.replied && <Chip tone="green">Replied</Chip>}
                      </span>
                      <span className="block text-mist/60 text-xs mt-2 line-clamp-1">{c.message}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-mist/50 text-xs font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                    <button type="button" aria-label={`Delete enquiry from ${c.name}`} onClick={() => setToDelete(c)} className="p-1.5 text-mist/50 hover:text-red-400"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selected ? <div className="card-base flex items-center justify-center py-20 text-mist/60 text-sm">Select an enquiry to read and reply</div> : (
            <div className="card-base lg:sticky lg:top-24 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-snow text-xl">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="text-electric text-sm hover:underline">{selected.email}</a>
                </div>
                <span className="text-mist/60 text-xs font-mono text-right">{fmt(selected.createdAt)}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {selected.phone && <div className="flex items-center gap-2 text-mist"><Phone size={12} className="text-electric" />{selected.phone}</div>}
                {selected.company && <div className="flex items-center gap-2 text-mist"><Building size={12} className="text-electric" />{selected.company}</div>}
                {selected.service && <div><span className="font-mono text-mist/60">Service: </span><span className="text-snow">{selected.service}</span></div>}
                {selected.budget && <div><span className="font-mono text-mist/60">Budget: </span><span className="text-snow">{selected.budget}</span></div>}
              </div>

              <div className="bg-ink border border-ink-border rounded-sm p-4">
                <p className="font-mono text-xs text-mist/60 uppercase tracking-wider mb-2">Their message</p>
                <p className="text-mist text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>

              {(selected.replies?.length ?? 0) > 0 && (
                <div className="space-y-3" aria-label="Replies sent">
                  <p className="font-mono text-xs text-mist/60 uppercase tracking-wider">Sent replies</p>
                  {selected.replies!.map((r, i) => (
                    <div key={i} className="border-l-2 border-electric/50 pl-3">
                      <p className="text-snow text-sm font-semibold">{r.subject}</p>
                      <p className="text-mist/60 text-xs mb-1">{fmt(r.sentAt)}{r.sentBy ? ` · ${r.sentBy}` : ""}</p>
                      <p className="text-mist text-sm whitespace-pre-wrap">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); send(); }} noValidate className="space-y-3 border-t border-ink-border pt-5">
                <p className="font-display font-semibold text-snow">Reply by email</p>
                <Field label="Subject" error={errors.subject}>{(p) => <input {...p} value={subject} onChange={(e) => setSubject(e.target.value)} className="field-input" />}</Field>
                <Field label={`Message to ${selected.name}`} error={errors.message}>{(p) => <textarea {...p} rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className="field-input" placeholder="Write your reply…" />}</Field>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={sending} className="btn-primary text-sm py-2 disabled:opacity-50"><Send size={14} /> {sending ? "Sending…" : "Send reply"}</button>
                  <a href={`mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`} className="inline-flex items-center gap-1 text-xs text-mist hover:text-snow"><ExternalLink size={12} /> Open in mail app</a>
                  <button type="button" onClick={() => toggleReplied(selected)} className="ml-auto inline-flex items-center gap-1 text-xs text-mist hover:text-snow"><CheckCheck size={12} /> {selected.replied ? "Mark as not replied" : "Mark as replied"}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={!!toDelete} title="Delete this enquiry?" body={<>The enquiry from <strong>{toDelete?.name}</strong> and any replies recorded on it will be permanently removed.</>} busy={deleting} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </div>
  );
}
