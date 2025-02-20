import { Page } from 'playwright-core';
import GSiteData  from '../data/interfaces/GSiteData';
import GsitePage from './pages/gsite.page.js';

export async function gsites(page: Page, data: GSiteData): Promise<void> {
  console.log("Running GSite test:", data);
  try {
    const gsitePage = new GsitePage(page);
    //Step 1 - Launch Gsite Application
    if(await gsitePage.goToGsite()) {
      //Step 2 - Log in using valid credentials
      await gsitePage.loginToGsite(data.email, data.password )
    }
    //Step 3 - Click on Got It Button if displayed (for newly created account)
    await gsitePage.clickOnGotItButton()
    //Step 4 - Add Blank Site
    await gsitePage.addBlankSite()
    //Step 5 - Click on Skip this Tour button if displayed (for newly created account)
    await gsitePage.clickOnSkipThisTourButton()
    //Step 6 - Update Site Name
    await gsitePage.updateSiteName(data.gsiteTitle)
    //Step 7 - Populate the Blank Sheet Title
    await gsitePage.changePageTitle(data.postTitle)
    //optional step if securityu pop-up is displayed.
    await gsitePage.closeFloatingDialog()
    //Step 8 - Click Text and Populate it
    if(data.link && data.textWithLink) {
      await gsitePage.addTextElementWithHyperLinks(data.textContent, data.textWithLink, data.link)
    } else {
      await gsitePage.addTextElement(data.textContent)
    }
    //Step 9 - Add Youtube
    await gsitePage.addYouTube(data.textSearch)
    //Step 10 - Add Map
    await gsitePage.addLocation(data.location)
    //Step 11 -Publish
    await gsitePage.publishSite(data.publishTitle)
  } catch (error) {
    console.error("GSite test error:", error);
  } finally {
    console.log("GSite test completed finally");
  }
}

export default gsites;
