# Calstins Ltd — Agency Website

Full-stack agency website for calstins.com — Next.js 14, Tailwind CSS, Framer Motion, Prisma, MongoDB, Cloudinary.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes, Prisma ORM, MongoDB Atlas
- **Media:** Cloudinary
- **Auth:** JWT (jose) with httpOnly cookies
- **Email:** Nodemailer (Gmail SMTP)
- **Deployment:** Vercel

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` with your real values:
- `DATABASE_URL` — MongoDB Atlas connection string
- `CLOUDINARY_*` — From your Cloudinary dashboard
- `JWT_SECRET` — Any random 32+ char string
- `SMTP_*` — Gmail credentials (use App Password)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Admin login credentials

### 3. Generate Prisma client
```bash
npx prisma generate
```

### 4. Create the admin and seed the database
```bash
# Everything in one go (safe to re-run; only fills what is empty, never overwrites your edits):
npm run setup

# Or step by step:
ADMIN_EMAIL=you@calstins.com ADMIN_PASSWORD='a-long-password' npm run admin:create   # create the admin or reset its password
npm run seed            # work (projects), clients, testimonials, blog posts, original services; adds anything missing (never overwrites your edits)
npm run seed:catalog    # Start/Build/Grow services, packages (incl. CAC, SEO), FAQs, story and settings
npm run db:check        # confirm the app can reach MongoDB
```
`ALLOW_DESTRUCTIVE_SEED=true npm run seed` wipes and recreates the seeded collections (disposable databases only). The seeds never create or touch admin accounts; use `npm run admin:create`.
`JWT_SECRET` (16+ characters) must be set or login returns a clear 503. Replies from the admin inbox need `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.

If the database is unreachable the admin shows a "database did not respond" panel that retries when you are back online, and the public site shows a friendly error page. Unknown URLs show a branded 404 inside the site layout.

`npm run seed` adds, if missing: engagement modes, services, 10 projects, 10 clients, 3 testimonials and 20 SEO blog posts.

### 5. Run development server
```bash
npm run dev
```

Visit:
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

## Admin Panel

URL: `/admin/login`

Features:
- **Blog** — Full CRUD with SEO fields (meta title, description, focus keyword, SERP preview)
- **Services** — CRUD with features list and icon
- **Projects** — CRUD with cover image, tech stack tags, and metrics
- **Clients** — CRUD with logo upload
- **Testimonials** — CRUD with star ratings
- **Contacts** — Inbox view with read/reply tracking
- **Keyword Tool** — Nigeria-focused keyword research with difficulty and intent indicators

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, services, work, partners, testimonials, CTA |
| `/services` | All 9 services with features |
| `/work` | 4 main projects + 5 partnership companies |
| `/about` | Founder bio, skills, timeline, values |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post detail with view counter |
| `/contact` | Contact form with service + budget selectors |
| `/admin` | CMS dashboard |

## Seed Script

The seed script at `prisma/seed.ts` populates:

**Projects:** i-coffee.ng, NigitTriple, TeenShapers Club, myevent.com.ng, BowaGO, PropertyXchange, EnergyWallet, Super Business Woman Global, Lamb Academy LMS, Black Suit Solicitors

**Services:** Web Development, Mobile Apps, E-Commerce, API & Backend, SEO & Growth, WordPress & CMS

**Blog Posts (20):** Heavy SEO content targeting Nigerian tech keywords — Next.js e-commerce, React Native, Nigerian SEO, Paystack, WhatsApp API, App Router, event ticketing, Paystack vs Stripe, multi-vendor marketplaces, product management Nigeria, i-coffee case study, Cloudinary, BullMQ, Vercel deployment, logistics zones, WordPress sports, auth systems, fintech P2P, website performance, LMS Nigeria.
