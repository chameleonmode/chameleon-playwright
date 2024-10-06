import { FrameLocator, Locator, Page } from "playwright";
const BASE_URL = "https://sites.google.com/";
const LOGIN_URL = "https://accounts.google.com";

let shortPauseTime: number = 1000;
let mediumPauseTime: number = 2000;
let longPauseTime: number = 3000;
let megaLongPauseTime: number = 5500;

export default class GsitePage {
  page: Page;
  // LOCATORS
  readonly homeButton: Locator;
  readonly emailTextBox: Locator;
  readonly passwordTextBox: Locator;
  readonly nextButton: Locator;
  readonly gotItButton: Locator;
  readonly skipThisTourButton: Locator;
  readonly sites: Locator;
  readonly siteTitle: Locator;
  readonly siteHeader: Locator;
  readonly textIcon: Locator;
  readonly textArea: Locator;
  readonly enteredTextOnTextArea: Locator;
  readonly youTubeIcon: Locator;
  readonly youtubeModalSearchTextBox: Locator;
  readonly youTubeModalInsertButton: Locator;
  readonly youTubeSearchResults: Locator;
  readonly iFrame: FrameLocator;
  readonly mapIcon: Locator;
  readonly mapModalSearchTextBox: Locator;
  readonly mapModalSearchResult: Locator;
  readonly mapModalSelectButton: Locator;
  readonly publishButton: Locator;
  readonly publishModalWebAddressTextBox: Locator;
  readonly publishModalPublishButton: Locator;
  readonly ellipsisButton: Locator;
  readonly ellipsisDropdown: Locator;
  readonly ellipsisMenuRemoveButton: Locator;
  readonly confirmDeleteDialog: Locator;
  readonly moveToTrashButton: Locator;
  readonly hyperLinkModal: Locator;
  readonly xButton: Locator;
  readonly toolBar: {
    hyperLinkButton: Locator;
    textToHighLight: Locator;
    linkTextBox: Locator;
    applyButton: Locator;
  };

  constructor(page: Page) {
    this.page = page;
    this.homeButton = page.locator(`//img[@alt='Atari logo']`);
    this.emailTextBox = page.locator(`//div//input[@type='email']`);
    this.passwordTextBox = page.locator(`//div//input[@type='password']`);
    this.nextButton = page.getByRole("button", { name: "Next" });
    this.gotItButton = page.locator(
      `//div[@class='docs-homescreen-warmwelcome-sites-gotit-button']`
    );
    this.skipThisTourButton = page.locator(
      `//div[@class='iph-dialog-content']//button[contains(.,"Skip this tour")]`
    );
    this.sites = page.locator(`//img[contains(@src,'blank-googlecolors.png')]`);
    this.siteTitle = page.locator(`label[for='i5']`);
    this.siteHeader = page.locator(`//div[@role='textbox']`);
    this.textIcon = page.locator(`//div[@aria-label='Text box']`);
    this.textArea = page.locator(`//div[@role='textbox']//p`);
    this.enteredTextOnTextArea = this.textArea.locator(`//span`);
    this.youTubeIcon = page.locator(
      `//div[@role='menu'][2]//span[contains(.,"YouTube")]`
    );
    this.youtubeModalSearchTextBox = page.locator(
      `//input[@aria-label='Search all of YouTube or paste URL'] | //input[@aria-label="Search terms"]`
    );
    this.youTubeModalInsertButton = page.getByRole("button", {
      name: "Insert",
    });
    this.youTubeSearchResults = page.locator(
      `//div[@role='option']//div[@class="fPu5nc Fv4UIc"]`
    );
    this.iFrame = page.frameLocator(`//iframe`).last();
    this.mapIcon = page.locator(
      `//div[@role='menu'][2]//span[contains(.,"Map")]`
    );
    this.mapModalSearchTextBox = page.locator(
      `//form//input[@placeholder='Enter a location']`
    );
    this.mapModalSearchResult = page.locator(`//div[@class='pac-item']`);
    this.mapModalSelectButton = page.getByRole("button", { name: "Select" });
    this.publishButton = page.locator(`//span[text()="Publish"]`);
    this.publishModalWebAddressTextBox = page.locator(
      `//input[@class='poFWNe zHQkBf']`
    );
    this.publishModalPublishButton = page.getByRole("button", {
      name: "Publish",
    });
    this.ellipsisButton = page.locator(
      `//div[@class='docs-homescreen-item-overflow']//div[contains(@class, 'docs-homescreen-icon')]`
    );
    this.ellipsisDropdown = page.locator(
      `//div[contains(@class,'docs-homescreen-iconmenu')]`
    );
    this.ellipsisMenuRemoveButton = page.locator(
      `//div[contains(@class,'docs-homescreen-iconmenu')]//div[text()='Remove']`
    );
    this.confirmDeleteDialog = page.locator(`//div[@role='dialog']`);
    this.moveToTrashButton = page.locator(
      `//button[normalize-space()='Move to trash']`
    );
    this.hyperLinkModal = page.locator(
      `//div[@role='dialog'][@aria-label="Insert link"]`
    );
    this.xButton = page.locator(`//button[@aria-label="Close menu"]`);
    this.toolBar = {
      hyperLinkButton: page.locator(
        `//div[@aria-label='Tile']//div[@data-action-id="docs-insert-link-dialog"]`
      ),
      textToHighLight: page.locator(
        `//div[@aria-label="Insert link"]//input[@aria-label="Text"]`
      ),
      linkTextBox: page.locator(
        `//div[@aria-label="Insert link"]//input[@aria-label="Link"]`
      ),
      applyButton: page.locator(
        `//div[@aria-label="Insert link"]//div[@role='button'][@aria-label="Apply"]`
      ),
    };
  }
  async clickOnHomeButton() {
    await this.homeButton.click();
    await this.waitForPageLoad(longPauseTime);
  }

  async closeFloatingDialog() {
    await this.waitForPageLoad(longPauseTime);
    if (await this.xButton.isVisible()) {
      await this.xButton.click();
    }
    await this.waitForPageLoad(longPauseTime);
  }

  async clickOnGotItButton() {
    await this.waitForPageLoad(megaLongPauseTime);
    if (await this.gotItButton.isVisible()) {
      await this.gotItButton.click();
    }
    await this.waitForPageLoad(mediumPauseTime);
  }

  async clickOnSkipThisTourButton() {
    await this.waitForPageLoad(megaLongPauseTime);
    if ((await this.skipThisTourButton.count()) > 1) {
      await this.skipThisTourButton.click();
    }
    await this.waitForPageLoad(mediumPauseTime);
  }

  async addTextElementWithLink(text: string) {
    await this.textIcon.click();
    await this.textArea.click();
    await this.page.keyboard.type(text);
  }

  async addTextElementWithHyperLinks(
    origText: string,
    text: string,
    tlink: string
  ) {
    const originalTextLength = origText.length;
    let textwithLink = text;
    let textinkLength = textwithLink.length;
    let textLinkPosition = origText.search(textwithLink);
    let secondTextStart = textLinkPosition + textinkLength;
    let secondTextEnd = originalTextLength;
    let firstText = origText.substring(0, textLinkPosition);
    let secondText = origText.substring(secondTextStart, secondTextEnd);

    //Enter Add Text Icon
    await this.textIcon.waitFor({ state: "visible" });
    await this.textIcon.click();
    await this.textArea.waitFor({ state: "visible" });
    await this.textArea.click();

    if (textLinkPosition > 0) {
      //If text link is in the middle of sentence
      await this.insertHyperLinkOnText(text, tlink);
      await this.textArea.click();
      await this.page.keyboard.press("Home");
      await this.page.keyboard.type(firstText);
      await this.page.keyboard.press("End");
      await this.page.keyboard.type(secondText);
    } else if (textLinkPosition === 0) {
      //if text link is in 1st index
      await this.insertHyperLinkOnText(text, tlink);
      await this.textArea.click();
      await this.page.keyboard.press("End");
      await this.page.keyboard.type(secondText);
    }
  }

  async insertHyperLinkOnText(text: string, hyperlink: string) {
    await this.waitForPageLoad(mediumPauseTime);
    await this.toolBar.hyperLinkButton.waitFor({
      state: "visible",
      timeout: mediumPauseTime,
    });
    await this.toolBar.hyperLinkButton.click();
    await this.toolBar.textToHighLight.waitFor({ state: "visible" });
    await this.toolBar.textToHighLight.click();
    await this.toolBar.textToHighLight.fill(text);
    await this.toolBar.linkTextBox.click();
    await this.toolBar.linkTextBox.fill(hyperlink);
    await this.waitForPageLoad(mediumPauseTime);
    while (!this.toolBar.applyButton.isEnabled({ timeout: mediumPauseTime })) {
      await this.waitForPageLoad(mediumPauseTime);
      console.log("wait");
    }
    await this.toolBar.applyButton.click();
    await this.waitForPageLoad(longPauseTime);
  }

  async randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async goToGsite() {
    await this.page.goto(BASE_URL);
    await this.waitForPageLoad(megaLongPauseTime);
    while (await this.emailTextBox.isHidden()) {
      await this.waitForPageLoad(shortPauseTime);
    }
  }

  async loginToGsite(email: string, password: string) {
    //Enter Email
    await this.emailTextBox.waitFor({ state: "visible" });
    await this.emailTextBox.fill(email);
    await this.nextButton.waitFor({ state: "visible", timeout: longPauseTime });
    await this.nextButton.click();
    await this.waitForPageLoad(longPauseTime);

    //Enter Password
    await this.passwordTextBox.waitFor({ state: "visible" });
    await this.passwordTextBox.fill(password);
    await this.nextButton.waitFor({ state: "visible", timeout: 5000 });
    await this.nextButton.click();
    await this.waitForPageLoad(longPauseTime);
  }

  async addBlankSite() {
    await this.sites.waitFor({ state: "visible", timeout: mediumPauseTime });
    await this.sites.click();
    await this.waitForPageLoad(longPauseTime);
  }

  async updateSiteName(siteName: string) {
    await this.siteTitle.waitFor({
      state: "visible",
      timeout: mediumPauseTime,
    });
    await this.siteTitle.fill(siteName);
  }

  async changePageTitle(pageTitle: string) {
    //Populate the Blank Sheet Title
    await this.siteHeader.waitFor({
      state: "visible",
      timeout: mediumPauseTime,
    });
    await this.siteHeader.click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.type(pageTitle);
  }

  async addTextElement(text: string) {
    await this.textIcon.click();
    await this.textArea.click();
    await this.page.keyboard.type(text);
  }

  async addYouTube(textToSearch: string) {
    await this.youTubeIcon.click();
    // await this.waitForPageLoad(megaLongPauseTime);
    const iframe = this.iFrame;
    await iframe.locator(this.youTubeSearchResults).waitFor({ state: "hidden", timeout: mediumPauseTime });
    //Do Until there's a search result
    while (await iframe.locator(this.youTubeSearchResults).first().isHidden()) {
      await iframe.locator(this.youtubeModalSearchTextBox).click();
      await this.page.keyboard.type(textToSearch);
      await this.waitForPageLoad(mediumPauseTime);
      await this.page.keyboard.press("Enter");
      // await this.waitForPageLoad(megaLongPauseTime);
      await iframe.locator(this.youTubeSearchResults).waitFor({ state: "visible", timeout: megaLongPauseTime });
      if ((await iframe.locator(this.youTubeSearchResults).count()) > 0) {
        await this.page.keyboard.press("Control+A");
        await this.page.keyboard.press("Delete");
        await this.waitForPageLoad(mediumPauseTime);
      }
    }
    await iframe.locator(this.youTubeSearchResults).waitFor({ state: "visible", timeout: megaLongPauseTime });
    let resultsCount = await iframe.locator(this.youTubeSearchResults).count();
    let randomIndex = Math.floor(Math.random() * resultsCount);
    await iframe.locator(this.youTubeSearchResults).nth(randomIndex).click();
    await this.waitForPageLoad(shortPauseTime);
    await iframe.locator('div').filter({ hasText: /^Insert$/, has: this.page.getByRole("button") }).waitFor({ state: "visible", timeout: shortPauseTime });
    await this.page.pause();
    await this.waitForPageLoad(shortPauseTime);
    await iframe.locator('div').filter({ hasText: /^Insert$/, has: this.page.getByRole("button") }).click();
    await this.waitForPageLoad(longPauseTime);
  }

  async addLocation(location: string) {
    await this.mapIcon.click();
    await this.waitForPageLoad(mediumPauseTime);
    const iframe2 = this.iFrame;
    await iframe2.locator(this.mapModalSearchResult).waitFor({ state: "visible", timeout: mediumPauseTime });
    while ((await iframe2.locator(this.mapModalSearchResult).count()) <= 0) {
      await iframe2
        .locator(this.mapModalSearchTextBox)
        .waitFor({ state: "visible", timeout: mediumPauseTime });
      await iframe2.locator(this.mapModalSearchTextBox).click();
      await this.page.keyboard.type(location);
      await this.waitForPageLoad(megaLongPauseTime);
      await iframe2
        .locator(this.mapModalSearchResult)
        .first()
        .waitFor({ state: "visible", timeout: longPauseTime });
    }
    await this.waitForPageLoad(shortPauseTime);
    await iframe2.locator(this.mapModalSearchResult).first().click();
    await this.waitForPageLoad(shortPauseTime);
    await iframe2.locator(this.mapModalSelectButton).click();
    await this.waitForPageLoad(shortPauseTime);
  }

  async publishSite(siteName: string) {
    await this.publishButton.click();
    await this.page.waitForLoadState("load");
    await this.publishModalWebAddressTextBox.waitFor({ state: "visible", timeout: mediumPauseTime });
    //To Append random numbers from sitename(to make it unique)
    while (await this.publishModalPublishButton.last().isDisabled()) {
      let randomnum = await this.randomIntFromInterval(1, 69);
      let uniqueAntiDetectName = siteName + randomnum;
      uniqueAntiDetectName = uniqueAntiDetectName.replace(".", "");
      await this.page.keyboard.type(uniqueAntiDetectName);
      await this.waitForPageLoad(shortPauseTime);
      if (await this.publishModalPublishButton.last().isEnabled()) {
        break;
      }
      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Delete");
    }

    await this.publishModalWebAddressTextBox.click();
  }

  async siteDeletor() {
    //To Delete All Existing Site !!
    await this.ellipsisButton.first().waitFor({ state: "visible" });
    const siteCount = await this.ellipsisButton.count();
    for (let x = 0; x < siteCount; x++) {
      await this.ellipsisButton.nth(x).click();
      await this.ellipsisMenuRemoveButton.waitFor({ state: "visible" });
      await this.ellipsisMenuRemoveButton.click();
      await this.confirmDeleteDialog.waitFor({ state: "visible" });
      await this.moveToTrashButton.click();
      await this.waitForPageLoad(longPauseTime);
    }
  }

  async waitForPageLoad(timeout: number) {
    try {
      await this.page.waitForTimeout(longPauseTime);
    } catch (error) {
      console.error("Error in waitForPageLoad: ", error);
    }
  }
}
