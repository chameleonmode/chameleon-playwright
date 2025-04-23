import { BrowserContext } from "@playwright/test";
import Reddit from "../../page.js";
import { Opts, Scope } from "../../../types.js";
import { sleepRandom } from "../../../../lib/utils.js";

export default async function (context: BrowserContext, opts: Partial<Opts> = {
      search: {
        term: "example",
        scope: "Posts",
      },
      settings: {
        variations: 3,
      },
    }) {
  // Step 1 - Launch Reddit
  const { reddit, options } = await Reddit(
    await context.newPage(),
    opts 
  );

  // Step 2 - Search for topic and click on 1st test result
  await reddit.search(options.search.term);

  // Step 3 - Check and join the subreddit if not already a member
  const threads = [];
  for (let i = 0; i < options.settings.variations; i++) {
    const thread = await reddit.findRandoThread(() => reddit.checkAndJoinSubreddit(), options.search.scope, threads);
    threads.push(thread);
    await reddit.nap();
    await reddit.page.goBack();
  }
}
