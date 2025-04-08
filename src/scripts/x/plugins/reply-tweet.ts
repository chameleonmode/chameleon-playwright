import { askAI } from "../../../lib/ask.js";
import X from "../page.js";

export default async function (
    context: import('@playwright/test').BrowserContext,
    options: {
        search: string;
        searchKeyword: string;
    }
) {
    // Step 1 - Launch X
    const page = await X(await context.newPage());

    // Step 2 - Search for topic and click on 1st test result
    await page.search(options.search);

    // Step 3 - Open the profile matching with the keyword.
    const { locator, text } = await page.getTweet();
    
    // Step 4 - Reply to the tweet.
    await page.replyToTweet(locator, await askAI({ input: text, feature: page.feature, ai: "gpt" }));
}
