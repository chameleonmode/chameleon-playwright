import { BrowserContext } from "@playwright/test";
import { Options } from "../../defs.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, options, player } = await Reddit(context, opts);

  // Step 2 - Dance
  await player.start(async (ranno) => {
    const expecto = await reddit.findo(
      options.args.scope,
      async () => {
        const voters = await reddit.voters();
        await reddit.doVote(voters);
      },
      ranno
    );

    return expecto.found;
  });
}
