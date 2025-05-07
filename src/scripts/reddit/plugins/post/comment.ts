import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async (url) => {
    if (reddit.opts.args.search || url) await reddit.post.assert();

    const title = await reddit.post.title();

    await reddit.post.addComment(() =>
      reddit.ask(
        `create a comment on on a reddit post titled '${title}'`,
        {
          input: [
            {
              type: "title",
              data: title,
              reason: "found while browsing reddit",
            },
          ],
        },
        {
          background: "You are a reddit user who is browsing the site and wants to comment on a post.",
        }
      )
    );
  });

  // Step 2 - Dance
  await player.play();
}
