import X from "../page.js";

export default async function (
  context: import('@playwright/test').BrowserContext,
  options: {
    email: string;
    password : string;
  }
) {
  const page = new X(await context.newPage());
  // Step 1 - Launch X
  await page.goToStartPage();
  
  // check authentication
  const isLogin = await page.checkLoginAuthentication()

  if (!isLogin) {
    // Login with google
    await page.loginWithGoogle(options.email, options.password);
  }
}
