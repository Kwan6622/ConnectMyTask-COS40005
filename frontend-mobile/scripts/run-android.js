#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const net = require("node:net");

function commandExists(cmd) {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(checker, [cmd], { stdio: "ignore" });
  return result.status === 0;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function pickExpoPort() {
  const candidates = [8081, 8082, 8083, 8084, 8085];
  for (const port of candidates) {
    if (await isPortFree(port)) return String(port);
  }
  return "8081";
}

async function runExpo(args) {
  const port = await pickExpoPort();
  const result = spawnSync(
    "npx",
    ["expo", "start", "--port", port, ...args],
    { stdio: "inherit", shell: true }
  );
  process.exit(result.status ?? 1);
}

const hasAdb = commandExists("adb");

if (hasAdb) {
  runExpo(["--android", "--localhost"]);
} else {
  console.log("[connectmytask-mobile] Android SDK/adb not found. Starting Expo in LAN mode for Android device/QR usage.");
  runExpo(["--lan"]);
}
