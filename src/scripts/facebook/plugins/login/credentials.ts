import Facebook from "../../page.js";

export default async function (
    context: import("@playwright/test").BrowserContext,
    options: {
        email: string;
        password: string;
    }
) {
    // Step 1 - Launch Facebook
    const page = await Facebook(await context.newPage());

    // check Authentication
    await page.checkLoginAuthentication();
    await page.loginWithCredentials(options.email, options.password);
}
