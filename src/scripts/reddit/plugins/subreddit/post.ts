import Reddit from "../../page.js";
import { rando } from "../../../../lib/utils.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    search: string;
  }
) {
  // Step 1 - Launch Reddit
  const page = await Reddit(await context.newPage());

  // Step 2 - Search for topic
  await page.search(options.search);
  await page.findRandoThread(rando() ? () => page.checkAndJoinSubreddit() : undefined);

  // Step 3 - find post content from a comment
  const { text, post } = await page.findComment(0);
  await page.visitSubredditCommunity();

  // Step 4 - Ask ai to create a new post title and content
  const title = await page.ai(
    `Based on this '${text}' comment, on a post titled ${post}, through a search keyword of ${options.search}`,
    { input: options.search, type: "title", range: "3-9" }
  );
  const content = await page.ai(
    `for a new post titled ${title}, to this comment'${text}' through a search keyword of ${options.search}`,
    { input: title, type: "post" }
  );

  // Step 5 - Create a new post
  await page.createPostSubreddit(title, content);
}
