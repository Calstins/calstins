/**
 * QA-ONLY harness. NOT used in production.
 *
 * The sandbox this was verified in has no MongoDB and cannot download Prisma engines, so for browser QA this
 * preload replaces `@prisma/client` with a tiny JSON-file-backed fake. Load it with:
 *     NODE_OPTIONS="--require ./scripts/qa/fake-prisma.cjs" npx next start
 * The real prisma/seed.ts and prisma/seed-catalog.ts can run against it too, so QA uses the real seed content.
 */
const Module = require("module");
const fs = require("fs");
const path = require("path");

const FILE = process.env.QA_DB_FILE || path.join(__dirname, "data.json");
const DATE_KEYS = new Set(["createdAt", "updatedAt"]);
const revive = (_k, v) => (DATE_KEYS.has(_k) && typeof v === "string" ? new Date(v) : v);
let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, "utf8"), revive); } catch { db = {}; }
const save = () => fs.writeFileSync(FILE, JSON.stringify(db));
const reload = () => { try { db = JSON.parse(fs.readFileSync(FILE, "utf8"), revive); } catch { /* keep */ } };
const hex = () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

const DEFAULTS = {
  post: { published: false, views: 0, readTime: 5, tags: [], keywords: [] },
  service: { order: 0, featured: false, scope: [] },
  serviceSubItem: { order: 0, bullets: [] },
  servicePackage: { priceType: "CUSTOM_QUOTE", currency: "NGN", billingPeriod: "ONE_OFF", features: [], exclusions: [], featured: false, published: false, order: 0 },
  faq: { published: true, order: 0 },
  companySettings: { key: "company", companyName: "Calstins Ltd", registrationVerified: false, storyPublished: false, milestones: [], values: [] },
  contact: { read: false, replied: false },
  project: { featured: false, partnership: false, order: 0, tags: [] },
  client: { featured: false, order: 0 },
  testimonial: { rating: 5, featured: false, order: 0 },
  engagementMode: { order: 0, bullets: [] },
  admin: {},
};

const match = (row, where = {}) => Object.entries(where).every(([k, v]) => {
  if (k === "AND") return v.every((w) => match(row, w));
  if (k === "OR") return v.some((w) => match(row, w));
  if (v && typeof v === "object" && !(v instanceof Date)) {
    if ("in" in v) return v.in.includes(row[k]);
    if ("has" in v) return Array.isArray(row[k]) && row[k].includes(v.has);
    if ("equals" in v) return row[k] === v.equals;
    if ("contains" in v) return String(row[k] ?? "").toLowerCase().includes(String(v.contains).toLowerCase());
    if ("not" in v) return row[k] !== v.not;
  }
  return row[k] === v;
});

const sortRows = (rows, orderBy) => {
  const list = [].concat(orderBy || []);
  return [...rows].sort((a, b) => {
    for (const o of list) for (const [k, dir] of Object.entries(o)) {
      const av = a[k], bv = b[k];
      if (av == null && bv == null) continue;
      if (av < bv) return dir === "desc" ? 1 : -1;
      if (av > bv) return dir === "desc" ? -1 : 1;
    }
    return 0;
  });
};

function table(name) {
  const rows = () => (db[name] = db[name] || []);
  const withIncludes = (r, args = {}) => {
    const out = { ...r };
    const inc = args.include;
    if (name === "service" && inc) {
      if (inc.subItems) out.subItems = sortRows((db.serviceSubItem || []).filter((s) => s.serviceId === r.id), inc.subItems.orderBy);
      if (inc.packages) out.packages = sortRows((db.servicePackage || []).filter((p) => p.serviceId === r.id && match(p, inc.packages.where)), inc.packages.orderBy);
      if (inc.faqs) out.faqs = sortRows((db.faq || []).filter((f) => f.serviceId === r.id && match(f, inc.faqs.where)), inc.faqs.orderBy);
      if (inc._count) out._count = { packages: (db.servicePackage || []).filter((p) => p.serviceId === r.id).length };
    }
    return out;
  };
  const make = (data) => {
    const now = new Date();
    const row = { id: hex(), createdAt: now, updatedAt: now, ...(DEFAULTS[name] || {}), ...data };
    if (row.slug && rows().some((x) => x.slug === row.slug)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    // seed.ts may pass nested creates; flatten the ones it uses
    delete row.subItems;
    rows().push(row);
    return row;
  };
  const apply = (row, data) => {
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === "object" && "increment" in v) row[k] = (row[k] || 0) + v.increment;
      else row[k] = v;
    }
    row.updatedAt = new Date();
  };
  return {
    async findMany(args = {}) {
      reload();
      let r = sortRows(rows().filter((x) => match(x, args.where)), args.orderBy);
      if (args.skip) r = r.slice(args.skip);
      if (args.take) r = r.slice(0, args.take);
      return r.map((x) => withIncludes(x, args));
    },
    async findFirst(args = {}) { return (await this.findMany({ ...args, take: 1 }))[0] ?? null; },
    async findUnique(args) { reload(); const r = rows().find((x) => match(x, args.where)); return r ? withIncludes(r, args) : null; },
    async count(args = {}) { reload(); return rows().filter((x) => match(x, args.where)).length; },
    async create({ data, include }) { reload(); const r = make(data); save(); return withIncludes(r, { include }); },
    async createMany({ data }) { reload(); data.forEach(make); save(); return { count: data.length }; },
    async update({ where, data }) {
      reload();
      const r = rows().find((x) => match(x, where));
      if (!r) throw Object.assign(new Error("Record not found"), { code: "P2025" });
      apply(r, data); save(); return r;
    },
    async updateMany({ where, data }) { reload(); const hit = rows().filter((x) => match(x, where)); hit.forEach((r) => apply(r, data)); save(); return { count: hit.length }; },
    async upsert({ where, create, update }) {
      reload();
      const r = rows().find((x) => match(x, where));
      if (r) { apply(r, update); save(); return r; }
      const n = make(create); save(); return n;
    },
    async delete({ where }) {
      reload();
      const i = rows().findIndex((x) => match(x, where));
      if (i < 0) throw Object.assign(new Error("Record not found"), { code: "P2025" });
      const [r] = rows().splice(i, 1); save(); return r;
    },
    async deleteMany({ where } = {}) { reload(); const keep = rows().filter((x) => !match(x, where)); const count = rows().length - keep.length; db[name] = keep; save(); return { count }; },
  };
}

class PrismaClient {
  constructor() {
    for (const m of Object.keys(DEFAULTS)) {
      const t = table(m);
      // QA: while the file named by QA_FAIL_FILE exists, every query fails like an unreachable Atlas cluster.
      this[m] = new Proxy(t, { get: (o, k) => typeof o[k] === "function" && process.env.QA_FAIL_FILE ? (...a) => {
        if (fs.existsSync(process.env.QA_FAIL_FILE)) return Promise.reject(new Error("Server selection timeout: No available servers. Topology: ReplicaSetNoPrimary"));
        return o[k](...a);
      } : o[k] });
    }
  }
  async $connect() {}
  async $disconnect() {}
}

const fakeModule = { PrismaClient, Prisma: {} };
const origLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === "@prisma/client" || /^@prisma\/client-/.test(request) || /\.prisma\/client/.test(request)) return fakeModule;
  return origLoad.call(this, request, ...rest);
};
