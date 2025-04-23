import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, options, player } = await Reddit(context, opts);

  // Step 2 - Dance
  await player.start(async (visited) => {
    const expecto = await reddit.findo(
      options.args.scope,
      // Step 3 - Moves
      async () => {
        await reddit.voter();
      },
      visited
    );

    return expecto.index;
  });
}
