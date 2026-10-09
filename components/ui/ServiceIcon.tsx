import { Building2, Code2, Compass, FileText, Filter, Globe, Handshake, LineChart, Lightbulb, Mail, Megaphone, Network, Palette, Rocket, Search, Server, ShieldCheck, ShoppingCart, Smartphone, Workflow, type LucideIcon } from "lucide-react";
import { isIconKey, type IconKey } from "@/lib/icon-keys";

// Only keys present in this map can ever render. Anything else from the database falls back to Compass.
const MAP: Record<IconKey, LucideIcon> = {
  Compass, Network, Code2, Handshake, Building2, FileText, ShieldCheck, Palette, Globe, ShoppingCart, Mail, Search, Megaphone, LineChart, Filter, Workflow, Smartphone, Server, Rocket, Lightbulb,
};

export default function ServiceIcon({ name, size = 22, className }: { name?: string | null; size?: number; className?: string }) {
  const Icon = isIconKey(name) ? MAP[name] : Compass;
  return <Icon size={size} className={className} aria-hidden="true" strokeWidth={1.75} />;
}
