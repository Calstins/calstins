"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import ProblemPanel from "@/components/admin/ProblemPanel";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  // Retry automatically when the browser regains its connection.
  useEffect(() => {
    const back = () => reset();
    window.addEventListener("online", back);
    return () => window.removeEventListener("online", back);
  }, [reset]);
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;

  return (
    <ProblemPanel
      title={offline ? "You are offline" : "This page could not load"}
      actions={<>
        <button type="button" onClick={reset} className="btn-primary text-sm py-2"><RefreshCw size={14} /> Try again</button>
        <Link href="/admin" className="text-sm text-mist hover:text-snow">Back to dashboard</Link>
      </>}
      detail={[error.message, error.digest && `Reference: ${error.digest}`].filter(Boolean).join("\n")}
    >
      <p>{offline ? "Reconnect to the internet and this page will retry by itself." : "Something went wrong while loading data for this screen. This is usually a database connection problem."}</p>
      <p className="mt-3">Run <code className="rounded bg-ink px-1.5 py-0.5 font-mono text-electric">npm run db:check</code> in the project folder to diagnose the connection.</p>
    </ProblemPanel>
  );
}
