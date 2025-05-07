import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async (url) => {
    // find post content from a comment
    if (reddit.opts.args.search || url) await reddit.post.assert();

    // Get the post title and comment text
    const titled = await reddit.post.title();
    const { text: comment } = await reddit.post.getComment();

    // Check if the user is on the right page
    if (reddit.opts.args.scope === "Communities") await reddit.page.goBack();
    else await reddit.post.visitCommunity();

    // Check if the user is on the right page
    await reddit.subreddit.canPost();

    // Create a new post
    await reddit.poster(async () => {
      // Ask ai to create a new post title and content
      // const title = await reddit.ask(
      //   `Based on this '${comment}' comment, on a post titled ${titled}, through a search term of ${reddit.opts.args.search}`,
      //   { input: reddit.searched[reddit.searched.length - 1], type: "title", range: "3-9" }
      // );
      const title = await reddit.ask(
        `Generate a title for a reddit post based on this '${comment}' comment, on a post titled ${titled}, through a search term of ${reddit.opts.args.search}`,
        {
          input: [
            {
              type: "title",
              data: titled,
              reason: "reddit post title",
            },
            {
              type: "comment",
              data: comment,
              reason: "comment on the reddit post",
            },
          ],
        },
        {
          background: "You are a reddit user who is browsing the site and wants to create a new post.",
        }
      );
      return {
        title,
        content: await reddit.ask(
          `Generate a reddit post content based on this '${comment}' comment, on a post titled ${titled}, through a search term of ${reddit.opts.args.search}`,
          {
            input: [
              {
                type: "title",
                data: title,
                reason: "reddit post title",
              },
              {
                type: "comment",
                data: comment,
                reason: "comment on the reddit post",
              },
            ],
          },
          {
            background: "You are a reddit user who is browsing the site and wants to create a new post.",
          }
        ),
      };
    });
    await reddit.nap();
  });

  // Step 3 - Play
  await player.play();
}
