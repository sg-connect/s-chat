import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

const localEnv = ".env";
const hiddenEnv = ".env.deploy-hidden";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

if (existsSync(hiddenEnv)) {
  throw new Error(`${hiddenEnv} already exists; restore or remove it before deploying.`);
}

const hasLocalEnv = existsSync(localEnv);
if (hasLocalEnv) renameSync(localEnv, hiddenEnv);

try {
  run("npm", ["run", "build"]);
  if (!process.exitCode) run("npx", ["wrangler", "deploy"]);
} finally {
  if (hasLocalEnv && existsSync(hiddenEnv)) renameSync(hiddenEnv, localEnv);
}
