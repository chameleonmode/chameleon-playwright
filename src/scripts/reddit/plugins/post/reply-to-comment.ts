import Reddit from "../../page.js";

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
  await page.findRandoThread();

  // Step 3 - Find a available comment
  const { locator, text } = await page.findComment();
  const title = await page.postTitleText();

  // Step 4 - Reply to the comment
  //`to this '${text}' comment, on a post titled ${title}`
  await page.replyToComment(
    locator,
    await page.ai(`on a a reddit post titled '${title}'`, { input: text, type: "reply" })
  );
}
// 