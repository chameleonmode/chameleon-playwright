import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async (url) => {
    if (reddit.opts.args.search || url) await reddit.post.assert();

    const title = await reddit.post.title();
    const { locator, text } = await reddit.post.getComment();

    await reddit.post.replyToComment(locator, () =>
      reddit.ask(
        `create a reply to a reddit comment with the text '${text}'`,
        {
          input: [
            {
              type: "title",
              data: title,
              reason: "redit post title",
            },
            {
              type: "comment",
              data: text,
              reason: "comment on the reddit post",
            },
          ],
        },
        {
          background: "You are a reddit user who is browsing the site and wants to reply to a comment.",
        }
      )
    );
  });

  // Step 2 - Dance
  await player.play();
}
