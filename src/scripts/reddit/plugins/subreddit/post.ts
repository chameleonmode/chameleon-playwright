import { BrowserContext } from "@playwright/test";
import { Options } from "../../defs.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, options, player } = await Reddit(context, opts);

  // Step 2 - Dance
  player.start(async (ranno) => {
    const expecto = await reddit.findo(
      options.args.scope,
      async () => {
        // find post content from a comment
        const { text, post } = await reddit.findComment(0);
        await reddit.visitSubredditCommunity();

        // Ask ai to create a new post title and content
        const title = await reddit.ai(
          `Based on this '${text}' comment, on a post titled ${post}, through a search term of ${options.args.search}`,
          { input: options.args.search, type: "title", range: "3-9" }
        );
        const content = await reddit.ai(
          `for a new post titled ${title}, to this comment'${text}' through a search term of ${options.args.search}`,
          { input: title, type: "post" }
        );

        // Create a new post
        await reddit.createPostSubreddit(title, content);
      },
      ranno
    );

    return expecto.index;
  });
}