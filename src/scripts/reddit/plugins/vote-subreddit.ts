import Reddit from "../page.js";
export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    search: string;
  }
) {
  // Step 1 - Launch Reddit
  const page = await Reddit(await context.newPage());

  // Step 2 - Search for topic and click on 1st test result
  await page.search(options.search);
  await page.findRandoSubreddit();

  // Step 3 - Upvote/down vote
  await page.doVote();
}
