import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import X from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
    // Step 1 - Launch X and search for the keyword
    const { x, player } = await X(context, opts);
  await x.searcho(x.opts.args.search)
  // Step 3 - Find the random tweet
  await player.start(async () => {
    const expecto = await x.findo(
      // Step 3 - Retweet the selected tweet
      async () => {
        await x.retweetTopTweet();
      },
      player.visited
    );

    return expecto.index;
  });
}
