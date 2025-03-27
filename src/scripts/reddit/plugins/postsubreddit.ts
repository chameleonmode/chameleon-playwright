import Reddit from "../page.js";
import ask from "../../../lib/ask.js";

export default async function (
    context: import('@playwright/test').BrowserContext,
    options: {
        search: string;
        vote: boolean;
        commentTitle: string;
        commentText: string;
    }
) {
    const page = new Reddit(await context.newPage());
    // Step 1 - Launch Reddit
    await page.goToStartPage();
    // Step 2 - Search for topic and click on 1st test result
    await page.search("r/" + options.search);
    const isAvailable = await page.findSubreddit("r/" + options.search);

    if (isAvailable) {
        const isCommented = await page.createPostSubreddit(options.commentTitle, options.commentText);
        if (isCommented) {
            console.log("comment to sub reddit")
        }
    }

}