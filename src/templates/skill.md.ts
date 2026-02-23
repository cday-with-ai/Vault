import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILL_CONTENT = `---
name: vault
description: Access credentials securely via macOS Keychain. Use when you need API keys, tokens, or other secrets at runtime.
---

# Vault — macOS Keychain Secret Manager

Vault stores secrets in the macOS Keychain (hardware-backed encryption via Secure Enclave). Use it for API keys, tokens, and credentials that need to be available non-interactively.

## CLI commands

- \`vault set <key> <value>\` — store or update a secret
- \`vault get <key>\` — print secret value to stdout (pipe-friendly)
- \`vault delete <key>\` — remove a secret
- \`vault list\` — list all stored key names

## Usage in Heartbeat tasks

In task frontmatter \`env:\` blocks, use the \`vault://\` prefix to resolve secrets from Vault:

\`\`\`yaml
env:
  ANTHROPIC_API_KEY: "vault://anthropic-api-key"
\`\`\`

## Inline usage

To use a secret inline in a shell command:

\`\`\`bash
export API_KEY=$(vault get my-api-key)
\`\`\`

## Notes

- Secrets are stored in the default macOS Keychain under account "vault"
- All operations are non-interactive (no biometric prompts)
- The \`vault get\` command outputs only the value (no newline) for clean piping
`;

export function installSkill(): void {
  const skillDir = join(homedir(), ".claude", "skills", "vault");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), SKILL_CONTENT, "utf-8");
}
