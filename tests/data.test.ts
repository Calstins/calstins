import { describe, expect, it } from "vitest";
import { groupByStage, isServicePublished } from "@/lib/data";
import { toPublicSettings } from "@/lib/settings";

describe("isServicePublished", () => {
  it("treats legacy rows (no published field) as live, and only explicit false as draft", () => {
    expect(isServicePublished({})).toBe(true);
    expect(isServicePublished({ published: null })).toBe(true);
    expect(isServicePublished({ published: true })).toBe(true);
    expect(isServicePublished({ published: false })).toBe(false);
  });
});

describe("groupByStage", () => {
  it("orders Start, Build, Grow, then advisory, and drops empty groups", () => {
    const items = [{ id: 1, stage: "GROW" }, { id: 2, stage: null }, { id: 3, stage: "START" }, { id: 4, stage: undefined }, { id: 5, stage: "bogus" }];
    const g = groupByStage(items);
    expect(g.map((x) => x.key)).toEqual(["START", "GROW", "ADVISORY"]);
    expect(g[2].items.map((i) => i.id)).toEqual([2, 4, 5]);
  });
  it("returns nothing for no items", () => expect(groupByStage([])).toEqual([]));
});

describe("toPublicSettings (registration number safety)", () => {
  it("hides the number unless it is marked verified", () => {
    expect(toPublicSettings({ registrationNumber: "RC 1", registrationVerified: false }).registrationNumber).toBeNull();
    expect(toPublicSettings({ registrationNumber: null, registrationVerified: true }).registrationNumber).toBeNull();
    expect(toPublicSettings({ registrationNumber: "RC 1234567", registrationVerified: true }).registrationNumber).toBe("RC 1234567");
  });
  it("never leaks the raw verification fields and falls back to existing site facts only", () => {
    const pub = toPublicSettings(null) as Record<string, unknown>;
    expect(pub).not.toHaveProperty("registrationVerified");
    expect(pub.companyName).toBe("Calstins Ltd");
    expect(pub.publicEmail).toBe("info@calstins.com");
    expect(pub.registrationNumber).toBeNull();
    expect(pub.storyPublished).toBe(false);
  });
});
