import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
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
        const { text } = await reddit.post.getComment(0);
        await reddit.post.visitCommunity();

        // Ask ai to create a new post title and content
        const content = async () => {
          const title = await reddit.ai(
            `Based on this '${text}' comment, on a post titled ${await reddit.post.title()}, through a search term of ${
              options.args.search
            }`,
            { input: options.args.search, type: "title", range: "3-9" }
          );
          return {
            title,
            content: await reddit.ai(
              `Based on this '${text}' comment, on a post titled ${title}, through a search term of ${options.args.search}`,
              { input: text, type: "post" }
            ),
          };
        };

        // Create a new post
        await reddit.poster(content);
      },
      ranno
    );

    return expecto.index;
  });
}
