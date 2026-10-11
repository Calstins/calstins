import { describe, it, expect } from "vitest";
import { pick, pickNew, PROJECT_SHAPE } from "@/lib/legacy-crud";

describe("legacy crud allowlist", () => {
  it("drops id/createdAt/updatedAt and unknown fields", () => {
    const out = pick({ id: "1", createdAt: "x", updatedAt: "y", _count: {}, title: " A ", featured: true, order: "2" }, PROJECT_SHAPE);
    expect(out).toEqual({ title: "A", featured: true, order: 2 });
  });
  it("turns blank optional text into null and leaves absent fields alone", () => {
    expect(pick({ client: "  " }, PROJECT_SHAPE)).toEqual({ client: null });
  });
  it("rejects an emptied required field on update and a missing one on create", () => {
    expect(() => pick({ title: "" }, PROJECT_SHAPE, ["title"])).toThrow();
    expect(() => pickNew({}, PROJECT_SHAPE, ["title"])).toThrow();
  });
  it("rejects a non-numeric order", () => {
    expect(() => pick({ order: "abc" }, PROJECT_SHAPE)).toThrow();
  });
});
