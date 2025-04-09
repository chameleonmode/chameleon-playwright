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

  // Step 3 - Find a available comment
  const { locator, text } = await page.getComment();
  const title = await page.postTitleText();

  // Step 4 - Reply to the comment
  await page.replyToComment(locator, await askAI({ input: `this '${text}' comment, on a post titled ${title}`, feature: page.feature, ai: "gpt" }));
}
