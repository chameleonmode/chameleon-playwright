import { chromium } from "@playwright/test";

async function main() {
  const context = await chromium.launchPersistentContext(".cache/exampleviva", {
    headless: false,
    executablePath: "/Applications/Vivaldi.app/Contents/MacOS/Vivaldi",
    args: [
       "--load-extension=/Users/dev/src/Chameleon-lib/Chameleon.Assets/addons/chromeleon"
    ]
  });


  const page = await context.newPage();
  await page.goto("chrome://version");
}

main().catch((error) => {
  console.error("Error running the scraper:", error);
  process.exit(1);
});
