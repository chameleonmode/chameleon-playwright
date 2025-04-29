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
  const { x } = await X(context);

  // Step 2 - Authentication
  await x.login.loginWithCredentials(options.email, options.userName, options.password);
}
