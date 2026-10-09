import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import RemoteImage from "@/components/ui/RemoteImage";
import ArrowButton from "@/components/ui/ArrowButton";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

const load = (slug: string) => prisma.post.findUnique({ where: { slug } }).catch(() => null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post || !post.published) return { title: "Article not found", robots: { index: false } };
  return {
    ...pageMetadata({ title: post.metaTitle || post.title, description: post.metaDesc || post.excerpt, path: `/blog/${post.slug}`, image: post.coverImage, type: "article" }),
    keywords: post.keywords?.length ? post.keywords : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await load(slug);
  if (!post || !post.published) notFound();

  // Count the view without blocking render.
  prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const ld = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt,
    datePublished: post.createdAt.toISOString(), dateModified: post.updatedAt.toISOString(), mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    ...(post.coverImage ? { image: [post.coverImage] } : {}), publisher: { "@type": "Organization", name: "Calstins Ltd" },
  };

  return (
    <article>
      <header className="surface-dark">
        <div className="container-wide pb-16 pt-14 md:pb-24 md:pt-20">
          <Link href="/blog" className="mb-10 inline-flex items-center gap-2 text-[color:var(--on-dark-muted)] hover:text-leaf"><ArrowLeft size={16} aria-hidden /> All insights</Link>
          <p className="eyebrow mb-6">{post.category}</p>
          <h1 className="t-h1 max-w-5xl !text-[length:var(--fs-h2)]">{post.title}</h1>
          <p className="t-lead mt-6 text-[color:var(--on-dark-muted)]">{post.excerpt}</p>
          <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[color:var(--on-dark-muted)]">
            <time dateTime={post.createdAt.toISOString()}>{post.createdAt.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</time>
            <span className="inline-flex items-center gap-1.5"><Clock size={14} aria-hidden />{post.readTime} min read</span>
          </p>
        </div>
      </header>

      {post.coverImage && (
        <div className="surface-light"><div className="container-wide -mt-8 md:-mt-14"><div className="relative aspect-[16/8] overflow-hidden rounded-[var(--radius)] bg-[color:var(--paper-2)]"><RemoteImage src={post.coverImage} alt="" priority sizes="(min-width: 1400px) 1400px, 100vw" /></div></div></div>
      )}

      <div className="surface-light section !pt-14">
        <div className="container-read">
          {/* Content is authored by signed-in admins in the TipTap editor. */}
          <div className="prose-site" dangerouslySetInnerHTML={{ __html: post.content }} />
          {post.tags?.length > 0 && (
            <div className="mt-14 border-t border-[color:var(--line-light)] pt-8">
              <p className="eyebrow mb-4">Topics</p>
              <ul className="flex flex-wrap gap-2">{post.tags.map((t) => <li key={t} className="chip">{t}</li>)}</ul>
            </div>
          )}
          <div className="mt-14"><ArrowButton href="/contact" variant="ink">Talk to us about this</ArrowButton></div>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </article>
  );
}
