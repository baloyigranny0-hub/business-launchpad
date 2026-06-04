import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const artifactsDir = path.join(root, "test_reports", "browser-qa");
const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:3000";
const sessionId = process.env.QA_SESSION_ID;

if (!sessionId) {
  throw new Error("QA_SESSION_ID is required.");
}

await fs.mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  recordVideo: {
    dir: artifactsDir,
    size: { width: 1440, height: 1000 },
  },
});

await context.addInitScript((session) => {
  localStorage.setItem("vula_session_id", session);
}, sessionId);

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

try {
  await page.goto(frontendUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.getByTestId("journey-regenerate-btn").waitFor({ timeout: 60000 });
  await page.screenshot({ path: path.join(artifactsDir, "01-journey.png"), fullPage: true });

  await page.getByTestId("nav-submission-desktop").click();
  await page.getByTestId("submission-canvas-problem").fill("Founders struggle to turn grant and incubator requirements into a clear evidence pack.");
  await page.getByTestId("submission-canvas-customer_segments").fill("Early-stage founders applying to grants, incubators, and prototype support programmes.");
  await page.getByTestId("submission-canvas-unique_value").fill("Foundry combines business coaching, AI drafting, and submission-readiness tracking in one mobile-first workspace.");
  await page.getByTestId("submission-stage-fit").fill("Problem interviews and evidence pack requirements have been mapped.");
  await page.getByTestId("submission-stage-prototype").fill("The web app is running locally and being prepared for Android packaging.");
  await page.screenshot({ path: path.join(artifactsDir, "02-submission-filled.png"), fullPage: true });

  await page.getByTestId("submission-save-vault").click();
  await page.getByTestId("submission-save-status").waitFor({ timeout: 30000 });
  const saveStatus = await page.getByTestId("submission-save-status").innerText();

  await page.getByTestId("nav-vault-desktop").click();
  await page.getByText("Submission Pack").waitFor({ timeout: 30000 });
  await page.screenshot({ path: path.join(artifactsDir, "03-vault.png"), fullPage: true });

  if (errors.length) {
    throw new Error(`Browser console/page errors: ${errors.join(" | ")}`);
  }

  await fs.writeFile(path.join(artifactsDir, "summary.json"), JSON.stringify({
    status: "pass",
    frontendUrl,
    sessionId,
    saveStatus,
    screenshots: ["01-journey.png", "02-submission-filled.png", "03-vault.png"],
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}

const files = await fs.readdir(artifactsDir);
const video = files.find((file) => file.endsWith(".webm"));
console.log(JSON.stringify({
  status: "pass",
  artifactsDir,
  video: video ? path.join(artifactsDir, video) : null,
}, null, 2));
