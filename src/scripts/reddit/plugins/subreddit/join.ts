import { BrowserContext } from "@playwright/test";
import { Options } from "../../defs.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, options, player } = await Reddit(await context.newPage(), opts);

  // Step 2 - start a dance
  player.start(async (ranno) => {
    const expecto = await reddit.findo(
      options.args.scope,
      options.args.scope === "People"
        ? () => reddit.checkAndFollowUser()
        : () => reddit.checkAndJoinSubreddit(),
      ranno
    );

    return expecto.found;
  });
}
