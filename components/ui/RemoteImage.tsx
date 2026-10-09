import Image from "next/image";

// Mirrors images.remotePatterns in next.config.js. next/image THROWS for any other host, which would take down
// the whole page if an admin pasted an arbitrary URL, so unknown hosts fall back to a plain lazy <img>.
const ALLOWED = [/^res\.cloudinary\.com$/, /^images\.unsplash\.com$/, /^source\.unsplash\.com$/, /(^|\.)cloudinary\.com$/];

function allowed(src: string) {
  if (src.startsWith("/")) return true;
  try { return ALLOWED.some((re) => re.test(new URL(src).hostname)); } catch { return false; }
}

export default function RemoteImage({ src, alt, className = "", sizes = "(min-width: 1024px) 50vw, 100vw", priority = false }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (allowed(src)) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={`absolute inset-0 h-full w-full object-cover ${className}`} />;
}
