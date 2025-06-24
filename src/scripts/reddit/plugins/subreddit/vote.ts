import { BrowserContext } from "@playwright/test";
import { Options } from "../../configure.js";
import Reddit from "../../reddit.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit } = await Reddit(context, opts, async () => {
    // Step 1.5 - Define
    await reddit.subreddit.voter();
  });

  // Step 3 - Play
  await reddit.player.play();
}
