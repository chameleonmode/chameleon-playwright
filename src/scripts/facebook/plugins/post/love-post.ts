import Facebook from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        search: string;
    }
) {
    // Step 1 -  Launch Facebook
    const page = await Facebook(await context.newPage());

    // Step 2 -  Search for topic...
    await page.search(options.search); 

    // Step 3 - love Post
    await page.lovePostFaceook();
}