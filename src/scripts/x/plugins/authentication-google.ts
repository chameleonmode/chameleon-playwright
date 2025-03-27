import Reddit from "../page.js";

export default async function (
  context: import('@playwright/test').BrowserContext,
  options: {
    email: string;
    password : string;
  }
) {
  const page = new Reddit(await context.newPage());
  await page.goToStartPage();
  const isLogin = await page.checkLoginAuthentication()
  if (!isLogin) {
    await page.loginWithGoogle(options.email, options.password);
  }
}
