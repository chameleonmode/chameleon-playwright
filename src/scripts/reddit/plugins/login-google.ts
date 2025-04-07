import Reddit from "../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    email: string;
    password: string;
  }
) {
  // Step 1 - Launch Reddit
  const page = await Reddit(await context.newPage());

  // Step 2 - Check authentication for reddit
  await page.checkLoginAuthentication();

  // Step 3 - Login with google
  await page.loginWithGoogle(options.email, options.password);
}
