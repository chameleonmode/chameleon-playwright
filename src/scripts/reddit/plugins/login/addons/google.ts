import Reddit from "../../../reddit.js";
import { Login } from "../login.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  options: {
    email: string;
    password: string;
  }
) {
  // Step 1 - Launch Reddit
  const { reddit } = await Reddit(context, {}, async() => {});

  // Step 2 - Authentication
  await new Login(reddit).loginWithGoogle(options.email, options.password);
}
