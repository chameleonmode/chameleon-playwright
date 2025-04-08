import X from "../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        search: string;
        tweet: string;
    }
) {
    // Step 1 -  Launch X
    const page = await X(await context.newPage());
    
    // Step 2 - Make a Tweet
    await page.tweetToX(options.tweet)   
}