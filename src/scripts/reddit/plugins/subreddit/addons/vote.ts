import { BrowserContext } from "@playwright/test";
import { Options } from "../../../configure.js";
import Reddit from "../../../reddit.js";
import { Subreddit } from "../subreddit.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit } = await Reddit(context, opts, async () => {
    const subreddit = new Subreddit(reddit);
    // Step 1.5 - Define
    await subreddit.voter();
  });

  // Step 3 - Play
  await reddit.player.play();
}
