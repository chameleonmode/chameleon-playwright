import { BrowserContext } from "@playwright/test";
import { configure, Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Partial<Options>) {
  // Step 0 - Setup
  // setup options
  const options = configure(opts);
  options.settings.start.iterations.min = Math.max(
    options.settings.start.rando.min,
    options.settings.start.iterations.min
  );
  options.settings.start.iterations.max = Math.max(
    options.settings.start.rando.max,
    options.settings.start.iterations.max
  );
  // Step 1 - Init
  const { reddit } = await Reddit(context, options, async (_) => {
    await reddit.subreddit.joiner();
  });

  // Step 3 - Play
  await reddit.player.play();
}
