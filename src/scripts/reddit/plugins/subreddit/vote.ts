import { BrowserContext } from "@playwright/test";
import { rando } from "../../../../lib/utils.js";
import Reddit from "../../page.js";
import { defaults, Args, Settings } from "../../defs.js";

export default async function (
  context: BrowserContext,
  opts: { args: Args; settings: Settings }
) {
  // Step 1 - Init
  const { reddit, options, player } = await Reddit(await context.newPage(), opts);

  // Step 2 - start a dance
  player.start(async (ranno) => {
    // Step 3 - Find a subreddit
    const expecto = await reddit.findo(
      options.args.scope,
      async () => {
        const voters = await reddit.voters();
        await reddit.doVote(voters);
      },
      ranno
    );

    return expecto.foundo;
  });
}
