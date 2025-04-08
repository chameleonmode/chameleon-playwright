import X from "../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  opts: {
    search: string;
  }
) {
   // Step 1 - Launch X
  const page = await X(await context.newPage());

}