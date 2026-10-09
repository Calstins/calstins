// Live counts from MongoDB: must render per request, never be baked in at build time.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Briefcase, Inbox, Star, Users, TrendingUp, RefreshCw } from "lucide-react";
import { getDashboardData } from "@/lib/admin-stats";
import ProblemPanel from "@/components/admin/ProblemPanel";

export default async function AdminDashboard() {
  const data = await getDashboardData();
  if (!data.ok) {
    return (
      <ProblemPanel
        title={data.problem.title}
        actions={<>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload on purpose: re-runs the failed server queries */}
          <a href="/admin" className="btn-primary text-sm py-2"><RefreshCw size={14} /> Try again</a>
          <Link href="/" className="text-sm text-mist hover:text-snow">View the public site</Link>
        </>}
      >
        <p>{data.problem.hint}</p>
        <p className="mt-3">Nothing has been lost. The admin comes back as soon as the connection does. The public site keeps working with what it has.</p>
      </ProblemPanel>
    );
  }
  const { stats, recent } = data;

  const cards = [
    { label: "Blog Posts", value: stats.posts, icon: FileText, href: "/admin/blog", color: "text-electric" },
    { label: "Projects", value: stats.projects, icon: Briefcase, href: "/admin/projects", color: "text-volt" },
    { label: "Contacts", value: stats.contacts, icon: Inbox, href: "/admin/contacts", color: "text-blue-400", badge: stats.unread > 0 ? stats.unread : undefined },
    { label: "Testimonials", value: stats.testimonials, icon: Star, href: "/admin/testimonials", color: "text-yellow-400" },
    { label: "Clients", value: stats.clients, icon: Users, href: "/admin/clients", color: "text-purple-400" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-700 text-snow text-2xl mb-1">Dashboard</h1>
        <p className="text-mist text-sm">Welcome back. Here&apos;s your site overview.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="card-base hover:border-electric/30 transition-all group relative"
          >
            {c.badge && (
              <span className="absolute top-3 right-3 bg-electric text-ink text-xs font-mono font-700 px-1.5 py-0.5 rounded-sm">
                {c.badge} new
              </span>
            )}
            <c.icon size={20} className={`${c.color} mb-3`} />
            <div className="font-display font-800 text-snow text-3xl">{c.value}</div>
            <div className="text-mist text-xs mt-1">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card-base">
          <h2 className="font-display font-700 text-snow mb-4 flex items-center gap-2">
            <Inbox size={16} className="text-electric" /> Recent Inquiries
          </h2>
          <RecentContacts contacts={recent} />
        </div>
        <div className="card-base">
          <h2 className="font-display font-700 text-snow mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-volt" /> Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { href: "/admin/blog/new", label: "Write a Blog Post" },
              { href: "/admin/projects", label: "Manage Projects" },
              { href: "/admin/services", label: "Manage Services" },
              { href: "/admin/clients", label: "Manage Clients" },
              { href: "/admin/testimonials", label: "Manage Testimonials" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between px-3 py-2.5 bg-ink border border-ink-border rounded-sm text-mist hover:text-electric hover:border-electric/30 transition-all text-sm"
              >
                {a.label}
                <span className="text-xs">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentContacts({ contacts }: { contacts: { id: string; name: string; email: string; service: string | null; read: boolean }[] }) {
  if (contacts.length === 0) {
    return <p className="text-mist text-sm">No contacts yet.</p>;
  }

  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <Link
          key={c.id}
          href="/admin/contacts"
          className="flex items-center justify-between py-2 border-b border-ink-border/50 last:border-0 group"
        >
          <div>
            <p className="text-snow text-sm font-display font-600 group-hover:text-electric transition-colors">
              {c.name}
            </p>
            <p className="text-mist text-xs">{c.service || "General"} · {c.email}</p>
          </div>
          {!c.read && (
            <span className="w-2 h-2 rounded-full bg-electric flex-shrink-0" />
          )}
        </Link>
      ))}
    </div>
  );
}
