import X from "../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    opts: {
        tweet: string;
    }
) {
    const page = new X(await context.newPage());
    // Step 1 - Launch X
    await page.goToStartPage();
    // Step 2 - Search for topic...
    // await page.search(opts.search);
    const isLogin = await page.checkLoginAuthentication();
    console.log(isLogin, "--islogin")
    if (isLogin) {
        console.log(isLogin)
        await page.tweetToX(opts.tweet)
    }
    else {
        console.error("User is Not LoggedIn, Unable to process further ");
    }
}