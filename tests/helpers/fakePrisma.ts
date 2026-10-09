// Minimal in-memory stand-in for the Prisma client, covering exactly the calls the routes make.
/* eslint-disable @typescript-eslint/no-explicit-any */
let counter = 0;
const newId = () => (++counter).toString(16).padStart(24, "0");

type Row = Record<string, any>;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (v && typeof v === "object" && "in" in v) return (v as any).in.includes(row[k]);
    return row[k] === v;
  });
}

function makeTable(name: string, defaults: () => Row = () => ({})) {
  const t = {
    rows: [] as Row[],
    reset() { t.rows = []; },
    seed(r: Row) { const row = { id: newId(), createdAt: new Date(), updatedAt: new Date(), ...defaults(), ...r }; t.rows.push(row); return row; },
    async create({ data }: any) {
      if (data.slug && t.rows.some((r) => r.slug === data.slug)) throw Object.assign(new Error("unique"), { code: "P2002" });
      return t.seed(data);
    },
    async findUnique({ where }: any) { return t.rows.find((r) => matches(r, where)) ?? null; },
    async findMany({ where }: any = {}) { return t.rows.filter((r) => matches(r, where)); },
    async count() { return t.rows.length; },
    async update({ where, data }: any) {
      const row = t.rows.find((r) => matches(r, where));
      if (!row) throw Object.assign(new Error("not found"), { code: "P2025" });
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    },
    async updateMany({ where, data }: any) {
      const hit = t.rows.filter((r) => matches(r, where));
      hit.forEach((r) => Object.assign(r, data));
      return { count: hit.length };
    },
    async delete({ where }: any) {
      const i = t.rows.findIndex((r) => matches(r, where));
      if (i < 0) throw Object.assign(new Error("not found"), { code: "P2025" });
      return t.rows.splice(i, 1)[0];
    },
    async deleteMany({ where }: any = {}) {
      const keep = t.rows.filter((r) => !matches(r, where));
      const count = t.rows.length - keep.length;
      t.rows = keep;
      return { count };
    },
    _name: name,
  };
  return t;
}

export const tables = {
  service: makeTable("service", () => ({ subItems: undefined })),
  serviceSubItem: makeTable("serviceSubItem"),
  servicePackage: makeTable("servicePackage"),
  faq: makeTable("faq"),
  companySettings: makeTable("companySettings"),
  contact: makeTable("contact"),
  post: makeTable("post"),
  admin: makeTable("admin"),
};

const withService = (row: Row, args: any = {}) => {
  const out: Row = { ...row };
  if (args.include?.subItems) out.subItems = tables.serviceSubItem.rows.filter((s) => s.serviceId === row.id).sort((a, b) => a.order - b.order);
  if (args.include?.packages) out.packages = tables.servicePackage.rows.filter((p) => p.serviceId === row.id && (!args.include.packages.where || matches(p, args.include.packages.where)));
  if (args.include?.faqs) out.faqs = tables.faq.rows.filter((f) => f.serviceId === row.id && (!args.include.faqs.where || matches(f, args.include.faqs.where)));
  if (args.include?._count) out._count = { packages: tables.servicePackage.rows.filter((p) => p.serviceId === row.id).length };
  return out;
};

export const fake: any = {
  ...tables,
  service: {
    ...tables.service,
    findMany: async (args: any = {}) => tables.service.rows.filter((r) => matches(r, args.where)).map((r) => withService(r, args)),
    findUnique: async (args: any) => { const r = await tables.service.findUnique(args); return r ? withService(r, args) : null; },
  },
  servicePackage: {
    ...tables.servicePackage,
    findMany: async (args: any = {}) => tables.servicePackage.rows.filter((r) => matches(r, args.where)),
  },
  serviceSubItem: { ...tables.serviceSubItem },
  companySettings: {
    ...tables.companySettings,
    upsert: async ({ where, create, update }: any) => {
      const row = tables.companySettings.rows.find((r) => matches(r, where));
      if (row) return Object.assign(row, update);
      return tables.companySettings.seed(create);
    },
  },
  post: {
    ...tables.post,
    findMany: async (args: any = {}) => tables.post.rows.filter((r) => matches(r, args.where)),
    count: async (args: any = {}) => tables.post.rows.filter((r) => matches(r, args.where)).length,
  },
};

export function resetAll() {
  Object.values(tables).forEach((t) => t.reset());
}
