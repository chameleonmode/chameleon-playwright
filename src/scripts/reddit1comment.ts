// src/scripts/reddit1comment.ts
import { Browser } from "@playwright/test";
import Page from "./pages/reddit.page.js";
import { sleepRandom } from "../lib/utils.js";

export default async function (
  browser: Browser,
  args: {
    search: string;
    comment: string;
  }
) {
  const context = browser.contexts()[0];
  const page = new Page(await context.newPage());
  // Step 1 - Launch Reddit
  await page.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await page.waitForNavigation();
  await sleepRandom({ multiplier: 2 });
  await page.search(args.search);
  await page.findRandomThread();
  // Step 3 - 1st Comment on main thread
  await page.addCommentToThread(args.comment);
}
