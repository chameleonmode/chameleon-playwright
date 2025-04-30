import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import X from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
    // Step 1 - Launch X and search for the keyword
    const { x, player } = await X(context, opts);
    await x.searcho(x.opts.args.search)
    await player.start(async () => {
        const expecto = await x.findo(
            // Step 2 - Open the profile matching with the keyword.
            async () => {
                const { locator, text } = await x.post.getTweet();

                // Step 3 - Reply to the tweet.
                await x.post.replyToTweet(
                    locator,
                    await x.ai(`on a x post titled `, { input: text, type: "reply" })
                );
            },
            player.visited
        );
        return expecto.index;
    });
}