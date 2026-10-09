import { notFound } from "next/navigation";

// Any URL that matches no other route lands here so the 404 renders INSIDE the site layout (header, footer, fonts).
export const dynamic = "force-dynamic";
export default function CatchAll() {
  notFound();
}
