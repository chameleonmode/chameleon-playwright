import X from "../page.js";

export default async function (
  context: import("@playwright/test").BrowserContext,
  opts: {
    search: string;
  }
) {
  const page = new X(await context.newPage());
  // Step 1 - Launch X
  await page.goToStartPage();
  // Step 2 - Search for topic...
 // await page.search(opts.search);
}