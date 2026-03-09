import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const codexPackageDirectory = path.join(
  projectRoot,
  "node_modules",
  "@react-grab",
  "codex",
);
const sdkVendorDirectory = path.join(
  projectRoot,
  "node_modules",
  "@openai",
  "codex-sdk",
  "vendor",
);
const codexVendorDirectory = path.join(codexPackageDirectory, "vendor");
const isStrictMode = process.argv.includes("--strict");

function fail(message) {
  const formattedMessage = `[react-grab-codex] ${message}`;

  if (isStrictMode) {
    console.error(formattedMessage);
    process.exit(1);
  }

  console.warn(formattedMessage);
  process.exit(0);
}

function pathExists(targetPath) {
  try {
    fs.lstatSync(targetPath);
    return true;
  } catch {
    return false;
  }
}

function ensureGlobalCodexCommand() {
  if (!isStrictMode) {
    return;
  }

  const commandCheck = spawnSync("codex", ["--version"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });

  if (commandCheck.error?.code === "ENOENT") {
    fail(
      "Missing global `codex` command. Install it with `npm i -g @openai/codex` and restart your terminal before running `npm run dev`.",
    );
  }

  if (commandCheck.error) {
    fail(
      `Could not execute the global \`codex\` command: ${commandCheck.error.message}`,
    );
  }

  if (commandCheck.status !== 0) {
    const errorOutput = commandCheck.stderr?.trim() || commandCheck.stdout?.trim();

    fail(
      `The global \`codex\` command is available but failed to run.${errorOutput ? ` Output: ${errorOutput}` : ""}`,
    );
  }
}

function ensureVendorLink() {
  if (!pathExists(codexPackageDirectory)) {
    fail(
      "Missing `@react-grab/codex` package. Run `npm install` before starting the development server.",
    );
  }

  if (!pathExists(sdkVendorDirectory)) {
    fail(
      "Missing `@openai/codex-sdk/vendor`. Reinstall dependencies and verify `@react-grab/codex` is installed correctly.",
    );
  }

  if (pathExists(codexVendorDirectory)) {
    try {
      const existingStat = fs.lstatSync(codexVendorDirectory);

      if (!existingStat.isSymbolicLink()) {
        fail(
          "`node_modules/@react-grab/codex/vendor` already exists and is not a symlink. Remove it and run `npm install` again.",
        );
      }

      const resolvedVendorDirectory = fs.realpathSync(codexVendorDirectory);
      const resolvedSdkVendorDirectory = fs.realpathSync(sdkVendorDirectory);

      if (resolvedVendorDirectory === resolvedSdkVendorDirectory) {
        return;
      }

      fs.rmSync(codexVendorDirectory, { force: true, recursive: true });
    } catch (error) {
      fail(
        `Could not verify the React Grab Codex vendor link: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const relativeVendorTarget = path.relative(
    codexPackageDirectory,
    sdkVendorDirectory,
  );
  const symlinkType = process.platform === "win32" ? "junction" : "dir";

  try {
    fs.symlinkSync(relativeVendorTarget, codexVendorDirectory, symlinkType);
  } catch (error) {
    fail(
      `Could not create the React Grab Codex vendor link: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

ensureVendorLink();
ensureGlobalCodexCommand();
