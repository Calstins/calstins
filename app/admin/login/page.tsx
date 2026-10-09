"use client";

import { useState } from "react";
import "../admin.css";
import Logo from "@/components/brand/Logo";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        // Full navigation so the proxy sees the fresh cookie and every admin page loads with the session.
        window.location.assign("/admin");
        return;
      }
      const d = await res.json().catch(() => ({}));
      setError(d.error || `Login failed (${res.status})`);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mx-auto mb-10 w-56"><Logo priority className="w-full" sizes="224px" /></div>

        <div className="card-base">
          <h1 className="font-display font-700 text-snow text-xl mb-1">Admin Login</h1>
          <p className="text-mist text-sm mb-6">Sign in to the CMS dashboard</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="adm-email" className="field-label">Email</label>
              <input
                id="adm-email"
                type="email"
                autoComplete="username"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-ink border border-ink-border rounded-sm text-snow text-sm focus:outline-none focus:border-electric transition-colors"
                placeholder="admin@calstins.com"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="field-label">Password</label>
              <input
                id="adm-pass"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 bg-ink border border-ink-border rounded-sm text-snow text-sm focus:outline-none focus:border-electric transition-colors"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-sm">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
