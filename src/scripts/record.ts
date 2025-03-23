export default async function (context: import("@playwright/test").BrowserContext) {
  const page = await context.newPage();
  await page.pause();
}
