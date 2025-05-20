import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit } = await Reddit(context, opts, async (url) => {
    // find post content from a comment
    await reddit.post.assert();

    // Get the post title and comment text
    // const titled = await reddit.post.title();
    const b64 = [await reddit.screenshot()];
    const comments = await reddit.post.getComments();
    const context = `The post will be about this post at ${reddit.page.url()}`;

    // Check if the user is on the right page
    // if (reddit.scopeulation.tranform().community) await reddit.page.goBack();
    await reddit.post.visitCommunity();

    // Check if the user is on the right page
    await reddit.subreddit.canPost();
    b64.push(await reddit.screenshot());

    // Create a new post
    await reddit.poster(async () => {
      const titlee = await reddit.ask({
        task: `generate a post title for this subreddit community`,
        image: { des: "page screenshots", b64 },
        generations: {
          type: "title",
          sys: `Your creating a post on a subreddit community page`,
          range: { min: 1, max: 1 },
          context: `context: ${context}\ncurrent page url: ${reddit.page.url()}`,
          input: {
            type: "comment",
            data: comments,
            reason: "existing array of comments on the post",
          },
        },
      });
      const titler = reddit.bang(
        "post title response",
        titlee.find((data) => {
          if (data.type === "title") return data;
        })
      );
      b64.push(await reddit.screenshot());

      const contentlee = await reddit.ask({
        task: `create the post content`,
        image: { des: "page screenshots", b64 },
        generations: {
          type: "post",
          sys: `Your creating a post on a subreddit community page`,
          range: { min: 1, max: 1 },
          context: `context: ${context}\ncurrent page url: ${reddit.page.url()}`,
          input: {
            type: "title",
            data: [titler.data],
            reason: "the title of the post to generate content for",
          },
        },
      });
      const contentler = reddit.bang(
        "post content response",
        contentlee.find((data) => {
          if (data.type === "post") return data;
        })
      );

      // Return the title and content
      return { title: titler.data, content: contentler.data };
    });

    // nap
    await reddit.nap();
  });

  // Step 3 - Play
  await reddit.player.play();
}
