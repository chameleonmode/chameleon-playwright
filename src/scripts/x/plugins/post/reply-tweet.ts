import X from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    opts: {
        search: string;
    }
) {
    // Step 1 - Launch X
    const page = await X(await context.newPage());

    // Step 2 - Search for topic.
    await page.search(opts.search);

    // Step 3 - Get the tweet with the matching keyword.
    const { locator, text } = await page.getTweet();

    // Step 4 - Reply to the tweet.
    await page.replyToTweet(locator,await page.ai(`on a a x post titled `, { input: text, type: "reply" }));
}