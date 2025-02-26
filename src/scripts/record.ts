import { Browser } from "@playwright/test";

export default async function (browser: Browser) {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.pause();
}
