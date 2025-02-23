// src/scripts/reddit1comment.ts
import { Page } from "@playwright/test";
import SitePage from "./pages/reddit.page.js";

export default async function (
  page: Page,
  args: {
    search: string;
    comment: string;
  }
): Promise<void> {
  try {
    const sitePage = new SitePage(page);
    // Step 1 - Launch Reddit
    await sitePage.goToStartPage();
    // Step 2 - Search for topic and click on 1st test result
    await sitePage.waitForNavigation();
    await sitePage.sleepRandom({multiplier: 2});
    await sitePage.search(args.search);
    await sitePage.findRandomThread();
    // Step 3 - 1st Comment on main thread
    await sitePage.addCommentToThread(args.comment);
  } catch (error) {
    console.error("redditCommentVote test error:", error);
  } finally {
    console.log("redditCommentVote test completed finally");
  }
}
