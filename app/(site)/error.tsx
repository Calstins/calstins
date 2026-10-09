"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";
import StatusPage from "@/components/ui/StatusPage";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => { console.error(error); }, [error]);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    const back = () => { setOffline(false); reset(); }; // connection is back: retry without asking
    sync();
    window.addEventListener("offline", sync);
    window.addEventListener("online", back);
    return () => { window.removeEventListener("offline", sync); window.removeEventListener("online", back); };
  }, [reset]);

  return (
    <StatusPage
      code="500"
      eyebrow={offline ? "You are offline" : "Something went wrong"}
      title={offline ? <>No connection <span className="accent-word">right now.</span></> : <>We hit a problem <span className="accent-word">loading this page.</span></>}
      actions={<>
        <button type="button" onClick={reset} className="btn btn-leaf"><RefreshCw size={16} aria-hidden /> Try again</button>
        <ArrowButton href="/" variant="outline-dark">Back to home</ArrowButton>
        <Link href="/contact" className="text-sm underline underline-offset-4">Contact us</Link>
      </>}
      aside={error.digest ? <p className="text-sm text-[color:var(--on-dark-muted)]">Reference for support: <code className="font-mono">{error.digest}</code></p> : undefined}
    >
      {offline
        ? "Your device has lost its internet connection. Reconnect and this page will reload by itself."
        : "That one is on our side, not yours. Try again in a moment. If it keeps happening, email us and quote the reference below."}
    </StatusPage>
  );
}
