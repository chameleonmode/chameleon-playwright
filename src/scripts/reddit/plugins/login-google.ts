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

  // check Authentication
  await page.checkLoginAuthentication();
  await page.loginWithGoogle(options.email, options.password);
}
