import X from "../page.js";

export default async function (
    context: import('@playwright/test').BrowserContext,
    options: {
        email: string;
        userName: string;
        password: string;
    }
) {
    const page = new X(await context.newPage());
    // Step 1 - Launch X
    await page.goToStartPage();

    // check authentication
    const isLogin = await page.checkLoginAuthentication();

    if (!isLogin) {
        // Login with credentials 
        await page.loginWithCredentials(options.email, options.userName, options.password);
    }
}
