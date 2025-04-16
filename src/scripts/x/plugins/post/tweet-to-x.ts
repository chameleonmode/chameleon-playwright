import X from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        tweet: string;
    }
) {
    // Step 1 - Launch X
    const page = await X(await context.newPage());

    // Step 2 - Make a Tweet
    await page.tweetToX(await page.ai("want to create an tweet: ", { input: options.tweet, type: "post", range:"10-30" }))  
}