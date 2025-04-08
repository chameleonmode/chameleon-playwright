import X from "../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  opts: {
    search: string;
  }
) {
  // Step 1 - Launch X
  const page = await X(await context.newPage());

  // Step 2 - Search for topic.
  await page.search(opts.search);

  // Step 3 - Retweet the top most relevant post from search.
  await page.retweetTopTweet();
}