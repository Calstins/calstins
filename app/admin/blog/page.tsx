"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reloadKey, setReloadKey] = useState(0);
  const fetchPosts = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let alive = true;
    fetch("/api/blog?admin=true&limit=100")
      .then((r) => r.json())
      .then((data) => { if (alive) { setPosts(data.posts || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [reloadKey]);

  const deletePost = async (slug: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    fetchPosts();
  };

  const togglePublish = async (post: any) => {
    await fetch(`/api/blog/${post.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-700 text-snow text-2xl">Blog Posts</h1>
          <p className="text-mist text-sm mt-1">{posts.length} posts total</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary text-sm py-2.5">
          <Plus size={14} /> New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-mist text-sm">Loading...</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.slug}
              className="card-base flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                    post.published
                      ? "text-electric border-electric/20 bg-electric/5"
                      : "text-mist/50 border-ink-border"
                  }`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs font-mono text-volt/60 border border-volt/20 px-2 py-0.5 rounded-sm">
                    {post.category}
                  </span>
                </div>
                <h3 className="font-display font-600 text-snow truncate">{post.title}</h3>
                <p className="text-mist/50 text-xs mt-0.5 font-mono">
                  {post.views} views · {new Date(post.createdAt).toLocaleDateString()}
                  {post.focusKeyword && ` · KW: ${post.focusKeyword}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => togglePublish(post)}
                  className="p-2 text-mist hover:text-electric transition-colors"
                  title={post.published ? "Unpublish" : "Publish"}
                >
                  {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <Link
                  href={`/admin/blog/${post.slug}/edit`}
                  className="p-2 text-mist hover:text-electric transition-colors"
                >
                  <Edit size={14} />
                </Link>
                <button
                  onClick={() => deletePost(post.slug)}
                  className="p-2 text-mist hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-16 text-mist">
              <p className="mb-4">No posts yet.</p>
              <Link href="/admin/blog/new" className="btn-primary text-sm">
                Write your first post
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
