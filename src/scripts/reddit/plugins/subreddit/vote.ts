import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async () => {
    // Step 1.5 - Define
    if (!reddit.opts.args.search) {
      const banger = await reddit.post.joinConversation();
      reddit.bang("vote", banger);
    }
    await reddit.subreddit.voter();
  });

  // Step 3 - Play
  await player.play();
}
