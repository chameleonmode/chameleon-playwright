import Reddit from "../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    search: string;
    commentTitle: string;
    commentText: string;
  }
) {
  // Step 1 - Launch Reddit
  const page = await Reddit(await context.newPage());

  // Step 2 - Search for topic and click on 1st test result
  await page.search(options.search);

  // Step 3 - Find subreddit
  await page.findSubreddit();

  // Step 4 - Create post on subreddit
  await page.createPostSubreddit(options.commentTitle, options.commentText);
}
