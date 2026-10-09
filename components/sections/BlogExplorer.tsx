"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import RemoteImage from "@/components/ui/RemoteImage";

export type BlogCard = { id: string; title: string; slug: string; excerpt: string; coverImage: string | null; category: string; readTime: number; createdAt: string };

const BATCH = 6;
const ALL = "All";

/**
 * Category filter plus progressive display: the first batch renders (and is fully readable without JS), and more
 * cards are added, each fading up in turn, as the visitor scrolls towards the end of the list.
 */
export default function BlogExplorer({ posts }: { posts: BlogCard[] }) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [[ALL, posts.length] as const, ...[...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))];
  }, [posts]);

  const [active, setActive] = useState(ALL);
  const [shown, setShown] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => (active === ALL ? posts : posts.filter((p) => p.category === active)), [posts, active]);
  const visible = filtered.slice(0, shown);
  const hasMore = shown < filtered.length;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    if (typeof IntersectionObserver === "undefined") return; // the "Load more" button still works
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) setShown((n) => n + BATCH); }, { rootMargin: "0px 0px 200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, filtered.length, shown]);

  function choose(c: string) { setActive(c); setShown(BATCH); }

  return (
    <>
      <div role="group" aria-label="Filter articles by category" className="-mx-1 mb-12 flex flex-wrap gap-2">
        {categories.map(([c, n]) => (
          <button key={c} type="button" onClick={() => choose(c)} aria-pressed={active === c}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${active === c ? "border-[color:var(--ink)] bg-[color:var(--ink)] text-[color:var(--on-dark)]" : "border-[color:var(--line-light)] hover:border-[color:var(--ink)]"}`}>
            {c} <span className={active === c ? "opacity-70" : "muted"}>{n}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite">Showing {visible.length} of {filtered.length} articles{active === ALL ? "" : ` in ${active}`}.</p>

      {/* key = category, so switching filter re-plays the entrance */}
      <ul key={active} className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((post, i) => (
          <li key={post.id} className="blog-card" style={{ animationDelay: `${(i % BATCH) * 70}ms` }}>
            <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius)] bg-[color:var(--ink)]">
                {post.coverImage && <RemoteImage src={post.coverImage} alt="" sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw" className="transition-transform duration-700 ease-out group-hover:scale-105" />}
              </div>
              <p className="eyebrow mt-6">{post.category}</p>
              <h2 className="t-h3 mt-3 group-hover:underline group-hover:underline-offset-4">{post.title}</h2>
              <p className="muted mt-3 line-clamp-3 text-[0.95rem]">{post.excerpt}</p>
              <p className="muted mt-auto flex items-center gap-4 pt-5 text-sm">
                <time dateTime={post.createdAt}>{new Date(post.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}</time>
                <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden />{post.readTime} min read</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && <p className="muted text-lg">No articles in this category yet.</p>}
      {hasMore && (
        <div ref={sentinel} className="mt-12 flex justify-center">
          <button type="button" onClick={() => setShown((n) => n + BATCH)} className="btn btn-ink btn-plain">Load more articles</button>
        </div>
      )}
    </>
  );
}
