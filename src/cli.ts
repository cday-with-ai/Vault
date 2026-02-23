#!/usr/bin/env node

import { Command } from "commander";
import { vaultGet, vaultSet, vaultDelete, vaultList, VaultError } from "./keychain.js";
import { installSkill } from "./templates/skill.md.js";

const program = new Command();

program
  .name("vault")
  .description("macOS Keychain secret manager")
  .version("0.1.0");

program
  .command("set <key> <value>")
  .description("Store or update a secret")
  .action((key: string, value: string) => {
    try {
      vaultSet(key, value);
      console.log(`Stored: ${key}`);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command("get <key>")
  .description("Print a secret value to stdout")
  .action((key: string) => {
    try {
      const value = vaultGet(key);
      process.stdout.write(value);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command("delete <key>")
  .description("Remove a secret")
  .action((key: string) => {
    try {
      vaultDelete(key);
      console.log(`Deleted: ${key}`);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command("list")
  .description("List all stored key names")
  .action(() => {
    try {
      const keys = vaultList();
      if (keys.length === 0) {
        console.log("No secrets stored.");
      } else {
        for (const key of keys) {
          console.log(key);
        }
      }
    } catch (err) {
      handleError(err);
    }
  });

program
  .command("init")
  .description("Install Claude Code skill to ~/.claude/skills/vault/")
  .action(() => {
    try {
      installSkill();
      console.log("Installed skill to ~/.claude/skills/vault/SKILL.md");
    } catch (err) {
      handleError(err);
    }
  });

function handleError(err: unknown): never {
  if (err instanceof VaultError) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error(`Error: ${(err as Error).message}`);
  }
  process.exit(1);
}

program.parse();
