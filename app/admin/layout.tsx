"use client";

import Logo from "@/components/brand/Logo";
import "./admin.css";
import { useState } from "react";
import { ToastProvider } from "@/components/admin/kit";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Briefcase, Users,
  Star, Inbox, Search, LogOut, Menu, ChevronRight, Package, Settings, HelpCircle
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/blog", label: "Blog Posts", icon: FileText },
  { href: "/admin/services", label: "Services", icon: Briefcase },
  { href: "/admin/packages", label: "Packages & Pricing", icon: Package },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/projects", label: "Projects", icon: Briefcase },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/contacts", label: "Contacts", icon: Inbox },
  { href: "/admin/keywords", label: "Keyword Tool", icon: Search },
  { href: "/admin/settings", label: "Company & Story", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-ink-light border-r border-ink-border flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-5 border-b border-ink-border bg-ink">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="w-[150px] rounded-md" />
          </Link>
          <p className="text-mist/40 text-xs mt-1 font-mono">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-sm transition-all ${
                  active
                    ? "bg-electric/10 text-electric border border-electric/20"
                    : "text-mist hover:text-snow hover:bg-ink-card"
                }`}
              >
                <item.icon size={14} />
                {item.label}
                {active && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-ink-border">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 text-mist hover:text-red-400 text-sm rounded-sm hover:bg-red-400/10 transition-all"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-ink/90 backdrop-blur border-b border-ink-border px-6 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(!open)} className="lg:hidden text-mist hover:text-snow">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-mist/40 text-xs font-mono">
            {pathname.replace("/admin", "Admin").replace(/\//g, " / ")}
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-mist hover:text-electric transition-colors font-mono"
          >
            ↗ View Site
          </a>
        </header>

        <main className="p-6"><ToastProvider>{children}</ToastProvider></main>
      </div>
    </div>
  );
}
