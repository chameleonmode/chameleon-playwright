import X from "../page.js";

export default async function (
    context: import('@playwright/test').BrowserContext,
    options: {
        search: string;
        searchKeyword: string;
    }
) {
    const page = new X(await context.newPage());

    // Step 1 - Launch x
    await page.goToStartPage();
    // // Step 2 - Search for topic and click on 1st test result
    await page.search(options.search);

    // Step 3 - Open the first profile matching with the keyword.
    await page.openFirstProfile(options.search);

    // Step 4 - Search keyword on post
    await page.searchKeyWordOnPost(options.searchKeyword);
}
