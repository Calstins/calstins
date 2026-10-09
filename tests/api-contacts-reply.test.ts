import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./helpers/fakePrisma")).fake }));
const mail = vi.hoisted(() => ({ configured: true, send: vi.fn() }));
vi.mock("@/lib/mailer", async (orig) => ({ ...(await orig<typeof import("@/lib/mailer")>()), isMailConfigured: () => mail.configured, sendMail: mail.send }));

import * as byId from "@/app/api/contacts/[id]/route";
import * as reply from "@/app/api/contacts/[id]/reply/route";
import { toPublicSettings, DEFAULT_CONTACT_PROMISES } from "@/lib/settings";
import { resetAll, tables } from "./helpers/fakePrisma";
import { adminCookie, ctx, req } from "./helpers/req";

let cookie: string;
let id: string;
beforeEach(async () => {
  resetAll(); cookie = await adminCookie();
  mail.configured = true; mail.send.mockReset().mockResolvedValue(undefined);
  id = tables.contact.seed({ name: "Ada", email: "ada@example.com", message: "I need a website <b>fast</b>", read: false, replied: false }).id;
});
const post = (body: unknown, anon = false) => reply.POST(req(`/api/contacts/${id}/reply`, { method: "POST", cookie: anon ? undefined : cookie, body }), ctx(id));

describe("contact reply", () => {
  it("requires admin", async () => {
    expect((await post({ subject: "Hello", message: "Thanks for writing" }, true)).status).toBe(401);
    expect(mail.send).not.toHaveBeenCalled();
  });
  it("validates subject and message", async () => {
    const res = await post({ subject: "", message: "" });
    expect(res.status).toBe(400);
    expect(Object.keys((await res.json()).fields)).toEqual(expect.arrayContaining(["subject", "message"]));
  });
  it("emails the enquirer, escapes HTML, records the reply and marks replied", async () => {
    const res = await post({ subject: "Re: your enquiry", message: "Happy to help <script>x</script>" });
    expect(res.status).toBe(200);
    const sent = mail.send.mock.calls[0][0];
    expect(sent.to).toBe("ada@example.com");
    expect(sent.html).not.toContain("<script>");
    expect(sent.html).toContain("&lt;script&gt;");
    const row = tables.contact.rows.find((r) => r.id === id)!;
    expect(row.replied).toBe(true);
    expect(row.replies).toHaveLength(1);
    expect(row.replies[0]).toMatchObject({ subject: "Re: your enquiry", emailSent: true });
  });
  it("does not record a reply when email is not configured or the provider fails", async () => {
    mail.configured = false;
    expect((await post({ subject: "Hello there", message: "Thanks for writing" })).status).toBe(503);
    mail.configured = true; mail.send.mockRejectedValue(new Error("smtp down"));
    expect((await post({ subject: "Hello there", message: "Thanks for writing" })).status).toBe(502);
    const row = tables.contact.rows.find((r) => r.id === id)!;
    expect(row.replied).toBe(false);
    expect(row.replies ?? []).toHaveLength(0);
  });
  it("404s for an unknown enquiry", async () => {
    const other = "b".repeat(24);
    expect((await reply.POST(req(`/api/contacts/${other}/reply`, { method: "POST", cookie, body: { subject: "Hello", message: "Thanks!" } }), ctx(other))).status).toBe(404);
  });
});

describe("contact PUT is whitelisted", () => {
  it("only accepts read/replied and rejects anything else", async () => {
    const ok = await byId.PUT(req(`/api/contacts/${id}`, { method: "PUT", cookie, body: { read: true } }), ctx(id));
    expect(ok.status).toBe(200);
    const bad = await byId.PUT(req(`/api/contacts/${id}`, { method: "PUT", cookie, body: { email: "attacker@example.com", message: "tampered" } }), ctx(id));
    expect(bad.status).toBe(400);
    expect(tables.contact.rows.find((r) => r.id === id)!.email).toBe("ada@example.com");
  });
});

describe("public settings gating", () => {
  const row = { phone: "+234 800 000 0000", whatsapp: "+234 800 000 0000", linkedin: "https://x.com/y", contactPromises: [] as string[] };
  it("hides placeholder phone/WhatsApp/socials until the owner turns them on", () => {
    const hidden = toPublicSettings({ ...row, showContactDetails: false } as never);
    expect([hidden.phone, hidden.whatsapp, hidden.linkedin]).toEqual([null, null, null]);
    expect(toPublicSettings({ ...row } as never).phone).toBeNull();
    expect(toPublicSettings({ ...row, showContactDetails: true } as never).phone).toBe("+234 800 000 0000");
  });
  it("falls back to the confirmed default promises, and uses edited ones when present", () => {
    expect(toPublicSettings(null).contactPromises).toEqual(DEFAULT_CONTACT_PROMISES);
    expect(toPublicSettings({ contactPromises: ["Reply in 1 day"] } as never).contactPromises).toEqual(["Reply in 1 day"]);
  });
});
