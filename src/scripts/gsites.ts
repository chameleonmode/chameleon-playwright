
import { Page } from '@playwright/test';
import SitePage, { Options } from './pages/gsite.page.js';

export default async function (page: Page, opts: Options): Promise<void> {
  console.log("Running GSite test:", opts);
  try {
    const gsitePage = new SitePage(page);
    //Step 1 - Launch Gsite Application
    if(await gsitePage.goToGsite()) {
      //Step 2 - Log in using valid credentials
      await gsitePage.loginToGsite(opts.email, opts.password )
    }
    //Step 3 - Click on Got It Button if displayed (for newly created account)
    await gsitePage.clickOnGotItButton()
    //Step 4 - Add Blank Site
    await gsitePage.addBlankSite()
    //Step 5 - Click on Skip this Tour button if displayed (for newly created account)
    await gsitePage.clickOnSkipThisTourButton()
    //Step 6 - Update Site Name
    await gsitePage.updateSiteName(opts.gsiteTitle)
    //Step 7 - Populate the Blank Sheet Title
    await gsitePage.changePageTitle(opts.postTitle)
    //optional step if securityu pop-up is displayed.
    await gsitePage.closeFloatingDialog()
    //Step 8 - Click Text and Populate it
    await gsitePage.addTextElement(opts.textContent)
    //Step 9 - Click Text and Populate it with Hyperlink
    await gsitePage.insertHyperLinkOnText(opts.textWithLink, opts.link)
    //Step 9 - Add Youtube
    await gsitePage.addYouTube(opts.textSearch)
    //Step 10 - Add Map
    await gsitePage.addLocation(opts.location)
    //Step 11 -Publish
    await gsitePage.publishSite(opts.publishTitle)
  } catch (error) {
    console.error("GSite test error:", error);
  } finally {
    console.log("GSite test completed finally");
  }
}