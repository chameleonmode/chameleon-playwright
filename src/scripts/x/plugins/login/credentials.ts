import X from "../../page.js";

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

    // check Authentication
    await page.checkLoginAuthentication();
    await page.loginWithCredentials(options.email, options.userName, options.password);
}
