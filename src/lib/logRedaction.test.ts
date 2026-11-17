import { describe, expect, it } from "vitest";
import { redactValue, stripQuery } from "@/lib/logRedaction";

describe("log redaction", () => {
  it("hides sensitive keys regardless of casing and key position", () => {
    expect(redactValue({ Password: "a", authToken: "b", kataSandiBaru: "c" })).toEqual({
      Password: "[disembunyikan]",
      authToken: "[disembunyikan]",
      kataSandiBaru: "[disembunyikan]",
    });
  });

  it("masks email values", () => {
    expect(redactValue({ contact: "rani@contoh.id" })).toEqual({ contact: "r***@contoh.id" });
  });

  it("truncates strings longer than 500 characters", () => {
    expect(redactValue("x".repeat(501))).toBe(`${"x".repeat(500)}…`);
  });

  it("replaces circular references without throwing", () => {
    const circular: { child?: unknown } = {};
    circular.child = circular;

    expect(() => redactValue(circular)).not.toThrow();
    expect(redactValue(circular)).toEqual({ child: "[melingkar]" });
  });

  it("limits nested object depth and array length", () => {
    expect(redactValue({ a: { b: { c: { d: { e: { f: true } } } } } })).toEqual({
      a: { b: { c: { d: { e: "[terlalu dalam]" } } } },
    });
    expect(redactValue(Array.from({ length: 21 }, (_, index) => index))).toHaveLength(20);
  });

  it("removes query strings and fragments", () => {
    expect(stripQuery("/logs?a=1#x")).toBe("/logs");
  });
});