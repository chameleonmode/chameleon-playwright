import X from "../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    opts: {
        search: string;
    }
) {
    const page = new X(await context.newPage());
    // Step 1 - Launch X
    await page.goToStartPage();
    const isLogin = await page.checkLoginAuthentication();
    console.log(isLogin,'--isLogin--');
    if (isLogin) {

        // Step 2 - Search for topic...
        await page.search(opts.search);

        // Step 3 - Open the first profile matching with the keyword.
        await page.openFirstProfile(opts.search);

        await page.page.waitForTimeout(2000)
        await page.loveTweet();
    }
    else {
        console.error("User is Not LoggedIn, Unable to process further ");
    }
}