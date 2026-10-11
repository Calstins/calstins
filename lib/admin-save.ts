/** Client helper: sends JSON and reports a readable error instead of pretending the save worked. */
export async function saveJson(url: string, method: "POST" | "PUT", body: unknown): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data };
    if (res.status === 401) return { ok: false, error: "Your session has expired. Sign in again, then retry." };
    const f = data?.fields ? Object.entries(data.fields).map(([k, v]) => `${k}: ${v}`).join("; ") : "";
    return { ok: false, error: f || data?.error || `Save failed (${res.status})` };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}
