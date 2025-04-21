import Facebook from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    opts: {
        search: string;
    }
) {
    // Step 1 - Launch Facebook
    const page = await Facebook(await context.newPage());

    // Step 2 - Search for topic.
    await page.search(opts.search);

    // Step 3 - Get the post with the matching keyword.
    const { locator, text } = await page.getPost();

    // // Step 4 - Reply to the post.
    await page.replyToPost(locator, await page.ai(`on a a x post titled `, { input: text, type: "reply" }));

}