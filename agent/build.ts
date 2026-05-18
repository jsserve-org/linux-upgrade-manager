#!/usr/bin/env bun
/**
 * Cross-compile the agent into standalone Linux binaries.
 * Output: dist/lum-agent-linux-x64, dist/lum-agent-linux-arm64
 */
import { mkdir } from "node:fs/promises";
import { $ } from "bun";

const targets: { target: string; out: string }[] = [
  { target: "bun-linux-x64", out: "dist/lum-agent-linux-x64" },
  { target: "bun-linux-arm64", out: "dist/lum-agent-linux-arm64" },
];

await mkdir("dist", { recursive: true });

for (const { target, out } of targets) {
  console.log(`\n→ building ${out} (${target})`);
  await $`bun build ./agent.ts --compile --minify --sourcemap --target=${target} --outfile ${out}`;
}
console.log("\n✓ binaries in ./dist");
