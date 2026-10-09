import Image from "next/image";
import logo from "@/app/assets/calstins-logo.png";

/**
 * The supplied logo, unaltered. The PNG is an opaque image on flat navy (#172532) with a lot of empty
 * padding, so the component only CROPS the dead space with object-position (no filters, blending or
 * opacity) and must be placed on a navy surface (`bg-ink`) so its background matches exactly.
 * Visible window: source rows 850-2200 of 3000, full width.
 */
export default function Logo({ className = "", priority = false, sizes = "(min-width: 768px) 220px, 180px" }: { className?: string; priority?: boolean; sizes?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-ink ${className}`} style={{ aspectRatio: "5357 / 1350" }}>
      <Image
        src={logo}
        alt="Calstins Ltd"
        fill
        priority={priority}
        sizes={sizes}
        placeholder="empty"
        className="object-cover"
        style={{ objectPosition: "50% 51.6%" }}
      />
    </span>
  );
}
