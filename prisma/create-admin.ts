/**
 * Non-destructive admin bootstrap / password reset.
 *   ADMIN_EMAIL=you@calstins.com ADMIN_PASSWORD='a-long-password' npm run admin:create
 * Creates the admin if missing, or resets its password if it exists. Touches nothing else.
 */
import "./load-env";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME || "Caleb Opule";
  const existing = await prisma.admin.findUnique({ where: { email }, select: { id: true } });
  const admin = existing
    ? await prisma.admin.update({ where: { id: existing.id }, data: { password: hash } })
    : await prisma.admin.create({ data: { email, password: hash, name } });
  console.log(`Admin ready: ${admin.email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
