/** Turns a raw database/Prisma error into a short, safe description for the admin UI. */
export type DbProblem = { kind: "network" | "auth" | "timeout" | "unknown"; title: string; hint: string };

export function describeDbError(e: unknown): DbProblem {
  const msg = String((e as { message?: string } | null)?.message ?? e ?? "");
  if (/DNS resolution|ENOTFOUND|SRV|10051|unreachable|EAI_AGAIN|getaddrinfo/i.test(msg)) {
    return { kind: "network", title: "No connection to the database", hint: "This computer cannot reach MongoDB right now. Check your internet connection, any VPN or firewall, and the DATABASE_URL host. If it keeps happening, use the standard (mongodb://) connection string from Atlas." };
  }
  if (/Server selection timeout|No available servers|timed out|timeout|ECONNREFUSED|ETIMEDOUT/i.test(msg)) {
    return { kind: "timeout", title: "The database did not respond", hint: "The connection timed out. You may be offline, or your IP address is not on the Atlas Network Access list." };
  }
  if (/Authentication failed|auth|credentials/i.test(msg)) {
    return { kind: "auth", title: "The database rejected the login", hint: "Check the username and password in DATABASE_URL (URL-encode special characters) and authSource=admin." };
  }
  return { kind: "unknown", title: "The database request failed", hint: "Run npm run db:check in the project folder to see the exact problem." };
}
