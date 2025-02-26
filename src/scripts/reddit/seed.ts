// src/scripts/reddit1comment.ts
import { Browser } from "@playwright/test";
import Page from "../pages/reddit.page.js";

export default async function (
  browser: Browser,
  args: {
    searches: string[];
  }
) {
  const context = browser.contexts()[0];
  const page = new Page(await context.newPage());
  // Step 1 - Launch Reddit
  await page.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await page.findRandomThread();
}