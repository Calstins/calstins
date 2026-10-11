"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

/**
 * Floating WhatsApp chat launcher. The number comes from Admin > Company & story (falling back to the Calstins line).
 * Opens wa.me with a pre-filled message; nothing is sent to us or any third party until the visitor presses Send in WhatsApp.
 */
const TOPICS = [
  { label: "Website or app", text: "Hello Calstins, I would like a quote for a website or app. Here is a little about my business: " },
  { label: "Business registration", text: "Hello Calstins, I need help registering my business with CAC. Could you tell me the process and cost?" },
  { label: "SEO & growth", text: "Hello Calstins, I would like to grow my business online (SEO, ads or email). Can we talk?" },
  { label: "Tech advisory", text: "Hello Calstins, I need technology advisory for a project I am planning. Can we book a discovery call?" },
];

export default function WhatsAppWidget({ number, company }: { number: string; company: string }) {
  const digits = number.replace(/[^\d]/g, "");
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("Hello, I would like to talk about a project.");
  const [ready, setReady] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (digits.length < 7) return null;
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(msg.trim() || "Hello")}`;

  return (
    <div className={`fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 transition-all duration-500 sm:bottom-6 sm:right-6 ${ready ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
      {open && (
        <section id="wa-panel" role="dialog" aria-label={`Chat with ${company} on WhatsApp`} className="wa-pop w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white text-[#172532] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
          <header className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><MessageCircle size={20} aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{company}</p>
              <p className="text-xs text-white/80">{number} · replies within 24 hours</p>
            </div>
            <button type="button" onClick={() => { setOpen(false); btn.current?.focus(); }} aria-label="Close chat" className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"><X size={16} aria-hidden /></button>
          </header>
          <div className="space-y-3 bg-[#ECE5DD] p-4">
            <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm shadow-sm">Hi 👋 How can we help? Tell us a little about what you need and we will reply on WhatsApp.</p>
            <label className="block">
              <span className="sr-only">Your message</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick topics">
              {TOPICS.map((t) => (
                <button key={t.label} type="button" onClick={() => setMsg(t.text)} className="rounded-full border border-[#128C7E]/30 bg-white px-3 py-1 text-xs font-medium text-[#075E54] hover:bg-[#128C7E]/10">{t.label}</button>
              ))}
            </div>
            <textarea placeholder="Type your message…" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} maxLength={500} className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[#128C7E]" />
            </label>
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-[#0b2e1a] transition-colors hover:bg-[#3be07a]">
              <Send size={16} aria-hidden /> Start chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>
      )}
      <button ref={btn} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="wa-panel" aria-label={open ? "Close WhatsApp chat" : "Chat with us on WhatsApp"}
        className="wa-pulse grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(37,211,102,0.8)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        {open ? <X size={24} aria-hidden /> : <MessageCircle size={26} aria-hidden fill="currentColor" strokeWidth={1.5} />}
      </button>
    </div>
  );
}
