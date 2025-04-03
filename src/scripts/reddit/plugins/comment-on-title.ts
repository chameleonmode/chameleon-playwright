import Reddit from "../page.js";
import { askAI } from "../../../lib/ask.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  opts: {
    search: string;
  }
) {
  // Step 1 - Launch Reddit
  const page = await Reddit(await context.newPage());

  // Step 2 - Search for topic and click on 1st test result
  await page.search(opts.search);
  await page.findRandomThread();

  // Step 3 - 1st Comment on main thread
  await page.addCommentToThread(
    await askAI({ input: await page.postTitleText(), feature: page.feature })
  );
}
