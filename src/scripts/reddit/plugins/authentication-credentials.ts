import Reddit from "../page.js";
import ask from "../../../lib/ask.js";

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
    const isLogin = await page.checkLoginAuthentication();
    if (isLogin) {
        await page.loginWithCredentials(options.email, options.password);
    }
}
