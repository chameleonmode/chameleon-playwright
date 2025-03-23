import { RedditPage } from "../page.js";
import ask from "../../../lib/ask.js";

export default async function (
  browser: import('@playwright/test').Browser,
  options: {
    search: string;
  }
) {
  const page = new RedditPage(await browser.contexts()[0].newPage());
  // Step 1 - Launch Reddit
  await page.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await page.waitForNavigation();
  await page.search(options.search);
  await page.findRandomThread();

  // Step 3 - 1st Comment on main thread
  const input = await page.PosttitleText();
  await page.addCommentToThread(await ask(input));
}
