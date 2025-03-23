import { BrowserContext } from "@playwright/test";
import Page from "../page.js";

export default async function (
  context: BrowserContext,
  args: {
    name: string;
    title: string;
    content: string;
    youtube: string;
    // link: string;
    // linkText: string;
    // locationSearch: string;
  }
) {
  const page = new Page(await context.newPage());
  // Step 1 - Launch Google Sites
  await page.goToStartPage();
  await page.waitForNavigation();
  //optional - Click on Got It Button if displayed (for newly created account)
  await page.clickOnGotItButton();
  //Step 2 - Add Blank Site
  await page.addBlankSite();
  //optional - Click on Skip this Tour button if displayed (for newly created account)
  await page.clickOnSkipThisTourButton();
  //Step 3 - Update Site Name
  await page.updateSiteName(args.name);
  //Step 7 - Populate the Blank Sheet Title
  await page.changePageTitle(args.title);
  //optional step if securityu pop-up is displayed.
  await page.closeFloatingDialog();
  //Step 8 - Click Text and Populate it
  await page.addTextElement(args.content);
  //Step 9 - Click Text and Populate it with Hyperlink
  //await page.insertHyperLinkOnText(args.link, args.linkText);
  //Step 9 - Add Youtube
  await page.addYouTube(args.youtube);
  //Step 10 - Add Map
  //await page.addLocation(args.locationSearch);
  //Step 11 -Publish
  await page.publishSite(args.title);
}
