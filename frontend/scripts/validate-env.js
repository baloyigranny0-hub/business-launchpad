const fs = require("fs");
const path = require("path");

loadDotEnv();

const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
const allowTempBackend = process.env.ALLOW_TEMP_BACKEND === "1";
const isBuild = process.env.npm_lifecycle_event === "build";

function fail(message) {
  console.error(`\n[env-check] ${message}\n`);
  process.exit(1);
}

if (process.env.NODE_ENV === "production" || process.env.CI || isBuild) {
  if (!backendUrl) {
    fail("REACT_APP_BACKEND_URL is required for production builds.");
  }

  if (!/^https:\/\//i.test(backendUrl)) {
    fail(`REACT_APP_BACKEND_URL must be HTTPS in production. Received: ${backendUrl}`);
  }

  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(backendUrl)) {
    fail(`REACT_APP_BACKEND_URL cannot point at a local machine in production. Received: ${backendUrl}`);
  }

  if (!allowTempBackend && /(trycloudflare\.com|loca\.lt)$/i.test(new URL(backendUrl).hostname)) {
    fail("REACT_APP_BACKEND_URL cannot use a temporary tunnel for production builds. Deploy the backend to a stable host, or set ALLOW_TEMP_BACKEND=1 only for a temporary preview.");
  }
}

console.log("[env-check] Frontend environment looks deployable.");

function loadDotEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
