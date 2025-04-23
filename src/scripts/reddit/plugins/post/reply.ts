import { BrowserContext } from "@playwright/test";
import { Options } from "../../defs.js";
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
        const { locator, text } = await reddit.findComment();
        const title = await reddit.postTitleText();

        // Step 4 - Reply to the comment
        //`to this '${text}' comment, on a post titled ${title}`
        await reddit.replyToComment(locator, () =>
          reddit.ai(`on a a reddit post titled '${title}'`, { input: text, type: "reply" })
        );
      },
      visited
    );

    return expecto.index;
  });
}
