import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts);

  const onRetry = async () => {
    await reddit.nap();
    while (!reddit.page.url().startsWith("https://www.reddit.com/search/")) {
      await reddit.page.goBack();
      await reddit.nap();
    }
  };
  // Step 2 - Dance
  await player.start(
    async () => {
      const expecto = await reddit.findo(
        // Step 3 - Moves
        async () => {
          // find post content from a comment
          await reddit.post.assert();

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
            const title = await reddit.ai(
              `Based on this '${comment}' comment, on a post titled ${titled}, through a search term of ${reddit.opts.args.search}`,
              { input: reddit.opts.args.search, type: "title", range: "3-9" }
            );
            return {
              title,
              content: await reddit.ai(
                `Based on this '${comment}' comment, on a post titled ${title}, through a search term of ${reddit.opts.args.search}`,
                { input: comment, type: "post", range: "50-100" }
              ),
            };
          });
          await reddit.nap();
        },
        player.visited,
        reddit.opts.args.scope,
        () => onRetry()
      );
      return expecto.index;
    },
    () => onRetry()
  );
}
