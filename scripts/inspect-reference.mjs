import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto("https://nickho-motorsports.nl/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(6000);
  await mkdir("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/reference-hero.png" });
  const audit = await page.evaluate(() => ({
    headings: [...document.querySelectorAll("h1,h2,h3")].map((el) => ({
      text: el.textContent,
      font: getComputedStyle(el).fontFamily,
      size: getComputedStyle(el).fontSize,
    })),
    links: [...document.querySelectorAll("a")]
      .map((el) => ({ text: el.textContent, href: el.getAttribute("href") }))
      .filter((item) => item.href?.startsWith("#")),
    canvasCount: document.querySelectorAll("canvas").length,
    scripts: [...document.scripts].map((script) => script.src).filter(Boolean),
  }));
  await writeFile(
    "artifacts/reference-audit.json",
    JSON.stringify(audit, null, 2),
  );
  console.log(
    JSON.stringify({
      headingFonts: [...new Set(audit.headings.map((h) => h.font))],
      canvasCount: audit.canvasCount,
      headingCount: audit.headings.length,
    }),
  );
} finally {
  await browser.close();
}
