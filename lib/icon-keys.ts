// Allowlist of icon identifiers an admin can pick for a service. Only these
// strings are ever mapped to components (see components/ui/ServiceIcon.tsx);
// arbitrary component names from the database are never rendered.
export const ICON_KEYS = [
  "Compass", "Network", "Code2", "Handshake", "Building2", "FileText", "ShieldCheck",
  "Palette", "Globe", "ShoppingCart", "Mail", "Search", "Megaphone", "LineChart",
  "Filter", "Workflow", "Smartphone", "Server", "Rocket", "Lightbulb",
] as const;
export type IconKey = (typeof ICON_KEYS)[number];
export function isIconKey(v: unknown): v is IconKey {
  return typeof v === "string" && (ICON_KEYS as readonly string[]).includes(v);
}
