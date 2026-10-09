/**
 * Connection check:  npm run db:check
 * Tells you whether the app can reach MongoDB and whether an admin account exists, with the usual fixes.
 */
import "../prisma/load-env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: [] });

async function main() {
  const url = process.env.DATABASE_URL || "";
  if (!url) { console.error("DATABASE_URL is not set. Add it to .env."); process.exit(1); }
  console.log(`Connecting to ${url.replace(/\/\/[^@]*@/, "//***:***@").split("?")[0]} ...`);
  try {
    const admins = await prisma.admin.count();
    const services = await prisma.service.count();
    console.log(`Connected. ${admins} admin account(s), ${services} service(s).`);
    if (admins === 0) console.log("No admin yet: run  npm run admin:create  (set ADMIN_EMAIL and ADMIN_PASSWORD first).");
  } catch (e) {
    const msg = String((e as Error).message || e);
    console.error("\nCould not connect.\n");
    if (/DNS resolution|SRV|ENOTFOUND|10051|unreachable/i.test(msg)) {
      console.error([
        "This is a network/DNS problem on THIS computer, not a code problem. In order of likelihood:",
        "  1. You are offline, or a VPN/firewall is blocking DNS. Open the Atlas hostname in a browser or run: nslookup -type=SRV _mongodb._tcp.<your-cluster-host>",
        "  2. Your DNS server cannot resolve mongodb+srv:// records. Switch Windows DNS to 8.8.8.8 / 1.1.1.1, or in Atlas choose Connect > Drivers > 'Standard connection string' (starts with mongodb://, no +srv) and use that as DATABASE_URL.",
        "  3. Atlas > Network Access does not include your current IP address (add it, or 0.0.0.0/0 temporarily to test).",
      ].join("\n"));
    } else if (/Authentication failed|auth/i.test(msg)) {
      console.error("Wrong database username or password in DATABASE_URL (URL-encode special characters in the password), or authSource is wrong (usually authSource=admin).");
    } else {
      console.error(msg);
    }
    process.exitCode = 1;
  }
}

main().finally(() => prisma.$disconnect());
