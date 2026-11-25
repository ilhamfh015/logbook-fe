import { describe, expect, it } from "vitest";
import {
  canAccessAdminPage,
  canAccessReviewPage,
  canAccessTeamPage,
} from "@/lib/rolePermissions";

describe("rolePermissions", () => {
  it.each([
    [[], false],
    [["TALENT"], false],
    [["ATASAN"], true],
    [["ADMIN"], false],
    [["TALENT", "ATASAN"], true],
    [["TALENT", "ADMIN"], false],
    [["ATASAN", "ADMIN"], true],
    [["TALENT", "ATASAN", "ADMIN"], true],
  ])("menentukan akses Tim untuk roles %j", (roles, expected) => {
    expect(canAccessTeamPage(roles)).toBe(expected);
  });

  it.each([
    [[], false],
    [["TALENT"], false],
    [["ATASAN"], true],
    [["ADMIN"], true],
    [["TALENT", "ATASAN"], true],
    [["TALENT", "ADMIN"], true],
    [["ATASAN", "ADMIN"], true],
    [["TALENT", "ATASAN", "ADMIN"], true],
  ])("menentukan akses review untuk roles %j", (roles, expected) => {
    expect(canAccessReviewPage(roles)).toBe(expected);
  });

  it.each([
    [[], false],
    [["TALENT"], false],
    [["ATASAN"], false],
    [["ADMIN"], true],
    [["TALENT", "ADMIN"], true],
    [["ATASAN", "ADMIN"], true],
  ])("menentukan akses halaman admin untuk roles %j", (roles, expected) => {
    expect(canAccessAdminPage(roles)).toBe(expected);
  });

  it("menerima variasi huruf dan menangani roles kosong", () => {
    expect(canAccessTeamPage(["atasan"])).toBe(true);
    expect(canAccessReviewPage(["admin"])).toBe(true);
    expect(canAccessAdminPage(["admin"])).toBe(true);
    expect(canAccessTeamPage(null)).toBe(false);
    expect(canAccessTeamPage(undefined)).toBe(false);
    expect(canAccessReviewPage([])).toBe(false);
    expect(canAccessAdminPage(null)).toBe(false);
  });
});