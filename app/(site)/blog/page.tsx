import Intro from "@/components/motion/Intro";
import BlogExplorer from "@/components/sections/BlogExplorer";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Insights — Technology Strategy & Advisory",
  description: "Thinking on technology strategy, IT consulting, digital transformation and long-term partnership from the Calstins team.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await prisma.post
    .findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, category: true, readTime: true, createdAt: true } })
    .catch(() => []);

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-20 md:pb-28 md:pt-28">
          <p data-anim className="eyebrow mb-8">Insights</p>
          <h1 data-anim data-split className="t-h1 max-w-5xl">Thinking on strategy,{" "}<br /><span className="accent-word">technology and delivery.</span></h1>
          <p data-anim className="t-lead mt-8 text-[color:var(--on-dark-muted)]">Perspectives on technology strategy, IT consulting, digital transformation and the long-term partnerships that make technology programmes work.</p>
        </Intro>
      </section>

      <section className="surface-light section">
        <div className="container-wide">
          {posts.length === 0 ? (
            <p className="muted text-lg">Insights are coming soon. Check back shortly.</p>
          ) : (
            <BlogExplorer posts={posts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))} />
          )}
        </div>
      </section>
    </>
  );
}
