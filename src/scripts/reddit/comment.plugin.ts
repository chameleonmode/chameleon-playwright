import { Browser } from "@playwright/test";
import { RedditPage } from "./page.js";

export default async function (
  browser: Browser,
  options: {
    search: string;
  },
  air: (input: string | undefined) => Promise<string>,
) {
  const page = new RedditPage(await browser.contexts()[0].newPage());
  // Step 1 - Launch Reddit
  await page.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await page.waitForNavigation();
  await page.search(options.search);
  await page.findRandomThread();

  // Step 3 - 1st Comment on main thread
  await page.addCommentToThread(await air(await page.PosttitleText()));
}
