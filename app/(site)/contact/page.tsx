import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import Intro from "@/components/motion/Intro";
import ContactForm from "@/components/sections/ContactForm";
import { getPublishedPackages, getPublishedServices } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Contact — Start a Conversation",
  description:
    "Tell us about your project. Ask a question, book a discovery conversation or request a proposal from Calstins Ltd in Abuja, Nigeria.",
  path: "/contact",
});

type Props = { searchParams: Promise<{ service?: string; package?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [services, packages, s] = await Promise.all([
    getPublishedServices(),
    getPublishedPackages(),
    getPublicSettings(),
  ]);

  // ?service=<slug> / ?package=<slug> (from service and pricing CTAs) pre-select the matching option.
  const svc = services.find((x) => x.slug === sp.service);
  const pkg = packages.find((x) => x.slug === sp.package);
  const options = [
    ...services.map((x) => x.title),
    ...packages.map((p) => `Package: ${p.name}`),
  ];
  const initial = pkg ? `Package: ${pkg.name}` : (svc?.title ?? "");

  const waDigits = s.whatsapp?.replace(/[^\d]/g, "");
  const place = [s.addressLine, s.city, s.country].filter(Boolean).join(", ");

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-16 pt-20 md:pb-24 md:pt-28">
          <p data-anim className="eyebrow mb-8">
            Contact
          </p>
          <h1 data-anim data-split className="t-h1">
            {s.contactCtaTitle || "Start a conversation."}
          </h1>
          <p
            data-anim
            className="t-lead mt-8 text-[color:var(--on-dark-muted)]"
          >
            {s.contactCtaBody ||
              "Ask a question, book a discovery conversation or request a proposal. Tell us about your project and we will take it from there."}
          </p>
        </Intro>
      </section>

      <section className="surface-light section">
        <div className="container-wide grid gap-14 lg:grid-cols-[1.5fr_1fr]">
          <div className="panel">
            <h2 className="t-h3 mb-8">Tell us about your project</h2>
            <ContactForm serviceOptions={options} initialService={initial} />
          </div>

          <aside className="space-y-8" aria-label="Contact details">
            <div>
              <h2 className="t-h3 mb-5">Get in touch</h2>
              <ul className="space-y-4">
                <li>
                  <a
                    className="inline-flex items-center gap-3 font-medium underline-offset-4 hover:underline"
                    href={`mailto:${s.publicEmail}`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--ink)] text-leaf">
                      <Mail size={18} aria-hidden />
                    </span>
                    {s.publicEmail}
                  </a>
                </li>
                {s.phone && (
                  <li>
                    <a
                      className="inline-flex items-center gap-3 font-medium underline-offset-4 hover:underline"
                      href={`tel:${s.phone.replace(/\s/g, "")}`}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--ink)] text-leaf">
                        <Phone size={18} aria-hidden />
                      </span>
                      {s.phone}
                    </a>
                  </li>
                )}
                {waDigits && (
                  <li>
                    <a
                      className="inline-flex items-center gap-3 font-medium underline-offset-4 hover:underline"
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span
                        className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--ink)] text-sm font-bold text-leaf"
                        aria-hidden
                      >
                        WA
                      </span>
                      Message on WhatsApp
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                )}
                {place && (
                  <li className="inline-flex items-center gap-3 font-medium">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--ink)] text-leaf">
                      <MapPin size={18} aria-hidden />
                    </span>
                    {place}
                  </li>
                )}
              </ul>
              {s.registrationNumber && (
                <p className="muted mt-6 text-sm">
                  {s.legalName || s.companyName} · Registration number{" "}
                  {s.registrationNumber}
                </p>
              )}
            </div>

            <div className="panel surface-dark on-dark !border-transparent">
              <h2 className="t-h3 text-ink">What to expect</h2>
              <ul className="mt-5 space-y-3 text-[0.95rem]">
                {s.contactPromises.map((i) => (
                  <li key={i} className=" text-ink flex gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-ink"
                      aria-hidden
                    />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
 