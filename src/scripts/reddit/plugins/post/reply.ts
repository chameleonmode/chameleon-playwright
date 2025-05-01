import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async (url) => {
    if(reddit.opts.args.search || url)  await reddit.post.assert();

    const title = await reddit.post.title();
    const { locator, text } = await reddit.post.getComment();

    await reddit.post.replyToComment(locator, () =>
      reddit.ai(`on a a reddit post titled '${title}'`, { input: text, type: "reply" })
    );
  });

  // Step 2 - Dance
  await player.play();
}
