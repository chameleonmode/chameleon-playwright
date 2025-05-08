import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Pager from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Pager(context, opts, async (url) => {
    if (reddit.opts.args.search || url) await reddit.post.assert();

    const title = await reddit.post.title();
    const comments = await reddit.post.getComments(3);
    const audience = `reddit users reading ${reddit.page.url()}`;
    const { locator, text } = await reddit.post.getComment();

    // Step 1.5 - define the scenario

    await reddit.post.replyToComment(locator, async () => {
      const result = await reddit.ask({
        task: `create a reply to a reddit comment `,
        decorate: {
          system: "Your a reddit user replying to a comment",
          background: `the post title is ${title}, some of the comments on the post are ${comments.join(", ")}`,
          audience,
        },
        generate: {
          type: "reply",
          input: {
            type: "comment",
            data: text,
            reason: "this is the comment i want to reply to",
          },
          range: {
            min: 9,
            max: 54,
          },
          terms: reddit.opts.ai.generations.terms,
        },
      });
      return result[0].data;
    });
  });

  // Step 2 - Dance
  await player.play();
}
