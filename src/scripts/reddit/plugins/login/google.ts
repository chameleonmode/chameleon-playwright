import Reddit from "../../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    email: string;
    password: string;
  }
) {
  // Step 1 - Launch Reddit
  const { reddit } = await Reddit(context);

  // Step 2 - Authentication
  await reddit.login.loginWithGoogle(options.email, options.password);
}
