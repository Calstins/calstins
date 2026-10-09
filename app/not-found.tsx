import Link from "next/link";
import Logo from "@/components/brand/Logo";

// Last-resort 404 (only reached outside the site layout). Dependency-light on purpose.
export default function GlobalNotFound() {
  return (
    <main className="surface-dark grid min-h-screen place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-10 w-48"><Logo className="w-full" /></div>
        <p className="eyebrow mb-6">Error 404</p>
        <h1 className="t-h1">Page not found</h1>
        <p className="mt-6 text-[color:var(--on-dark-muted)]">The page you were looking for is not here.</p>
        <Link href="/" className="btn btn-leaf mt-10">Back to home</Link>
      </div>
    </main>
  );
}
