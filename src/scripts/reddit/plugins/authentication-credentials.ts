import Reddit from "../page.js";

export default async function (
    context: import('@playwright/test').BrowserContext,
    options: {
        email: string;
        password: string;
    }
) {
    const page = new Reddit(await context.newPage());
    // Step 1 - Launch Reddit
    await page.goToStartPage();

    // check Authentication
    const isLogin = await page.checkLoginAuthentication();

    if (isLogin) {
        // Login with credentials 
        await page.loginWithCredentials(options.email, options.password);
    }
}
