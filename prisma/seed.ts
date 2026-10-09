import "./load-env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();
const sl = (t: string) => slugify(t, { lower: true, strict: true });

const DESTRUCTIVE = process.env.ALLOW_DESTRUCTIVE_SEED === "true";

/**
 * Adds any engagement mode, service, project, client, testimonial or post that is MISSING (matched by slug/title/name).
 * Existing rows are never changed, so it is safe on a live database and safe to re-run.
 * ALLOW_DESTRUCTIVE_SEED=true wipes and recreates those collections (disposable databases only).
 */
/* Adds each row only if no row with the same key exists, so re-running never duplicates or overwrites edits. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fillMissing(model: any, key: string, rows: Record<string, any>[]) {
  for (const r of rows) {
    if (await model.findFirst({ where: { [key]: r[key] } })) continue;
    await model.create({ data: r });
  }
}

async function main() {
  console.log(DESTRUCTIVE ? "WARNING: destructive seed, existing content will be replaced.\n" : "Seeding Calstins content (adds anything missing, never overwrites)...\n");

  // ── Admin ────────────────────────────────────────────────────────────────────
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@calstins.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (adminPassword.length >= 10) {
    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {},
      create: { email: adminEmail, password: await bcrypt.hash(adminPassword, 12), name: "Caleb Opule" },
    });
    console.log("Admin ready:", adminEmail);
  } else {
    console.log("Admin skipped: set ADMIN_PASSWORD (10+ characters) in .env, or run npm run admin:create.");
  }

  // ── Engagement Modes (home + services pages) ─────────────────────────────────
  if (DESTRUCTIVE) await prisma.engagementMode.deleteMany({});
  await fillMissing(prisma.engagementMode, "title", [
      {
        number: "01",
        title: "Discovery & Validation",
        description:
          "Business model validation, vendor selection, technical feasibility, MVP scoping. A complete picture before a line of code is written. Fixed scope, fixed price, defined output.",
        bullets: [
          "Market and regulatory assessment",
          "Architecture options and trade-off analysis",
          "Vendor landscape and selection shortlist",
          "Delivery blueprint and project framework",
        ],
        tag: "Fixed-scope engagement",
        order: 1,
      },
      {
        number: "02",
        title: "Full Advisory + Build",
        description:
          "Everything in Discovery, plus embedded advisory throughout the build — architecture decisions, vendor management, team building, and full delivery oversight to launch.",
        bullets: [
          "Everything in Discovery & Validation",
          "Embedded delivery oversight",
          "Vendor and engineering team management",
          "Quality checkpoints and sign-off",
        ],
        tag: "Project-based",
        order: 2,
      },
      {
        number: "03",
        title: "Ongoing Retainer",
        description:
          "Post-launch strategic and technical guidance. Roadmap ownership, IT management, vendor management — the partner that stays after everyone else leaves.",
        bullets: [
          "Fractional CTO and roadmap ownership",
          "Quarterly strategy reviews",
          "Vendor performance and renewal management",
          "On-call decision support",
        ],
        tag: "Essential · Growth · Strategic tiers",
        order: 3,
      },
  ]);
  console.log("✅ Engagement modes");

  // ── Services (with sub-items — exactly matching services/page.tsx content) ───
  if (DESTRUCTIVE) { await prisma.serviceSubItem.deleteMany({}); await prisma.service.deleteMany({}); }
  {

  const servicesData = [
    {
      areaNumber: "01",
      title: "Technology Strategy",
      slug: "technology-strategy",
      tagline:
        "Before a decision is made, before a vendor is engaged, before any work begins — we build the map.",
      description:
        "Strategic clarity is the most valuable asset any technology programme can have. Every architecture decision exists to serve a business objective. We align your technical roadmap with commercial intent, not engineering preference. The business model drives the build, not the other way around.",
      order: 1,
      featured: true,
      subItems: [
        {
          heading: "Discovery & Validation",
          description:
            "Business model validation, market feasibility, and commercial viability assessment before any technical commitment.",
          bullets: [
            "Market and competitor analysis",
            "Revenue model and unit economics review",
            "Go-to-market readiness assessment",
          ],
          order: 1,
        },
        {
          heading: "Technical Feasibility",
          description:
            "Honest assessment of what is technically possible within your constraints — timeline, budget, and team.",
          bullets: [
            "Architecture options and trade-offs",
            "Build vs buy vs integrate analysis",
            "Constraint and risk identification",
          ],
          order: 2,
        },
        {
          heading: "Digital Transformation",
          description:
            "Roadmapping and programme management for organisations transitioning from legacy systems to modern platforms.",
          bullets: [
            "Legacy system assessment",
            "Phased migration planning",
            "Vendor and partner evaluation",
          ],
          order: 3,
        },
        {
          heading: "Technical Due Diligence",
          description:
            "Independent review of technology assets for investment decisions, acquisitions, or post-incident assessments.",
          bullets: [
            "Codebase and architecture review",
            "Scalability and security assessment",
            "Team and process evaluation",
          ],
          order: 4,
        },
      ],
    },
    {
      areaNumber: "02",
      title: "IT Consulting & Networking",
      slug: "it-consulting-networking",
      tagline:
        "Infrastructure is not a back-office concern. It is the foundation on which every business process runs.",
      description:
        "We design, implement, and manage IT environments that perform reliably at Nigerian scale. From network architecture for a growing enterprise to IT policy frameworks for public institutions — designed for the complexity of the Nigerian operating environment, not a simplified version of it.",
      order: 2,
      featured: true,
      subItems: [
        {
          heading: "IT Infrastructure Assessment",
          description:
            "A clear picture of your current state — what works, what doesn't, and what the business risk is of leaving it unchanged.",
          bullets: [
            "Infrastructure audit and gap analysis",
            "Security posture assessment",
            "Cost optimisation review",
          ],
          order: 1,
        },
        {
          heading: "Network Design & Implementation",
          description:
            "End-to-end network architecture for offices, data centres, and distributed operations across Nigerian locations.",
          bullets: [
            "LAN, WAN, and wireless design",
            "Network monitoring and management",
            "Redundancy and failover planning",
          ],
          order: 2,
        },
        {
          heading: "Systems Integration",
          description:
            "Connecting disparate systems, platforms, and data sources into a coherent operational environment.",
          bullets: [
            "ERP and CRM integration",
            "API and data pipeline design",
            "Legacy system connectivity",
          ],
          order: 3,
        },
        {
          heading: "IT Governance",
          description:
            "Policies, processes, and controls that keep your technology environment auditable, compliant, and well-managed.",
          bullets: [
            "IT policy framework development",
            "Vendor and contract governance",
            "IT service management (ITSM)",
          ],
          order: 4,
        },
      ],
    },
    {
      areaNumber: "03",
      title: "Product & Software Delivery",
      slug: "product-software-delivery",
      tagline:
        "Advisory that stays through build. We don't hand off a strategy document and disappear.",
      description:
        "We're embedded in delivery, making the hard decisions alongside your team. We don't hand over a prototype and call it done. We ship production-grade systems that meet the rigorous demands of the organisations we serve — then we stay to see what happens next.",
      order: 3,
      featured: true,
      subItems: [
        {
          heading: "Architecture Design",
          description:
            "System design that accounts for your business environment, growth trajectory, and operational constraints from day one.",
          bullets: [
            "System and data architecture",
            "Infrastructure and cloud strategy",
            "Security and compliance by design",
          ],
          order: 1,
        },
        {
          heading: "Delivery Oversight",
          description:
            "Embedded programme management throughout the build — maintaining velocity, managing dependencies, resolving blockers.",
          bullets: [
            "Milestone and delivery management",
            "Vendor and third-party coordination",
            "Quality assurance and sign-off",
          ],
          order: 2,
        },
        {
          heading: "MVP Scoping",
          description:
            "Ruthless prioritisation of what actually needs to exist to validate the business thesis — not what would be nice.",
          bullets: [
            "Feature prioritisation and scope definition",
            "Launch readiness criteria",
            "Post-launch iteration roadmap",
          ],
          order: 3,
        },
        {
          heading: "Integrations & Payments",
          description:
            "Connecting your platform to the services your business depends on — payment gateways, third-party APIs, and government data systems.",
          bullets: [
            "Paystack, Stripe, and bank payment rails",
            "Government API and data integrations",
            "Third-party SaaS and vendor APIs",
          ],
          order: 4,
        },
      ],
    },
    {
      areaNumber: "04",
      title: "Long-term Partnership",
      slug: "long-term-partnership",
      tagline:
        "The most valuable thing Calstins offers isn't delivery. It's continuity.",
      description:
        "The most expensive mistake is finishing a build with no one left who understands what was built and why. The Calstins retainer is how we stay — and how you stay ahead. Institutional knowledge compounds over time. A firm that was there from day one thinks differently about your product than one that arrives after launch.",
      order: 4,
      featured: true,
      subItems: [
        {
          heading: "Fractional CTO",
          description:
            "Senior technology leadership on a retainer basis — owning the roadmap, advising the board, representing technology to external stakeholders.",
          bullets: [
            "Product and technology roadmap ownership",
            "Board and investor advisory support",
            "Hiring and team development guidance",
          ],
          order: 1,
        },
        {
          heading: "Ongoing IT Management",
          description:
            "Continuous management of your technology environment — infrastructure, vendors, and platform health.",
          bullets: [
            "Infrastructure monitoring and maintenance",
            "Security patching and compliance",
            "Incident response and support",
          ],
          order: 2,
        },
        {
          heading: "Vendor Management",
          description:
            "Ongoing management of your technology supply chain — renewals, performance reviews, renegotiations, and replacements.",
          bullets: [
            "Vendor performance monitoring",
            "Contract renewal and renegotiation",
            "Technology landscape scanning",
          ],
          order: 3,
        },
        {
          heading: "Platform Evolution",
          description:
            "Keeping your platform current — scaling architecture, managing technical debt, and planning the next phase of development.",
          bullets: [
            "Scalability and performance planning",
            "Technical debt management",
            "New feature and product scoping",
          ],
          order: 4,
        },
      ],
    },
  ];

  for (const svc of servicesData) {
    const { subItems, ...svcData } = svc;
    if (await prisma.service.findUnique({ where: { slug: svcData.slug } })) continue;
    const created = await prisma.service.create({ data: svcData });
    for (const sub of subItems) {
      await prisma.serviceSubItem.create({ data: { ...sub, serviceId: created.id } });
    }
  }
  }
  console.log("Services + sub-items checked");

  // ── Projects (exact content from work/page.tsx) ───────────────────────────────
  if (DESTRUCTIVE) await prisma.project.deleteMany({});
  await fillMissing(prisma.project, "slug", [
      {
        title: "i-coffee.ng",
        slug: "i-coffee-ng",
        client: "I-Coffee Nigeria",
        category: "E-Commerce & Digital Growth",
        description:
          "A Nigerian specialty coffee brand that needed a complete digital transformation — not just a website, but a full commercial strategy and the delivery infrastructure to support it.",
        longDesc:
          "Calstins engaged at the earliest stage: validating the business model, auditing the existing digital presence, designing a growth roadmap, and then building and delivering the platform. Post-launch, we transitioned to a retainer engagement managing the ongoing product roadmap and growth programme.",
        outcome:
          "Organic growth programme delivered measurable results within two quarters. The client requested a retainer post-launch.",
        url: "https://i-coffee.ng",
        tags: ["Business Model Validation", "Digital Strategy", "Product Delivery", "Ongoing Retainer"],
        featured: true,
        order: 1,
      },
      {
        title: "BowaGO",
        slug: "bowago",
        client: "BowaGO Logistics",
        category: "Logistics Platform",
        description:
          "A Nigerian logistics and shipment management platform requiring full architecture design, vendor selection, and production delivery — with complex zone-based pricing and multi-party payment logic.",
        longDesc:
          "Calstins led the architecture design, evaluated and selected infrastructure vendors, and managed full delivery through to production launch. The engagement included integration with Nigerian payment rails and a comprehensive management dashboard for operations teams.",
        outcome:
          "Platform delivered to production with full API documentation and a stable, scalable architecture for the next phase of growth.",
        url: "",
        tags: ["Architecture Design", "Vendor Selection", "Full Build", "Payments Infrastructure"],
        featured: true,
        order: 2,
      },
      {
        title: "TeenShapers Club",
        slug: "teenshapers-club",
        client: "TeenShapers",
        category: "Community & Mobile Platform",
        description:
          "A faith-based community platform for teenagers, requiring both a mobile application and web administration — with commerce, gamification, and content delivery at its core.",
        longDesc:
          "Calstins scoped the product, designed the architecture, and delivered end-to-end — mobile application for iOS and Android, web administration panel, backend API, and payment integration for in-app purchases. The engagement included ongoing product advisory post-launch.",
        outcome:
          "Platform live on iOS and Android with active user base. Post-launch advisory retainer in place.",
        url: "https://teenshapersclub.com",
        tags: ["Product Strategy", "Mobile Delivery", "Full Build", "Commerce Integration"],
        featured: true,
        order: 3,
      },
      {
        title: "myevent.com.ng",
        slug: "myevent-com-ng",
        client: "MyEvent",
        category: "Event & Ticketing Infrastructure",
        description:
          "One of Nigeria's largest digital event ticketing systems — requiring robust payment infrastructure, complex event management logic, and a platform architecture that could handle peak event loads.",
        longDesc:
          "Calstins designed the platform architecture, built the full delivery system, integrated payment infrastructure with webhook-based confirmation, and implemented three distinct ticket types including seating arrangement management.",
        outcome:
          "Platform live with 500+ event listings. Payment infrastructure handling peak loads without incident.",
        url: "https://myevent.com.ng",
        tags: ["Architecture Design", "Payments Infrastructure", "Full Build"],
        featured: true,
        order: 4,
      },
      {
        title: "EnergyWallet",
        slug: "energywallet",
        client: "EnergyWallet NG",
        category: "Fintech Infrastructure",
        description:
          "A digital finance application for energy credit management and wallet infrastructure, delivered in partnership with the client's leadership team.",
        longDesc:
          "Calstins provided architecture advisory and product delivery support for the EnergyWallet platform — a Nigerian fintech application requiring secure payment flows and multi-wallet management.",
        outcome: "Platform delivered and live with paying users.",
        url: "https://energywalletng.com",
        tags: ["Architecture Advisory", "Product Delivery", "Fintech"],
        featured: false,
        partnership: true,
        order: 5,
      },
      {
        title: "SwapFX",
        slug: "swapfx",
        client: "SwapFX",
        category: "SaaS Product",
        description:
          "A peer-to-peer currency exchange platform for the Nigerian market — requiring real-time order matching, escrow management, and a multi-platform presence across web and mobile.",
        longDesc:
          "Full backend and frontend delivery including order matching engine, real-time notifications, authentication and KYC-ready onboarding, and a mobile application.",
        outcome: "Platform delivered across web and mobile with active trading infrastructure.",
        url: "",
        tags: ["Architecture Design", "Full Build", "Real-time Infrastructure"],
        featured: false,
        order: 6,
      },
      {
        title: "Super Business Woman Global",
        slug: "super-business-woman-global",
        client: "SBW Global",
        category: "E-Commerce",
        description:
          "Full product delivery for a Nigerian e-commerce and events platform — commerce infrastructure, analytics dashboards, and content management.",
        longDesc:
          "Calstins delivered the full platform including storefront, checkout, admin dashboards, and content management — with Paystack payment integration and reporting infrastructure.",
        outcome: "Platform live and processing orders. Client managing independently post-launch.",
        url: "https://superbusinesswoman.com",
        tags: ["Product Delivery", "Commerce Infrastructure"],
        featured: false,
        partnership: true,
        order: 7,
      },
      {
        title: "Lamb Academy",
        slug: "lamb-academy",
        client: "Lamb Academy",
        category: "EdTech Platform",
        description:
          "Full LMS portal delivery — course management, student progress tracking, and payment integration for a Nigerian professional training institution.",
        longDesc:
          "Calstins scoped, designed, and delivered the full learning management system — including course delivery, assessment tools, progress tracking, and payment-gated enrolment.",
        outcome: "LMS live with active student cohorts. Ongoing platform management in place.",
        url: "https://portal.lambacademy.ng",
        tags: ["Platform Delivery", "EdTech", "LMS"],
        featured: false,
        partnership: true,
        order: 8,
      },
      {
        title: "Black Suit Solicitors",
        slug: "black-suit-solicitors",
        client: "Black Suit Law",
        category: "Professional Services",
        description:
          "Digital presence and client engagement infrastructure for a Nigerian law firm — service pages, consultation flows, and professional positioning.",
        longDesc:
          "Calstins delivered the firm's digital presence — a professionally positioned platform covering practice areas, attorney profiles, and a structured consultation intake process.",
        outcome: "Platform live. Client enquiry volume increased within 60 days of launch.",
        url: "https://blacksuitsolicitors.com",
        tags: ["Digital Strategy", "Web Delivery"],
        featured: false,
        partnership: true,
        order: 9,
      },
      {
        title: "NigitTriple",
        slug: "nigittriple",
        client: "NigitTriple Industry",
        category: "Commerce Platform",
        description:
          "E-commerce platform delivery for a Nigerian grocery brand — including order automation and zone-based delivery infrastructure.",
        longDesc:
          "Calstins delivered the full commerce platform with product management, order processing, WhatsApp-integrated order notifications, and Nigerian zone-based delivery pricing.",
        outcome: "Platform live with recurring orders and active customer base.",
        url: "https://nigittriple.com",
        tags: ["Full Build", "Commerce", "Delivery Infrastructure"],
        featured: false,
        order: 10,
      },
  ]);
  console.log("✅ Projects");

  // ── Clients ───────────────────────────────────────────────────────────────────
  if (DESTRUCTIVE) await prisma.client.deleteMany({});
  await fillMissing(prisma.client, "name", [
      { name: "I-Coffee Nigeria", url: "https://i-coffee.ng", industry: "F&B Commerce", featured: true, order: 1 },
      { name: "BowaGO Logistics", industry: "Logistics", featured: true, order: 2 },
      { name: "TeenShapers", url: "https://teenshapersclub.com", industry: "Community Platform", featured: true, order: 3 },
      { name: "MyEvent", url: "https://myevent.com.ng", industry: "Events & Ticketing", featured: true, order: 4 },
      { name: "YEHGS Co Ltd", industry: "Equipment — UK/Nigeria", featured: true, order: 5 },
      { name: "EnergyWallet", url: "https://energywalletng.com", industry: "Fintech", featured: false, order: 6 },
      { name: "Super Business Woman Global", url: "https://superbusinesswoman.com", industry: "Commerce & Events", featured: false, order: 7 },
      { name: "Lamb Academy", url: "https://portal.lambacademy.ng", industry: "EdTech", featured: false, order: 8 },
      { name: "Black Suit Solicitors", url: "https://blacksuitsolicitors.com", industry: "Legal", featured: false, order: 9 },
      { name: "TFA Recycling", url: "https://tfarecycling.com", industry: "Sustainability", featured: false, order: 10 },
  ]);
  console.log("✅ Clients");

  // ── Testimonials ──────────────────────────────────────────────────────────────
  if (DESTRUCTIVE) await prisma.testimonial.deleteMany({});
  await fillMissing(prisma.testimonial, "name", [
      {
        name: "Kolawole Kolapo",
        role: "Full Stack Developer",
        company: "Italian Coffee Ventures",
        quote:
          "Calstins didn't just build what we asked for. They challenged our assumptions, navigated the complexity we didn't fully understand, and delivered a system we're still running on. They stayed when others would have walked away.",
        rating: 5,
        featured: true,
        order: 1,
      },
      {
        name: "Operations Lead",
        role: "Operations",
        company: "Italian Coffee Ventures",
        quote:
          "What makes a retainer partner valuable isn't just the technical depth. It's the institutional knowledge they carry about your business. A firm that was there from day one thinks differently about your product than one that arrived after launch.",
        rating: 5,
        featured: true,
        order: 2,
      },
      {
        name: "Founding Client",
        role: "CEO",
        company: "EnergyWallet NG",
        quote:
          "The most expensive mistake an organisation makes is hiring a firm that can think but can't build, then hiring another to execute. The gap between those two is where the project breaks. Calstins closed that gap for us.",
        rating: 5,
        featured: true,
        order: 3,
      },
  ]);
  console.log("✅ Testimonials");

  // ── Blog Posts — 20 strategy/insight articles ─────────────────────────────────
  if (DESTRUCTIVE) await prisma.post.deleteMany({});

  const posts = [
    {
      title: "The Gap Between Strategy and Execution Is Where Technology Projects Fail",
      category: "Technology Strategy",
      tags: ["strategy", "delivery", "technology-leadership", "nigeria"],
      focusKeyword: "technology strategy Nigeria",
      readTime: 7,
      excerpt:
        "Most organisations don't fail because of bad ideas. They fail because the people who understand the business don't understand the technology — and the people who understand the technology don't understand the business.",
      content: `<h2>Two Rooms, One Problem</h2><p>Walk into most Nigerian enterprises managing a technology programme and you'll find two separate conversations happening simultaneously. In the boardroom, leadership is discussing commercial objectives, market positioning, and return on investment. In the technology team, developers and IT managers are discussing architecture, platforms, and delivery timelines.</p><p>These conversations rarely connect. The result is predictable: technology programmes that are technically competent but commercially irrelevant, or commercial strategies that are business-sound but technically undeliverable.</p><h2>Why Handoffs Fail</h2><p>The traditional answer to this problem is the handoff model. A strategy consultant develops the plan. A development agency executes it. The problem is that every handoff loses context. By the time the third party is executing what the first party designed, the original intent has been diluted, qualified, and sometimes reversed.</p><p>We've seen this pattern repeatedly in Nigerian technology programmes: a management consultancy produces a 200-page digital transformation report. A development agency is engaged to execute it. Six months later, the product delivered bears little resemblance to the strategy, because the agency was executing instructions without understanding the commercial logic behind them.</p><h2>The Integration Advantage</h2><p>The firms that consistently deliver successful technology programmes are those that integrate strategic thinking with delivery capability in a single team. Not sequentially — simultaneously. The architect who understands why the business needs a particular data flow designs it differently from one who is simply executing a technical brief.</p><p>This integration creates a compounding advantage. Strategic decisions are better because they are tested against delivery reality. Delivery decisions are better because they are tested against commercial logic. The gap closes.</p><h2>What This Means in Practice</h2><p>For Nigerian organisations commissioning technology programmes, the question to ask any prospective partner is not just "can you build this?" but "do you understand why we need to build it, and will you stay accountable to the outcome after it's built?" The answer to that question determines whether your programme delivers value or delivers a repository.</p>`,
    },
    {
      title: "Why Nigerian Businesses Need a Technology Strategy Before They Need a Website",
      category: "Technology Strategy",
      tags: ["technology-strategy", "digital-transformation", "nigeria"],
      focusKeyword: "technology strategy Nigeria business",
      readTime: 6,
      excerpt:
        "Ordering a website before you have a technology strategy is like building a house before you have a foundation. The house gets built. It just doesn't last.",
      content: `<h2>The Symptom We See Most Often</h2><p>A Nigerian business decides it needs a digital presence. It commissions a website. The website gets built. Six months later, the business is dissatisfied with the results — traffic is low, conversions are lower, and the platform doesn't integrate with the way the business actually operates.</p><p>The problem is rarely the website. The problem is that the website was commissioned before anyone asked the more important questions: Who are we trying to reach? What do we want them to do? How does this platform connect to our commercial model? What happens after launch?</p><h2>What a Technology Strategy Actually Is</h2><p>A technology strategy is not a document. It is a set of decisions — made deliberately, before investment is committed — about what your technology environment needs to do, for whom, under what constraints, and to what commercial end.</p><p>For a small Nigerian business, a technology strategy might be a two-hour conversation resulting in three clear decisions. For an enterprise, it might be a six-week programme resulting in a formal architecture and vendor selection process. The scale differs. The principle does not.</p><h2>The Cost of Skipping It</h2><p>Organisations that skip the strategy phase typically spend more money, not less. They build platforms they then have to rebuild. They select vendors they then have to replace. They create technical debt in the first six months that constrains them for the next five years.</p><h2>Where to Start</h2><p>The right starting point is a honest assessment of three things: what the business needs technology to do commercially, what the realistic constraints are in terms of budget, timeline, and team capability, and what the regulatory environment requires. Everything else — platform selection, vendor engagement, build decisions — follows from that clarity.</p>`,
    },
    {
      title: "The Case for the Technology Retainer: Why Institutions Need a Partner That Stays",
      category: "Long-term Partnership",
      tags: ["retainer", "cto", "technology-management", "nigeria"],
      focusKeyword: "fractional CTO Nigeria technology retainer",
      readTime: 8,
      excerpt:
        "The most expensive moment in a technology programme is not the build. It is the moment the build team leaves and no one who remains understands what was built or why.",
      content: `<h2>The Departure Problem</h2><p>Most technology programmes end the same way. The development agency delivers the product. The project is signed off. The invoice is paid. And then the agency leaves, taking with them every architectural decision, every vendor relationship, every piece of institutional knowledge accumulated over the course of the engagement.</p><p>The organisation is left with a product it owns but does not fully understand, managed by an internal team that inherited it without the context that explains it. Within twelve months, the platform begins to accumulate technical debt. Within eighteen months, decisions are being made that contradict the original architecture for reasons no one can articulate. Within three years, a rebuild is being discussed.</p><h2>What a Retainer Actually Buys</h2><p>A technology retainer is not a support contract. It is a continuity arrangement. The value is not in the hours logged or the tickets resolved. It is in the institutional knowledge that stays in the room — the understanding of why the system was built the way it was, what decisions were considered and rejected, what the architecture is designed to support in its next phase.</p><p>A retainer partner thinks differently about your product than a firm that arrives after launch. They were there when the first architectural trade-off was made. That knowledge is not recoverable once the relationship ends.</p><h2>The Fractional CTO Model</h2><p>For Nigerian organisations that don't require a full-time Chief Technology Officer but do require senior technology leadership, the fractional CTO model provides a cost-effective alternative. A fractional CTO attends board meetings, owns the technology roadmap, advises on vendor relationships, and provides the strategic technology leadership that growing organisations need — without the full-time overhead.</p>`,
    },
    {
      title: "IT Infrastructure in Nigeria: Why Most Organisations Are Building on Sand",
      category: "IT Consulting",
      tags: ["it-infrastructure", "networking", "nigeria", "enterprise"],
      focusKeyword: "IT infrastructure Nigeria enterprise",
      readTime: 7,
      excerpt:
        "Nigerian organisations spend significantly on software and platforms while neglecting the infrastructure those platforms run on. The result is expensive software performing far below its capability.",
      content: `<h2>The Software-First Trap</h2><p>There is a pattern we observe repeatedly in Nigerian enterprise technology environments. An organisation commissions a new business management system, an e-commerce platform, or a customer service solution. Significant investment is made. The software is delivered. And then it underperforms — because the infrastructure it was designed to run on does not exist in the form the software assumes.</p><p>Connectivity is inadequate. Network latency is high. Power is unreliable. Backup systems are absent or untested. Security controls are minimal. The software is capable. The infrastructure is not.</p><h2>What Adequate Infrastructure Looks Like</h2><p>Adequate IT infrastructure for a Nigerian enterprise accounts for the realities of the operating environment: variable power supply requiring UPS systems and generator backup, internet connectivity requiring redundant providers, cybersecurity requirements that account for the Nigerian threat environment, and data residency considerations for organisations in regulated sectors.</p><p>The design of adequate infrastructure begins with understanding how the business actually operates — not how it is supposed to operate in an ideal environment.</p><h2>Network Design for Nigerian Organisations</h2><p>Network design for Nigerian organisations requires deliberate decisions about redundancy. A single ISP is a single point of failure in a market where ISP outages are not uncommon. A well-designed network for a Nigerian enterprise includes at least two internet service providers, failover logic, and monitoring that alerts the IT team before users begin to notice problems.</p>`,
    },
    {
      title: "Vendor Selection in Nigeria: Why the Cheapest Option Rarely Is",
      category: "Technology Strategy",
      tags: ["vendor-selection", "procurement", "nigeria"],
      focusKeyword: "technology vendor selection Nigeria",
      readTime: 6,
      excerpt:
        "Nigerian organisations consistently underinvest in vendor selection and pay for it later — in integrations that don't work, in contracts that don't protect them, and in vendor relationships they can't exit.",
      content: `<h2>The Selection Problem</h2><p>Vendor selection in the Nigerian technology market is frequently driven by two factors that have little to do with vendor quality: price and familiarity. The cheapest quote wins. Or the vendor someone knows gets the contract. Neither approach produces consistently good outcomes.</p><p>The cost of a bad vendor selection is almost always higher than the savings made at the procurement stage. Implementation overruns. Integration failures. Contract disputes. Migration costs when the relationship ends. These costs accumulate and often exceed the lifetime value of the initial savings.</p><h2>What Good Vendor Selection Looks Like</h2><p>Good vendor selection begins with a clear understanding of what you are actually selecting for. A Nigerian organisation selecting a cloud infrastructure provider is not just selecting storage capacity — it is selecting a partner for data residency compliance, for reliability in the Nigerian network environment, for support that operates in a compatible time zone, and for a contract that gives it appropriate exit rights.</p><h2>Independent Evaluation</h2><p>The most reliable vendor selection processes involve an independent evaluator — a party with no commercial relationship with any of the vendors under consideration. Where independence is achievable, it is worth investing in. The evaluator's only interest is in your organisation getting the right answer.</p>`,
    },
    {
      title: "Digital Transformation in Nigerian Government: The Opportunity and the Obstacles",
      category: "IT Consulting",
      tags: ["government", "digital-transformation", "nigeria", "public-sector"],
      focusKeyword: "digital transformation Nigeria government",
      readTime: 9,
      excerpt:
        "Nigerian government institutions have an unprecedented opportunity to modernise public service delivery. The obstacles are real, but they are not insurmountable.",
      content: `<h2>The Opportunity</h2><p>Nigerian government institutions — federal, state, and local — deliver services to one of the world's largest populations. The inefficiencies in current service delivery are well documented. What is less discussed is the opportunity: a well-designed digital transformation programme can reduce the cost of service delivery, eliminate corruption opportunities inherent in manual processes, and dramatically improve the citizen experience.</p><h2>The Obstacles Are Structural, Not Technical</h2><p>The obstacles to digital transformation in Nigerian government are rarely technical. The technology exists. The obstacles are structural: procurement processes that favour price over capability, contract structures that don't protect the government's interests, institutional resistance to process change, and the absence of the technical literacy at the leadership level needed to commission and oversee technology programmes effectively.</p><h2>What Successful Programmes Have in Common</h2><p>The digital transformation programmes that have succeeded in Nigerian government share several characteristics: strong sponsorship at the leadership level, clear definition of what success looks like before the programme begins, independent technical oversight throughout delivery, and a realistic assessment of the change management required alongside the technology delivery.</p>`,
    },
    {
      title: "The Architecture Decision You Can't Undo",
      category: "Technology Strategy",
      tags: ["architecture", "technology-decisions", "strategy"],
      focusKeyword: "software architecture decisions Nigeria",
      readTime: 7,
      excerpt:
        "Platform choices can be changed. Architecture decisions — the structural choices that determine how a system is organised and how it handles failure — are much harder to reverse.",
      content: `<h2>Platform vs Architecture</h2><p>Nigerian technology discussions tend to focus on platforms: which CRM to use, which e-commerce platform to deploy, which cloud provider to select. These are important questions. But they are secondary to the architectural decisions that determine how those platforms will interact, how data will flow between them, and what the system will look like under stress.</p><p>Architecture decisions are the structural choices that constrain everything else. A decision to build a monolithic system versus a modular one will affect every future development decision for the lifetime of that system. A decision about how to model your data will determine what queries are fast, what integrations are easy, and what reports are possible — for years.</p><h2>The Cost of Bad Architecture</h2><p>Bad architecture reveals itself slowly, then suddenly. In the first year, the system performs adequately. By year two, performance is degrading as the data volume grows. By year three, the development team is spending more time working around the architectural constraints than building new features. By year four, there is a serious conversation about whether to rebuild or continue to patch.</p><h2>The Right Investment at the Right Time</h2><p>Investing in architectural expertise at the beginning of a programme is one of the highest-return investments an organisation can make. A senior architect who spends two weeks designing the right structure for a system can prevent two years of technical debt. The cost of that expertise at the design stage is a fraction of the cost of addressing architectural problems in a production system.</p>`,
    },
    {
      title: "Fintech Infrastructure in Nigeria: What Regulated Products Require Before They Can Launch",
      category: "Technology Strategy",
      tags: ["fintech", "nigeria", "regulation", "compliance"],
      focusKeyword: "fintech infrastructure Nigeria regulation",
      readTime: 8,
      excerpt:
        "Building a fintech product in Nigeria is not the same as building a consumer app. The regulatory environment and architecture implications are categorically different — and must be addressed before launch, not after.",
      content: `<h2>The Compliance Is the Product</h2><p>In consumer software, compliance is a feature. In fintech, compliance is the product. A payment product that cannot meet CBN requirements is not a product. A lending platform that does not satisfy Money Lenders Law requirements in its target states does not exist, legally, in those states.</p><p>This reorients the development process entirely. The regulatory requirements do not come at the end of the build, as a checklist to be ticked before launch. They come at the beginning, as constraints that shape the architecture, the data model, the vendor selection, and the business model itself.</p><h2>What Fintech Founders Get Wrong</h2><p>The most common mistake Nigerian fintech founders make is treating the CBN licensing process as a parallel track to product development — something to pursue alongside the build, rather than something that shapes it. This creates a predictable problem: a product gets built, then the licensing process reveals requirements that require the product to be rebuilt.</p><h2>The Right Sequence</h2><p>The right sequence for a Nigerian fintech build begins with regulatory mapping: identifying which licences are required, what the application requirements are, what the ongoing compliance obligations will be, and what this means for the product design. This regulatory map then shapes the architecture design. The architecture design then shapes the build. Not the other way around.</p>`,
    },
    {
      title: "Why Nigerian Startups Outgrow Their First Technology Platforms",
      category: "Technology Strategy",
      tags: ["startups", "nigeria", "platform", "scaling"],
      focusKeyword: "Nigerian startups technology scaling",
      readTime: 6,
      excerpt:
        "Almost every Nigerian startup that achieves meaningful scale encounters the same problem: the platform they built to launch is not the platform they need to grow.",
      content: `<h2>The MVP Trap</h2><p>The minimum viable product is a powerful concept. It disciplines a founding team to identify what absolutely must be true for the first version of a product, and to build only that. The problem is that "minimum viable" is often confused with "structurally sound". A product can be minimum viable without being architecturally capable of growing into something larger.</p><p>Nigerian startups frequently launch on platforms that are adequate for their initial user base and inadequate for the user base they will have twelve months after launch — if the product succeeds. Success, paradoxically, becomes the trigger for a technology crisis.</p><h2>What Scale Actually Requires</h2><p>Scaling a technology platform is not simply a matter of adding servers. The architectural choices made at the beginning determine what is possible at scale. A database schema designed for a thousand users will behave differently when it is serving a hundred thousand.</p><h2>Designing for Evolution</h2><p>The right approach is to design the initial architecture with explicit awareness of the growth trajectory, to identify the architectural decisions that will be hardest to reverse, to make those decisions carefully, and to leave the others open for as long as possible. This requires an architect who can think at both the immediate and the extended scale — and who understands the business trajectory well enough to know what the platform will need to become.</p>`,
    },
    {
      title: "The Real Cost of IT Neglect in Nigerian Organisations",
      category: "IT Consulting",
      tags: ["it-management", "risk", "nigeria", "enterprise"],
      focusKeyword: "IT management risk Nigeria",
      readTime: 6,
      excerpt:
        "Nigerian organisations consistently underestimate the cost of IT neglect. The visible costs are significant. The invisible costs — in lost productivity and strategic constraint — are larger.",
      content: `<h2>The Visible Costs</h2><p>The visible costs of IT neglect are well understood: system downtime, data loss events, security incidents. Nigerian organisations experience these with regularity, and the financial impact is measurable — in lost revenue during downtime, in recovery costs after incidents, in reputational damage after a breach.</p><h2>The Invisible Costs</h2><p>The invisible costs are harder to quantify but ultimately larger. Staff productivity lost to unreliable systems. Strategic opportunities that cannot be pursued because the organisation's technology environment cannot support them. Partnerships that don't happen because a prospective partner's due diligence reveals IT governance failures. These costs accumulate silently, over years, and are rarely attributed to IT neglect because the causal chain is indirect.</p><h2>What Proactive IT Management Costs</h2><p>Proactive IT management — regular infrastructure assessment, planned maintenance, vendor management, security monitoring — costs a fraction of reactive IT management. The ratio varies, but the principle is consistent: organisations that invest proactively in their IT environment spend less on IT overall than organisations that address problems only when they become crises.</p>`,
    },
    {
      title: "Outsourcing IT in Nigeria: What to Keep and What to Give Away",
      category: "IT Consulting",
      tags: ["outsourcing", "it-management", "nigeria", "vendors"],
      focusKeyword: "IT outsourcing Nigeria",
      readTime: 7,
      excerpt:
        "Not all IT capability is equally strategic. The decision of what to build internally and what to outsource to specialist partners is one of the most consequential technology decisions a Nigerian organisation makes.",
      content: `<h2>The Strategic vs Commodity Distinction</h2><p>The fundamental question in any outsourcing decision is whether the capability in question is strategic or commodity. A strategic capability differentiates the organisation — it is something that, if done exceptionally well, creates competitive advantage. A commodity capability is something that every organisation of a similar type needs, but which does not differentiate any of them.</p><p>For most Nigerian organisations, the management of email infrastructure is a commodity capability. The way those organisations use data to understand their customers may be strategic. The first is a candidate for outsourcing. The second, generally, is not.</p><h2>The Retained Capability Question</h2><p>The most important question in any outsourcing discussion is: what capability must we retain internally, no matter what? For most Nigerian organisations, the retained capabilities include the understanding of how technology serves the business model, the oversight of vendor performance, and the accountability for technology decisions at the leadership level. Everything else is a candidate for evaluation.</p>`,
    },
    {
      title: "How to Commission a Technology Programme You Can Hold Someone Accountable For",
      category: "Technology Strategy",
      tags: ["programme-management", "accountability", "nigeria"],
      focusKeyword: "technology programme management Nigeria",
      readTime: 8,
      excerpt:
        "Nigerian organisations routinely commission technology programmes that no one can be held accountable for delivering — because the accountability framework is absent before the programme begins.",
      content: `<h2>The Accountability Vacuum</h2><p>The typical technology programme in a Nigerian organisation begins with an aspiration and ends in disappointment. Not because the technology failed. Not because the vendor was incompetent. But because the accountability framework — the agreement about what success looks like, who is responsible for what, and what happens when things go wrong — was never established.</p><h2>What an Accountability Framework Includes</h2><p>An accountability framework for a technology programme is a set of shared agreements about outcomes, milestones, decision rights, escalation paths, and success criteria. It answers the questions that, left unanswered, create ambiguity: What does done look like? Who has authority to change the scope? What triggers an escalation? What are the consequences of a missed milestone?</p><h2>The Sponsor's Role</h2><p>Every technology programme requires an executive sponsor — a senior leader with the authority to make decisions, the accountability for the outcome, and the commitment to remain engaged throughout the delivery. The absence of an engaged sponsor is the single most reliable predictor of programme failure in Nigerian organisations.</p>`,
    },
    {
      title: "Cybersecurity in Nigerian Businesses: What the Threat Landscape Actually Looks Like",
      category: "IT Consulting",
      tags: ["cybersecurity", "nigeria", "enterprise", "risk"],
      focusKeyword: "cybersecurity Nigeria business",
      readTime: 7,
      excerpt:
        "Nigerian businesses face a threat landscape that is more complex than most organisations acknowledge — and more addressable than most assume.",
      content: `<h2>What Nigerian Businesses Actually Face</h2><p>The cybersecurity threat landscape for Nigerian businesses is distinctive. Business email compromise — sophisticated fraud targeting the financial processes of Nigerian companies — is among the most prevalent and costly threats. Phishing attacks targeting Nigerian financial credentials are pervasive. Ransomware incidents are increasing. And insider threats are a recurring source of significant losses.</p><h2>The Underinvestment Problem</h2><p>Nigerian businesses consistently underinvest in cybersecurity relative to the risk they face. The reasons are familiar: security spending is invisible until something goes wrong, the probability of a given incident feels low, and the budget is always needed for something more immediately pressing.</p><p>In the Nigerian threat environment, the probability is not low. For a Nigerian business of any significant size, a material security incident is not a remote possibility. It is a near-certainty on a long enough timeline.</p><h2>Where to Start</h2><p>The right starting point for a Nigerian business is a realistic assessment of its current security posture — not against some abstract global standard, but against the specific threats it faces in its specific operating environment.</p>`,
    },
    {
      title: "Building a Product Roadmap That Business and Technology Teams Both Trust",
      category: "Technology Strategy",
      tags: ["product-roadmap", "product-management", "nigeria"],
      focusKeyword: "product roadmap Nigeria technology",
      readTime: 6,
      excerpt:
        "A product roadmap that only the technology team believes in is not a product roadmap. It is a delivery schedule. The document that both sides trust is the rarest and most valuable artefact a product organisation can produce.",
      content: `<h2>The Trust Problem</h2><p>Most product roadmaps are distrusted by at least one of the audiences they are meant to serve. Business leadership distrusts roadmaps because experience has taught them that delivery timelines slip and priorities shift without adequate explanation. Technology teams distrust roadmaps because experience has taught them that business priorities change faster than technology can respond.</p><h2>What a Trustworthy Roadmap Contains</h2><p>A trustworthy roadmap is built on explicit decisions, not wishes. It distinguishes between what is committed — items for which delivery confidence is high because the scope is understood, the capability exists, and the dependencies are controlled — and what is directional — items for which the business intent is clear but the delivery specifics are not yet determined.</p><h2>The Review Rhythm</h2><p>A roadmap is not a document. It is a rhythm — a regular cadence of review, update, and communication that keeps business and technology aligned as circumstances evolve.</p>`,
    },
    {
      title: "The Economics of Technical Debt in Nigerian Platforms",
      category: "Technology Strategy",
      tags: ["technical-debt", "software", "nigeria", "platform"],
      focusKeyword: "technical debt Nigerian platforms",
      readTime: 7,
      excerpt:
        "Technical debt is not a technology problem. It is an economics problem — and one that Nigerian platform owners consistently misunderstand until it becomes a crisis.",
      content: `<h2>What Technical Debt Actually Is</h2><p>Technical debt is the accumulated cost of shortcuts taken during software development. Like financial debt, it carries interest — in the form of increased development time, increased maintenance cost, and decreased system reliability. And like financial debt, the interest rate increases over time, not remains constant. The longer technical debt accumulates, the more expensive each additional piece of development becomes.</p><h2>How Nigerian Platforms Accumulate Debt</h2><p>Nigerian platforms accumulate technical debt through predictable mechanisms. Launch pressure leads to shortcuts that are intended as temporary but become permanent. Rapid feature addition is prioritised over architectural coherence. The development team changes, and the new team works around things it doesn't understand rather than addressing them.</p><h2>Managing the Debt</h2><p>The organisations that manage technical debt well are those that acknowledge it explicitly, measure it regularly, and allocate a consistent portion of their development capacity to addressing it — not all at once, which is disruptive, but continuously, as a discipline.</p>`,
    },
    {
      title: "How African E-Commerce Platforms Fail Their Customers at the Last Mile",
      category: "Technology Strategy",
      tags: ["ecommerce", "logistics", "africa", "nigeria"],
      focusKeyword: "African e-commerce last mile delivery",
      readTime: 6,
      excerpt:
        "The technology problem in African e-commerce is not the storefront. It is the last mile — where a digital transaction must translate into a physical delivery across infrastructure that was not designed for it.",
      content: `<h2>Where the Experience Breaks</h2><p>African e-commerce platforms have invested heavily in the online experience: intuitive browsing, seamless payment, clear order confirmation. The experience for most African online shoppers breaks at the point of fulfilment — the translation from a digital order to a physical delivery across an addressing system, a road network, and a logistics infrastructure that were not designed for the volume or the expectation that e-commerce creates.</p><h2>The Addressing Problem</h2><p>Nigeria — like most African markets — does not have a uniform, reliable addressing system. Street numbers are inconsistent. New developments lack official addresses. Rural areas are routinely unaddressable by standard postal conventions. E-commerce platforms that assume a reliable addressing system will fail a significant portion of their customers at the point of delivery.</p><h2>The Infrastructure Gap as a Business Opportunity</h2><p>The organisations that build infrastructure to solve the last-mile problem are building something with significant and durable value. Solving a hard logistics problem in a large market, credibly, is the foundation of a defensible business.</p>`,
    },
    {
      title: "The Vendor Management Problem in Nigerian Technology Programmes",
      category: "IT Consulting",
      tags: ["vendor-management", "technology", "nigeria", "programme"],
      focusKeyword: "vendor management technology Nigeria",
      readTime: 7,
      excerpt:
        "Nigerian organisations routinely enter vendor relationships poorly and manage them worse. The result is a technology supply chain that is expensive, unreliable, and difficult to exit.",
      content: `<h2>The Entry Problem</h2><p>Most Nigerian technology vendor relationships are entered without adequate diligence. The vendor is selected on the basis of price, familiarity, or a referral from a trusted source — without systematic evaluation of the vendor's capability to deliver what is required, the quality of their support infrastructure, or the fairness of the contract terms.</p><h2>The Management Problem</h2><p>Even well-selected vendors require active management. In Nigerian organisations, vendor management is frequently neglected — either because the internal capability to manage technology vendors effectively does not exist, or because the relationship was established on the assumption that the vendor would manage itself. Without active performance monitoring, regular service reviews, and clear escalation paths, vendor performance drifts.</p><h2>Building Vendor Management Capability</h2><p>The organisations that manage technology vendors effectively have built a small number of capabilities: clear performance frameworks with measurable KPIs, regular review rhythms that create structured accountability, and the confidence to escalate problems through the vendor relationship rather than around it.</p>`,
    },
    {
      title: "When to Build vs When to Buy: A Framework for Nigerian Organisations",
      category: "Technology Strategy",
      tags: ["build-vs-buy", "technology-strategy", "nigeria"],
      focusKeyword: "build vs buy software Nigeria",
      readTime: 6,
      excerpt:
        "The build vs buy decision is one of the most consequential technology decisions a Nigerian organisation makes — and one of the most frequently made badly.",
      content: `<h2>Why It Matters More Than Most Organisations Realise</h2><p>The build vs buy decision appears to be a technology decision. It is actually a business decision — one that determines what the organisation will control, what it will depend on others for, what its technology costs will look like in three years, and what its competitive position will be relative to organisations that made the opposite choice.</p><h2>The Build Case</h2><p>Build when the capability in question is genuinely differentiating — when the way your organisation does this thing is part of what makes your business valuable, and when replicating that differentiation in a vendor's off-the-shelf product is not possible. The build case is more frequently valid in Nigerian markets than in more mature technology markets, because the vendor ecosystem for Nigeria-specific requirements is less developed.</p><h2>The Buy Case</h2><p>Buy when the capability is a commodity — something that every organisation of your type needs in roughly the same way, and where a vendor has already solved the hard problems. Most Nigerian organisations should be buying more than they are building. The discipline to resist the temptation to build custom solutions for commodity problems is one of the most valuable disciplines a technology leadership team can develop.</p>`,
    },
    {
      title: "Data Strategy for Nigerian Organisations: What to Collect, Protect, and Use",
      category: "Technology Strategy",
      tags: ["data-strategy", "nigeria", "privacy", "analytics"],
      focusKeyword: "data strategy Nigerian organisations",
      readTime: 7,
      excerpt:
        "Nigerian organisations are accumulating data at unprecedented rates — and doing almost nothing useful with most of it. The organisations that win the next decade will treat data as a strategic asset, not a compliance burden.",
      content: `<h2>The Data Accumulation Problem</h2><p>Nigerian organisations — particularly in commerce, fintech, and healthcare — are accumulating large volumes of data about their customers, their transactions, and their operations. Most of this data is stored but not analysed. It is a cost — in storage, in management, in the compliance obligations it creates — without being an asset.</p><h2>The NDPR Dimension</h2><p>The Nigeria Data Protection Regulation creates compliance obligations for Nigerian organisations that collect and process personal data. These obligations are real and increasingly enforced. But they also create a framework that, if followed, produces better data practices — clearer purposes for collection, better security controls, more careful data management.</p><h2>From Data to Decision</h2><p>The gap between having data and making better decisions with it is larger than most Nigerian organisations appreciate. Having a database of customer transactions does not automatically produce insight. Producing insight requires analytical capability — the people, tools, and processes that translate raw data into actionable understanding.</p>`,
    },
    {
      title: "The Post-Launch Problem: Why Most Nigerian Platforms Fail After They Succeed",
      category: "Long-term Partnership",
      tags: ["post-launch", "product-management", "nigeria", "retainer"],
      focusKeyword: "post-launch product management Nigeria",
      readTime: 6,
      excerpt:
        "The launch is not the end of the technology programme. For most Nigerian platforms, it is the moment the real work begins — and when most of the support structures they relied on disappear.",
      content: `<h2>The Launch Illusion</h2><p>There is a widespread but inaccurate assumption in Nigerian technology programmes that launch is the goal. The product launches. The project closes. The team disperses. The organisation moves on to the next initiative. And the platform is left to operate without the support structure that brought it into existence.</p><h2>What Post-Launch Platforms Need</h2><p>A platform in the months immediately following launch needs several things that are different from what it needed during development. It needs operational monitoring. It needs product management — someone tracking user behaviour, identifying friction, and prioritising the changes that will most improve the experience. It needs strategic oversight — someone ensuring that the platform is evolving in a direction consistent with the business model.</p><h2>The Retainer as Continuity</h2><p>The technology retainer model exists to provide this post-launch continuity — not as a support contract that responds to problems after they occur, but as an embedded partnership that prevents problems from occurring, identifies opportunities for improvement, and ensures that the platform evolves in a direction that serves the business. Organisations that invest in this continuity get compounding returns. Those that don't get compounding problems.</p>`,
    },
  ];

  for (const post of posts) {
    const postSlug = sl(post.title);
    await prisma.post.upsert({
      where: { slug: postSlug },
      update: {},
      create: {
        ...post,
        slug: postSlug,
        published: true,
        views: Math.floor(Math.random() * 400) + 80,
        metaTitle: post.title,
        metaDesc: post.excerpt,
      },
    });
  }
  console.log(`✅ ${posts.length} blog posts`);

  console.log("\nContent seed finished. Next: npm run seed:catalog (Start/Build/Grow services, packages, FAQs, story).");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
