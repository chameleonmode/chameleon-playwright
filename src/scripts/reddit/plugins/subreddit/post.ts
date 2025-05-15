import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit } = await Reddit(context, opts, async (url) => {
    // find post content from a comment
    await reddit.post.assert();

    // Get the post title and comment text
    const sys = "Your creating a post on a subreddit community page";
    const titled = await reddit.post.title();
    const comments = await reddit.post.getComments(3);
    const terms = reddit.opts.ai.generations.terms;
    const context = `The post will be about a post at ${reddit.page.url()} its title is ${titled}.
      Some of the comments on that post are ${comments.join(", ")}`;

    // Check if the user is on the right page
    // if (reddit.scopeulation.tranform().community) await reddit.page.goBack();
    await reddit.post.visitCommunity();

    // Check if the user is on the right page
    await reddit.subreddit.canPost();

    // Create a new post
    await reddit.poster(async () => {
      const titlee = await reddit.ask({
        task: `generate a post title on a subreddit community`,
        generate: {
          sys,
          terms,
          context,
          type: "title",
          input: {
            type: "title",
            data: titled,
            reason: "this is the post title i want to base the new post on",
          },
          range: { min: 3, max: 9 },
        },
      });
      const titler = reddit.bang(
        "post title response",
        titlee.find((data) => {
          if (data.type === "title") return data;
        })
      );

      const contentlee = await reddit.ask({
        task: `create the reddit post content`,
        generate: {
          sys,
          terms,
          type: "post",
          context: `${context}
            The post title of your content will be ${titler.data} and the reason is ${titler.reason}`,
          input: titler,
          range: { min: 18, max: 54 },
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
