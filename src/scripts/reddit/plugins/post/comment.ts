import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (ctx: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit } = await Reddit(ctx, opts, async (url) => {
    // Step 1.5 - define the scenario
    await reddit.post.assert();

    const title = await reddit.post.title();
    const b64 = await reddit.screenshot();
    const comments = await reddit.post.getComments(3);
    await reddit.post.addComment(async () => {
      const result = await reddit.ask({
        task: `respond to this reddit post with a comment`,
        image:{
          des: "screenshot of the post",
          b64,
        },
        generations: {
          sys: "Your commenting on a post",
          type: "comment",
          context: `some of the comments on the post at ${reddit.page.url()} are: \n${comments.join(
            "\n- "
          )}`,
          input: {
            type: "title",
            data: title,
            reason: "this is the title of the post i want to comment on",
          },
          range: { min: 9, max: 54 },
        },
      });
      return result[0].data;
    });
  });

  // Step 2 - Run
  await reddit.player.play();
}
