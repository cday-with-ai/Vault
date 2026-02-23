import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import { vaultGet, vaultSet, vaultDelete, vaultList, VaultError } from "../src/keychain.js";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vaultGet", () => {
  it("returns trimmed secret value", () => {
    mockExecFileSync.mockReturnValue("my-secret-value\n");
    const result = vaultGet("api-key");
    expect(result).toBe("my-secret-value");
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "/usr/bin/security",
      ["find-generic-password", "-a", "vault", "-s", "api-key", "-w"],
      { encoding: "utf-8", timeout: 5000 }
    );
  });

  it("throws VaultError when key not found", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain.");
    });
    expect(() => vaultGet("missing")).toThrow(VaultError);
    expect(() => vaultGet("missing")).toThrow(/not found/);
  });
});

describe("vaultSet", () => {
  it("calls security with correct args including -U flag", () => {
    mockExecFileSync.mockReturnValue("");
    vaultSet("api-key", "secret123");
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "/usr/bin/security",
      ["add-generic-password", "-a", "vault", "-s", "api-key", "-w", "secret123", "-U"],
      { encoding: "utf-8", timeout: 5000 }
    );
  });

  it("throws VaultError on failure", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("keychain locked");
    });
    expect(() => vaultSet("k", "v")).toThrow(VaultError);
  });
});

describe("vaultDelete", () => {
  it("calls security delete-generic-password", () => {
    mockExecFileSync.mockReturnValue("");
    vaultDelete("api-key");
    expect(mockExecFileSync).toHaveBeenCalledWith(
      "/usr/bin/security",
      ["delete-generic-password", "-a", "vault", "-s", "api-key"],
      { encoding: "utf-8", timeout: 5000 }
    );
  });

  it("throws VaultError when key not found", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("not found");
    });
    expect(() => vaultDelete("missing")).toThrow(VaultError);
  });
});

describe("vaultList", () => {
  it("parses dump-keychain output for vault entries", () => {
    mockExecFileSync.mockReturnValue(
      [
        'keychain: "/Users/test/Library/Keychains/login.keychain-db"',
        "class: genp",
        '    "acct"<blob>="vault"',
        '    "svce"<blob>="anthropic-api-key"',
        "class: genp",
        '    "acct"<blob>="vault"',
        '    "svce"<blob>="openai-api-key"',
        "class: genp",
        '    "acct"<blob>="other-app"',
        '    "svce"<blob>="unrelated-key"',
      ].join("\n")
    );

    const keys = vaultList();
    expect(keys).toEqual(["anthropic-api-key", "openai-api-key"]);
  });

  it("returns empty array when no vault entries", () => {
    mockExecFileSync.mockReturnValue(
      [
        'keychain: "/Users/test/Library/Keychains/login.keychain-db"',
        "class: genp",
        '    "acct"<blob>="other-app"',
        '    "svce"<blob>="some-key"',
      ].join("\n")
    );

    const keys = vaultList();
    expect(keys).toEqual([]);
  });

  it("throws VaultError on failure", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("keychain locked");
    });
    expect(() => vaultList()).toThrow(VaultError);
  });
});
