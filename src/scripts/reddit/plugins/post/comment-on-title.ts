import Reddit from "../../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  opts: {
    search: string;
  }
) {
  // Step 1 - Launch Reddit
  const { reddit: page } = await Reddit(await context.newPage());

  // Step 2 - Search for topic and click on 1st test result
  await page.search(opts.search);
  await page.findRandoThread();

  // Step 3 - 1st Comment on main thread
  const title = await page.postTitleText();
  await page.addCommentToThread(
    await page.ai(`on a reddit post titled '${title}'`, { input: title, type: "comment" })
  );
}
