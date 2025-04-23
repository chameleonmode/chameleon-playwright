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
      async () => {
        // duo
        const title = await reddit.post.title();
        await reddit.post.addComment(() =>
          reddit.ai(`on a reddit post titled '${title}'`, { input: title, type: "comment" })
        );
      },
      visited
    );

    return expecto.index;
  });
}
