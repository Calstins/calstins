/**
 * Additive, idempotent seed for the Start / Build / Grow catalogue, story and site settings.
 *
 *  - Packages and prices follow the structure and figures of the Qrafteq template the owner chose to use
 *    (Start from N35,000 to N85,000, Build from N250,000, Grow from N300,000). They are ordinary database rows: edit
 *    or unpublish them in Admin > Packages & pricing. Qrafteq's own promises ("government fees included",
 *    "no hidden charges", "no lock-in") are deliberately NOT copied, because Calstins has not made those commitments.
 *  - Existing rows are never overwritten. The only things changed on an existing database are UNEDITED placeholders
 *    created by the earlier version of this seed (draft packages, "DRAFT." FAQs), which are replaced.
 *  - Phone, WhatsApp and social links are PLACEHOLDERS and stay hidden until "Show phone, WhatsApp and social links"
 *    is switched on in Admin > Company & story.
 *  - Story milestones are drawn from client work the owner has described. No dates, metrics or outcomes are claimed.
 *
 * Run:  npm run seed:catalog
 */
import "./load-env";
import { PrismaClient, type ServiceStage } from "@prisma/client";

const prisma = new PrismaClient();

type Svc = { title: string; slug: string; stage: ServiceStage; icon: string; tagline: string; description: string; scope: string[] };

const UNPUBLISHED = new Set(["analytics-reporting"]); // everything else maps to the template's Start / Build / Grow offer

const services: Svc[] = [
  { title: "Business name registration", slug: "business-name-registration", stage: "START", icon: "FileText",
    tagline: "A properly registered name for a sole proprietor or partnership.",
    description: "Guidance through name availability, documentation and filing so your business is registered correctly from the first day.",
    scope: ["Name availability check", "Document checklist and preparation", "Filing support", "Handover of registration documents"] },
  { title: "Limited company registration", slug: "limited-company-registration", stage: "START", icon: "Building2",
    tagline: "Incorporate a private limited company with the paperwork in order.",
    description: "Support through the incorporation process, from name reservation to the documents you need to operate.",
    scope: ["Name reservation support", "Incorporation document preparation", "Filing support", "Post-incorporation checklist"] },
  { title: "NGO and incorporated trustees registration", slug: "ngo-registration", stage: "START", icon: "Handshake",
    tagline: "Register a non-profit with a clear governance foundation.",
    description: "Help structuring and filing the application for an incorporated trustees body.",
    scope: ["Trustee and constitution guidance", "Application document preparation", "Filing support"] },
  { title: "Post-incorporation setup and compliance", slug: "post-incorporation-compliance", stage: "START", icon: "ShieldCheck",
    tagline: "The set-up steps that come after you are registered.",
    description: "Practical guidance on TIN and tax registration, VAT advisory and getting your bank account documents ready.",
    scope: ["TIN and tax registration guidance", "VAT registration advisory", "Bank account documentation pack"] },
  { title: "Annual returns and compliance support", slug: "annual-returns-compliance", stage: "START", icon: "Compass",
    tagline: "Stay in good standing after your first year.",
    description: "A compliance calendar and help preparing the annual filings a registered business is expected to make.",
    scope: ["First-year compliance calendar", "Annual returns preparation support", "Filing reminders"] },
  { title: "Brand identity and business profile", slug: "brand-identity-business-profile", stage: "BUILD", icon: "Palette",
    tagline: "A clear identity and a profile that explains what you do.",
    description: "Logo direction, colours, typography and a written business profile you can send to customers and partners.",
    scope: ["Identity direction", "Colour and type system", "Business profile document"] },
  { title: "Business website", slug: "business-website", stage: "BUILD", icon: "Globe",
    tagline: "A fast, credible website you can edit yourself.",
    description: "Design and build of a business website with a content system, basic SEO and analytics set up.",
    scope: ["Responsive design", "Content management", "Basic SEO set-up", "Analytics set-up"] },
  { title: "E-commerce store", slug: "e-commerce-store", stage: "BUILD", icon: "ShoppingCart",
    tagline: "Sell online with local payment methods.",
    description: "An online store with product management, checkout and payment integration.",
    scope: ["Product catalogue", "Checkout and payments", "Order management"] },
  { title: "Business email and domain setup", slug: "business-email-domain", stage: "BUILD", icon: "Mail",
    tagline: "A professional address on your own domain.",
    description: "Domain, DNS and business email configured and documented.",
    scope: ["Domain and DNS set-up", "Business mailboxes", "Deliverability basics"] },
  { title: "Basic SEO foundation", slug: "seo-foundation", stage: "BUILD", icon: "Search",
    tagline: "Make sure search engines can find and understand your new site.",
    description: "The technical and on-page basics set up at launch: titles, descriptions, sitemap, speed checks and local search listing guidance.",
    scope: ["Page titles and descriptions", "Sitemap and indexing set-up", "Performance and mobile checks", "Google Business Profile guidance"] },
  { title: "SEO and content", slug: "seo-content", stage: "GROW", icon: "Search",
    tagline: "Get found by the people already looking for you.",
    description: "Keyword research, on-page improvements and a content plan tied to what your customers search for.",
    scope: ["Keyword research", "On-page improvements", "Content plan"] },
  { title: "Paid media management", slug: "paid-media-management", stage: "GROW", icon: "Megaphone",
    tagline: "Advertising managed against a clear target.",
    description: "Campaign set-up, management and reporting on the channels that suit your customers.",
    scope: ["Campaign set-up", "Ongoing optimisation", "Monthly reporting"] },
  { title: "Email marketing and automation", slug: "email-marketing-automation", stage: "GROW", icon: "Mail",
    tagline: "Keep in touch with customers without doing it by hand.",
    description: "Email lists, campaigns and automated follow-up sequences that bring customers back.",
    scope: ["List and sign-up set-up", "Campaign templates", "Automated follow-up sequences", "Performance reporting"] },
  { title: "Conversion and lead-generation funnels", slug: "conversion-funnels", stage: "GROW", icon: "Filter",
    tagline: "Turn visits into enquiries and sales.",
    description: "Landing pages, forms and follow-up flows measured against conversion goals.",
    scope: ["Landing page design", "Form and follow-up flows", "Conversion tracking"] },
  { title: "Analytics and reporting", slug: "analytics-reporting", stage: "GROW", icon: "LineChart",
    tagline: "See what is working before you spend more.",
    description: "Tracking set up properly and reported in a form you can act on.",
    scope: ["Tracking plan", "Dashboard set-up", "Regular review"] },
];

type Pkg = { name: string; slug: string; stage: ServiceStage; audience: string; summary: string; priceType: "RANGE" | "STARTING_AT" | "CUSTOM_QUOTE"; service?: string; priceMin?: number; priceMax?: number; priceAmount?: number; billingPeriod: "ONE_OFF" | "MONTHLY"; deliveryTimeline?: string; features: string[]; exclusions: string[]; notes: string; featured: boolean; ctaLabel: string };

const packages: Pkg[] = [
  { name: "Start", slug: "start", stage: "START", audience: "New and unregistered businesses", featured: true,
    summary: "Get registered properly and finish the practical set-up steps, from structure advice to your first-year compliance calendar.",
    priceType: "RANGE", priceMin: 35000, priceMax: 85000, billingPeriod: "ONE_OFF", deliveryTimeline: "7 to 14 days",
    features: ["Business structure advice and entity selection", "Name availability search and CAC reservation", "MEMART drafting and document preparation", "Full CAC registration (Business Name or limited company)", "TIN and tax registration guidance", "VAT registration advisory", "Bank account documentation pack", "First-year compliance calendar"],
    exclusions: [], notes: "Business name registration starts from ₦35,000 and limited company registration from ₦85,000. Your written proposal confirms the final price and what it covers.", ctaLabel: "Start my registration" },
  { name: "Build", slug: "build", stage: "BUILD", audience: "Registered businesses going online", featured: false,
    summary: "A brand, a website and a professional email address, built together so everything matches.",
    priceType: "STARTING_AT", priceAmount: 250000, billingPeriod: "ONE_OFF", deliveryTimeline: "4 to 6 weeks",
    features: ["Logo and brand identity system", "Professional website (5 to 7 pages)", "E-commerce store, if you need one", "Business email on your own domain", "SEO foundation and on-page set-up"],
    exclusions: [], notes: "Starting price. Scope, domain and hosting details are confirmed in your written proposal.", ctaLabel: "Plan my build" },
  { name: "Grow", slug: "grow", stage: "GROW", audience: "Businesses with a working website", featured: false,
    summary: "Ongoing work to bring in more customers: search, advertising, email and lead funnels, with monthly reporting.",
    priceType: "STARTING_AT", priceAmount: 300000, billingPeriod: "MONTHLY", deliveryTimeline: "Ongoing, scope agreed on a call",
    features: ["Google Ads management", "Facebook and Instagram campaigns", "SEO and content strategy", "Email marketing and automation", "Lead-generation funnels", "Monthly reporting"],
    exclusions: ["Advertising spend paid to the platforms"], notes: "Starting price. The scope and monthly figure are agreed with you before work begins.", ctaLabel: "Talk about growth" },
  // One-off services, linked to the matching service by slug
  { name: "Business name registration", slug: "business-name-registration-package", stage: "START", audience: "Sole proprietors and partnerships", featured: false, service: "business-name-registration",
    summary: "Register a business name with the filing handled for you.",
    priceType: "STARTING_AT", priceAmount: 35000, billingPeriod: "ONE_OFF", deliveryTimeline: "7 to 14 days", features: ["Name availability search", "Document preparation", "CAC filing support", "Registration documents handed over"],
    exclusions: [], notes: "Starting price. Your written proposal confirms the final amount and what it covers.", ctaLabel: "Register a business name" },
  { name: "Limited company registration", slug: "limited-company-registration-package", stage: "START", audience: "Founders forming a private company", featured: false, service: "limited-company-registration",
    summary: "Incorporate a private limited company with the paperwork in order.",
    priceType: "STARTING_AT", priceAmount: 85000, billingPeriod: "ONE_OFF", deliveryTimeline: "10 to 14 days", features: ["Name reservation", "MEMART drafting", "CAC incorporation filing", "Post-incorporation checklist"],
    exclusions: [], notes: "Starting price. Your written proposal confirms the final amount and what it covers.", ctaLabel: "Register a company" },
  { name: "NGO registration", slug: "ngo-registration-package", stage: "START", audience: "Non-profits and community groups", featured: false, service: "ngo-registration",
    summary: "Register an incorporated trustees body with a clear governance foundation.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Trustee and constitution guidance", "Application preparation", "Filing support"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Ask about NGO registration" },
  { name: "Brand identity", slug: "brand-identity-package", stage: "BUILD", audience: "Businesses that need a clear identity", featured: false, service: "brand-identity-business-profile",
    summary: "Logo direction, colours, type and a business profile.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Identity direction", "Colour and type system", "Business profile document"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Request a quote" },
  { name: "Website and e-commerce", slug: "website-ecommerce-package", stage: "BUILD", audience: "Businesses going online", featured: false, service: "business-website",
    summary: "A business website or online store built to your scope.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Responsive design", "Content management", "Payments for online stores", "Analytics set-up"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Request a quote" },
  { name: "SEO foundation", slug: "seo-foundation-package", stage: "BUILD", audience: "New and relaunched websites", featured: false, service: "seo-foundation",
    summary: "The search basics set up properly at launch.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Titles and descriptions", "Sitemap and indexing", "Performance checks"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Request a quote" },
  { name: "SEO and content strategy", slug: "seo-content-package", stage: "GROW", audience: "Businesses ready to be found", featured: false, service: "seo-content",
    summary: "Keyword research, on-page work and a content plan.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Keyword research", "On-page improvements", "Content plan"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Request a quote" },
  { name: "Paid media management", slug: "paid-media-package", stage: "GROW", audience: "Businesses ready to advertise", featured: false, service: "paid-media-management",
    summary: "Campaigns managed against a target, with monthly reporting.",
    priceType: "CUSTOM_QUOTE", billingPeriod: "ONE_OFF", features: ["Campaign set-up", "Ongoing optimisation", "Monthly reporting"],
    exclusions: [], notes: "Priced after a short call about your needs. No figure is published until we have scoped the work.", ctaLabel: "Request a quote" },
];

const OLD_PLACEHOLDER_PACKAGES = ["get-established", "business-presence", "growth-support"];

const faqs = [
  { question: "How long does business registration take?", answer: "Our Start package is planned for 7 to 14 days from the point we have your documents and details. Timelines depend on how quickly the registry processes your application, so we confirm the expected date in your proposal." },
  { question: "What does registration cost?", answer: "Business name registration starts from ₦35,000 and limited company registration from ₦85,000. We confirm the exact amount, and what it covers, in writing before you pay." },
  { question: "Can you handle my brand and website together with registration?", answer: "Yes. Registration, brand identity and website are designed to work together, so your business name, domain and registered details line up from the start. You can also book each one separately." },
  { question: "Do I need a physical address to register?", answer: "A registered business address in Nigeria is required. If you work from home or remotely, we will talk through the options that are compliant for your situation." },
  { question: "What happens if I miss my annual filings?", answer: "Late filings can attract penalties and affect your standing with the registry. Our Start package includes a first-year compliance calendar so you know what is due and when." },
  { question: "How does the free consultation work?", answer: "It is a 30-minute conversation by phone, WhatsApp or video. We look at where your business is today and suggest what to do first. There is no obligation to hire us." },
];

const STORY = {
  storyHeadline: "Shaped by the products we have shipped.",
  storyBody: "Calstins is a software and IT advisory agency in Abuja, Nigeria, led by founder Caleb Opule.\n\nOur story is best told through the platforms we have planned and built: online shops, logistics systems, event and hospitality software, and point-of-sale tools for Nigerian and international businesses.\n\nBelow is a selection of that work. It is the same approach we bring to registration, branding, websites and growth: understand the business first, then build what it actually needs.",
  milestones: [
    { label: "E-commerce", title: "A multi-country coffee platform", body: "An online coffee business serving Nigeria, Togo, Benin and Italy, with country-based admin roles, local and international payment gateways, and English, French and Italian content." },
    { label: "Events", title: "Ticketing, seating and voting", body: "An event platform for ticket sales with guest checkout, invite-only events with seating arrangements, voting contests and ticket scanning at the door." },
    { label: "Youth and mobile", title: "A challenges app for teenagers", body: "A React Native mobile app with a Next.js admin: task submissions, badges, community leaderboards and push notifications." },
    { label: "Logistics", title: "A Nigerian delivery and shipping platform", body: "Zone-based pricing, a shipment state machine, a dispatcher dashboard, claims, support tickets and loyalty rewards." },
    { label: "Retail", title: "Point of sale and online grocery", body: "A grocery POS and storefront with barcode weighing-scale integration, safe stock deduction and role-based access, later extended into a multi-tenant POS platform." },
    { label: "Hospitality", title: "Hotel software and multi-branch sites", body: "Multi-tenant hotel management software, and a multi-branch hotel website with bookings, per-branch content and payments." },
  ],
};

const PLACEHOLDER_CONTACT = {
  phone: "+234 800 000 0000",
  whatsapp: "+234 800 000 0000",
  linkedin: "https://www.linkedin.com/in/caleb-opule",
  github: "https://github.com/Calstins",
  twitter: "https://x.com/your-handle",
  instagram: "https://instagram.com/your-handle",
  facebook: "https://facebook.com/your-page",
};

// Case studies for Calstins' own SaaS products. Descriptive only: no metrics, customer counts or outcomes are claimed.
// Edit or replace them under Admin > Projects once you have real results to report.
const CASE_STUDIES = [
  { title: "Ayohotel", slug: "ayohotel", client: "Calstins (own product)", category: "Hospitality SaaS",
    description: "A multi-tenant platform that lets hotels run bookings, rooms, staff and their own website from one place.",
    longDesc: "Calstins identified a gap between what independent hotels need and what they can afford to run, then planned and built Ayohotel as a product: tenant and subscription plans, a content system for each hotel's public site, role-based staff access and platform administration. Notification credentials are managed centrally by the platform team, while each hotel owner configures only their own payment gateways, so the platform never holds a tenant's money.",
    outcome: "Delivered end to end by Calstins, from product definition to a running multi-tenant platform with plans, tenants and a CMS.",
    tags: ["Product Strategy", "Product Delivery", "Multi-tenant Platform", "Ongoing Partnership"], featured: true, order: 11 },
  { title: "AYOPOS", slug: "ayopos", client: "Calstins (own product)", category: "Retail SaaS",
    description: "A point-of-sale platform for grocery stores, supermarkets, pharmacies and electronics shops, covering inventory, accounting, HR and procurement.",
    longDesc: "AYOPOS applies the same product thinking as Ayohotel to retail: one platform for sales, stock, purchasing, accounts and staff, with roles such as storekeeper and cashier, subscription plans chosen at signup, and a website-sync feature that links a client's online store to their stock. It was planned and built in phases by Calstins.",
    outcome: "Built in phases by Calstins as a multi-tenant product, with plan-based features and a website and store sync for connected clients.",
    tags: ["Product Strategy", "Product Delivery", "Multi-tenant Platform", "Ongoing Partnership"], featured: true, order: 12 },
];

const untouched = (r: { createdAt: Date; updatedAt: Date }) => Math.abs(r.updatedAt.getTime() - r.createdAt.getTime()) < 2000;

async function main() {
  const log = { created: 0, published: 0, replaced: 0, skipped: 0 };
  let n = await prisma.service.count();

  for (const s of services) {
    const want = !UNPUBLISHED.has(s.slug);
    const existing = await prisma.service.findUnique({ where: { slug: s.slug }, select: { id: true, published: true, createdAt: true, updatedAt: true } });
    if (existing) {
      // Publish candidates created by the earlier version of this seed, but only if nobody has edited them.
      if (want && existing.published === false && untouched(existing)) { await prisma.service.update({ where: { id: existing.id }, data: { published: true } }); log.published++; }
      else log.skipped++;
      continue;
    }
    n += 1;
    await prisma.service.create({ data: { ...s, areaNumber: String(n).padStart(2, "0"), order: 100 + n, published: want, featured: false } });
    log.created++;
  }

  for (const c of CASE_STUDIES) {
    if (await prisma.project.findUnique({ where: { slug: c.slug }, select: { id: true } })) { log.skipped++; continue; }
    await prisma.project.create({ data: { ...c, partnership: false } });
    log.created++;
  }

  for (const slug of OLD_PLACEHOLDER_PACKAGES) {
    const old = await prisma.servicePackage.findUnique({ where: { slug }, select: { id: true, published: true, priceType: true, summary: true } });
    if (old && old.published === false && old.priceType === "CUSTOM_QUOTE" && old.summary.includes("(Draft: confirm scope")) { await prisma.servicePackage.delete({ where: { id: old.id } }); log.replaced++; }
  }
  for (const [i, p] of packages.entries()) {
    if (await prisma.servicePackage.findUnique({ where: { slug: p.slug }, select: { id: true } })) { log.skipped++; continue; }
    const { service: svcSlug, ...data } = p;
    const linked = svcSlug ? await prisma.service.findUnique({ where: { slug: svcSlug }, select: { id: true } }) : null;
    await prisma.servicePackage.create({ data: { ...data, serviceId: linked?.id, currency: "NGN", order: i, published: true } });
    log.created++;
  }

  for (const f of await prisma.faq.findMany()) {
    if (f.answer.startsWith("DRAFT.")) { await prisma.faq.delete({ where: { id: f.id } }); log.replaced++; }
  }
  const have = new Set((await prisma.faq.findMany()).map((f) => f.question));
  let order = await prisma.faq.count();
  for (const f of faqs) {
    if (have.has(f.question)) { log.skipped++; continue; }
    await prisma.faq.create({ data: { ...f, order: order++, published: true } });
    log.created++;
  }

  const row = await prisma.companySettings.findUnique({ where: { key: "company" } });
  if (!row) {
    // No registration number: it is never invented. Enter and verify it in Admin > Company & story.
    await prisma.companySettings.create({
      data: { key: "company", companyName: "Calstins Ltd", publicEmail: "info@calstins.com", city: "Abuja", country: "Nigeria", ...PLACEHOLDER_CONTACT, showContactDetails: false, ...STORY, storyPublished: true, contactPromises: ["Response within 24 hours", "Free 30-min consultation", "Transparent project scoping", "Fixed-price or milestone billing"] },
    });
    log.created++;
  } else {
    // Fill only what is still empty; never overwrite anything the owner has entered.
    const fill: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(PLACEHOLDER_CONTACT)) if (!(row as Record<string, unknown>)[k]) fill[k] = v;
    if (row.showContactDetails == null) fill.showContactDetails = false;
    if (!row.storyBody && !row.storyHeadline && (row.milestones?.length ?? 0) === 0) Object.assign(fill, STORY, { storyPublished: true });
    if (!row.contactPromises?.length) fill.contactPromises = ["Response within 24 hours", "Free 30-min consultation", "Transparent project scoping", "Fixed-price or milestone billing"];
    if (Object.keys(fill).length) { await prisma.companySettings.update({ where: { key: "company" }, data: fill }); log.published++; } else log.skipped++;
  }

  console.log(`Catalogue seed finished: ${log.created} created, ${log.published} published/filled, ${log.replaced} placeholders replaced, ${log.skipped} left untouched.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
