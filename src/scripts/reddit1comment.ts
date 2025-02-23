// src/scripts/reddit1comment.ts
import { Browser } from "@playwright/test";
import Page from "./pages/reddit.page.js";

export default async function (
  browser: Browser,
  args: {
    search: string;
    comment: string;
  }
): Promise<void> {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  
  const sitePage = new Page(page);
  // Step 1 - Launch Reddit
  await sitePage.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await sitePage.waitForNavigation();
  await sitePage.sleepRandom({ multiplier: 2 });
  await sitePage.search(args.search);
  await sitePage.findRandomThread();
  // Step 3 - 1st Comment on main thread
  await sitePage.addCommentToThread(args.comment);
}
