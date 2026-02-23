import { execFileSync } from "node:child_process";

const SECURITY = "/usr/bin/security";
const ACCOUNT = "vault";
const TIMEOUT = 5_000;

export class VaultError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "VaultError";
  }
}

export function vaultGet(key: string): string {
  try {
    return execFileSync(
      SECURITY,
      ["find-generic-password", "-a", ACCOUNT, "-s", key, "-w"],
      { encoding: "utf-8", timeout: TIMEOUT }
    ).trim();
  } catch (err) {
    throw new VaultError(
      `Failed to get secret "${key}": not found or keychain locked`,
      err as Error
    );
  }
}

export function vaultSet(key: string, value: string): void {
  try {
    execFileSync(
      SECURITY,
      [
        "add-generic-password",
        "-a",
        ACCOUNT,
        "-s",
        key,
        "-w",
        value,
        "-U",
      ],
      { encoding: "utf-8", timeout: TIMEOUT }
    );
  } catch (err) {
    throw new VaultError(
      `Failed to set secret "${key}"`,
      err as Error
    );
  }
}

export function vaultDelete(key: string): void {
  try {
    execFileSync(
      SECURITY,
      ["delete-generic-password", "-a", ACCOUNT, "-s", key],
      { encoding: "utf-8", timeout: TIMEOUT }
    );
  } catch (err) {
    throw new VaultError(
      `Failed to delete secret "${key}": not found`,
      err as Error
    );
  }
}

export function vaultList(): string[] {
  try {
    const output = execFileSync(SECURITY, ["dump-keychain"], {
      encoding: "utf-8",
      timeout: TIMEOUT,
    });

    const keys: string[] = [];
    const lines = output.split("\n");

    let inVaultEntry = false;
    for (const line of lines) {
      const acctMatch = line.match(/^\s*"acct"<blob>="(.+)"$/);
      if (acctMatch) {
        inVaultEntry = acctMatch[1] === ACCOUNT;
        continue;
      }

      if (inVaultEntry) {
        const svcMatch = line.match(/^\s*"svce"<blob>="(.+)"$/);
        if (svcMatch) {
          keys.push(svcMatch[1]);
          inVaultEntry = false;
        }
      }
    }

    return keys.sort();
  } catch (err) {
    throw new VaultError(
      "Failed to list secrets: keychain locked or inaccessible",
      err as Error
    );
  }
}
