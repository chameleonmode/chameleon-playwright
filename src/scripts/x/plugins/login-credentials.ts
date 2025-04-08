import X from "../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        email: string;
        userName: string;
        password: string;
    }
) {
    // Step 1 - Launch X
    const page = await X(await context.newPage());

    // Step 2 - Check authentication for X
    await page.checkLoginAuthentication();

    // Step 3 - Login with credentials
    await page.loginWithCredentials(options.email, options.userName, options.password);
}
