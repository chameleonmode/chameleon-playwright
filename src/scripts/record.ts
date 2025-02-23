import { Browser } from "@playwright/test";

export default async function (browser: Browser): Promise<void> {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.pause();
}
