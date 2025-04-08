import X from "../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        search: string;
    }
) {
    // Step 1 -  Launch X
    const page = await X(await context.newPage());

    // Step 2 -  Search for topic...
    await page.search(options.search);

    // Step 3 - Find post to love Tweet
    const post = await page.scrollToPost(); 

    // Step 4 - love Tweet
    await page.loveTweet(post); 
}