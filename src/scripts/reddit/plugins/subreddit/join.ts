import Reddit from "../../page.js";
import { Opts } from "../../../types.js";

export default async function (context: import("@playwright/test").BrowserContext, opts: Partial<Opts>) {
  // Step 1 - Launch Reddit
  const { reddit, options } = await Reddit(await context.newPage(), opts);

  // Step 2 - Search for topic and click on 1st test result
  await reddit.search(options.search.term);

  // Step 3 - Check and join the subreddit if not already a member
  await Promise.all(
    [...Array(options.settings.variations)].map(async () => {
      await reddit.findRandoThread(() => reddit.checkAndJoinSubreddit(), options.search.scope);
    })
  );
}
