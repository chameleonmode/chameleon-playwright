import Reddit from "../page.js";
import ask from "../../../lib/ask.js";

export default async function (
  context: import('@playwright/test').BrowserContext,
  options: {
    search: string;
  }
) {
  const page = new Reddit(await context.newPage());
  // Step 1 - Launch Reddit
  await page.goToStartPage();
  // Step 2 - Search for topic and click on 1st test result
  await page.search(options.search);
  await page.findRandomThread();

  // Step 3 - 1st Comment on main thread
  const input = await page.PosttitleText();
  await page.addCommentToThread(await ask(input));
}
