import { FrameLocator, Locator, Page, expect } from "@playwright/test";
import { random, sleep } from "../../lib/utils.js";
import BasePage from "./base.page.js";

const BASE_URL = "https://sites.google.com/";
const LOGIN_URL = "https://accounts.google.com";

let shortPauseTime: number = 750;
let mediumPauseTime: number = 1500;
let longPauseTime: number = 3000;
let megaLongPauseTime: number = 6000;
let defaultLoadTimeout: number = 1000 * 60;

export interface Options {
  gsiteTitle: string;
  publishTitle: string;
  postTitle: string;
  textContent: string;
  link: string;
  textWithLink: string;
  textSearch: string;
  location: string;
  email: string;
  password: string;
}

export default class GsitePage extends BasePage {
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

  constructor(readonly page: Page) {
    super(page);

    this.page.setDefaultTimeout(defaultLoadTimeout);
    this.homeButton = page.locator(`//button[@aria-label='Sites home']`);
    this.emailTextBox = page.locator(`//div//input[@type='email']`);
    this.passwordTextBox = page.locator(`//div//input[@type='password']`);
    this.nextButton = page.getByRole("button", { name: "Next" });
    this.gotItButton = page.locator(`//div[@class='docs-homescreen-warmwelcome-sites-gotit-button']`);
    this.skipThisTourButton = page.locator(
      `//a[@class='iph-dialog-dismiss'][@href="#__dismiss__"][@aria-label="Close"]`
    );
    this.sites = page.locator(`//img[contains(@src,'blank-googlecolors.png')]`);
    this.siteTitle = page.locator(`label[for='i5']`);
    this.siteHeader = page.locator(`//div[@role='textbox']`);
    this.textIcon = page.locator(`//div[@aria-label='Text box']`);
    this.youTubeIcon = page.locator(`//div[@role='menu'][2]//span[contains(.,"YouTube")]`);
    this.youtubeModalSearchTextBox = page.locator(
      `//input[@aria-label='Search all of YouTube or paste URL'] | //input[@aria-label="Search terms"]`
    );
    this.youTubeModalInsertButton = page.getByRole("button", {
      name: "Insert",
    });
    this.youTubeSearchResults = page.locator(`//div[@role='option']//div[@class="fPu5nc Fv4UIc"]`);
    this.iFrame = page.frameLocator(`//iframe`).last();
    this.mapIcon = page.locator(`//div[@role='menu'][2]//span[contains(.,"Map")]`);
    this.mapModalSearchTextBox = page.locator(`//form//input[@placeholder='Enter a location']`);
    this.mapModalSearchResult = page.locator(`//div[@class='pac-item']`);
    this.mapModalSelectButton = page.getByRole("button", { name: "Select" });
    this.publishButton = page.locator(`//span[text()="Publish"]`);
    this.publishModalWebAddressTextBox = page.locator(`//input[@class='poFWNe zHQkBf']`);
    this.publishModalPublishButton = page.getByRole("button", {
      name: "Publish",
    });
    this.ellipsisButton = page.locator(
      `//div[@class='docs-homescreen-item-overflow']//div[contains(@class, 'docs-homescreen-icon')]`
    );
    this.ellipsisDropdown = page.locator(`//div[contains(@class,'docs-homescreen-iconmenu')]`);
    this.ellipsisMenuRemoveButton = page.locator(
      `//div[contains(@class,'docs-homescreen-iconmenu')]//div[text()='Remove']`
    );
    this.confirmDeleteDialog = page.locator(`//div[@role='dialog']`);
    this.moveToTrashButton = page.locator(`//button[normalize-space()='Move to trash']`);
    this.hyperLinkModal = page.locator(`//div[@role='dialog'][@aria-label="Insert link"]`);
    this.xButton = page.locator(`//button[@aria-label="Close menu"]`);
    this.toolBar = {
      hyperLinkButton: page.locator(
        `//div[@aria-label='Tile']//div[@data-action-id="docs-insert-link-dialog"]`
      ),
      textToHighLight: page.locator(`//div[@aria-label="Insert link"]//input[@aria-label="Text"]`),
      linkTextBox: page.locator(`//div[@aria-label="Insert link"]//input[@aria-label="Link"]`),
      applyButton: page.locator(
        `//div[@aria-label="Insert link"]//div[@role='button'][@aria-label="Apply"]`
      ),
    };
  }
  async clickOnHomeButton() {
    await this.homeButton.click();
    await sleep(longPauseTime);
  }

  async closeFloatingDialog() {
    await sleep(longPauseTime);
    if (await this.xButton.isVisible()) {
      await this.xButton.click();
    }
    await sleep(longPauseTime);
  }

  async clickOnGotItButton() {
    await sleep(megaLongPauseTime);
    if (await this.gotItButton.isVisible()) {
      await this.gotItButton.click();
    }
    await sleep(mediumPauseTime);
  }

  async clickOnSkipThisTourButton() {
    await sleep(megaLongPauseTime);
    if ((await this.skipThisTourButton.count()) > 1) {
      await this.skipThisTourButton.click();
    }
    await sleep(shortPauseTime);
  }

  async goToGsite(): Promise<boolean> {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("load");
    await sleep(mediumPauseTime);
    const currentUrl = this.page.url();
    return currentUrl.startsWith(LOGIN_URL) && currentUrl !== BASE_URL;
  }

  async loginToGsite(email: string, password: string) {
    //Enter Email
    await this.emailTextBox.waitFor({ state: "visible" });
    await this.emailTextBox.fill(email);
    await this.nextButton.waitFor({ state: "visible" });
    await this.nextButton.click();

    await this.page.waitForLoadState("load");
    await sleep(mediumPauseTime);

    //Enter Password
    await this.passwordTextBox.waitFor({ state: "visible" });
    await this.passwordTextBox.fill(password);
    await this.nextButton.waitFor({ state: "visible" });
    await this.nextButton.click();
    await sleep(mediumPauseTime);
  }

  async addBlankSite() {
    await this.sites.waitFor({ state: "visible" });
    await this.sites.click();
    await sleep(mediumPauseTime);
  }

  async updateSiteName(siteName: string) {
    await this.siteTitle.waitFor({ state: "visible" });
    await this.siteTitle.fill(siteName);
  }

  async changePageTitle(pageTitle: string) {
    //Populate the Blank Sheet Title
    await this.siteHeader.waitFor({ state: "visible" });
    await this.siteHeader.click();

    await this.selectAll();
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.type(pageTitle);
  }

  async addTextElement(text: string) {
    await this.textIcon.waitFor({ state: "visible" });
    await this.textIcon.click();

    const textArea = this.page.locator(`//div[@role='textbox']//p`).nth(0); // Gets first element
    await textArea.waitFor({ state: "visible" });
    await textArea.click();

    await this.page.keyboard.type(text);
  }

  async insertHyperLinkOnText(text: string, hyperlink: string) {
    await this.textIcon.waitFor({ state: "visible" });
    await this.textIcon.click();

    const textArea = this.page.locator(`//div[@role='textbox']//p`).nth(1); // Gets first element
    await textArea.waitFor({ state: "visible" });
    await textArea.click();

    await sleep(shortPauseTime);
    await this.toolBar.hyperLinkButton.waitFor({ state: "visible" });
    await this.toolBar.hyperLinkButton.click();
    //
    await this.toolBar.textToHighLight.waitFor({ state: "visible" });
    await this.toolBar.textToHighLight.click();
    await this.toolBar.textToHighLight.fill(text);
    //
    await this.toolBar.linkTextBox.click();
    await this.toolBar.linkTextBox.fill(hyperlink);
    await sleep(shortPauseTime);
    
    await expect(this.toolBar.applyButton).toBeEnabled({timeout: shortPauseTime});

    await this.toolBar.applyButton.click();
    await sleep(mediumPauseTime);
  }

  async addYouTube(textToSearch: string) {
    await this.youTubeIcon.click();
    await sleep(mediumPauseTime);
    const iframe = this.iFrame;
    //Do Until there's a search result
    while (await iframe.locator(this.youTubeSearchResults).first().isHidden()) {
      await iframe.locator(this.youtubeModalSearchTextBox).click();
      await this.page.keyboard.type(textToSearch);
      await sleep(shortPauseTime);
      await this.page.keyboard.press("Enter");
      await sleep(mediumPauseTime);
      if ((await iframe.locator(this.youTubeSearchResults).count()) > 0) {
        await this.selectAll();
        await this.page.keyboard.press("Delete");
        await sleep(mediumPauseTime);
      }
    }
    let resultsCount = await iframe.locator(this.youTubeSearchResults).count();
    let randomIndex = Math.floor(Math.random() * resultsCount);
    await iframe.locator(this.youTubeSearchResults).nth(randomIndex).click();
    await iframe.locator(this.youTubeModalInsertButton).click();
  }

  async addLocation(location: string) {
    await this.mapIcon.click();
    //Do Until there's a search result
    const iframe2 = this.iFrame;
    await iframe2.locator(this.mapModalSearchTextBox).waitFor({ state: "visible" });
    await iframe2.locator(this.mapModalSearchTextBox).click();

    await this.page.keyboard.type(location);
    await sleep(longPauseTime);
    // await this.page.keyboard.press("Enter");

    await iframe2.locator(this.mapModalSearchResult).first().waitFor({ state: "visible" });
    // while ((await iframe2.locator(this.mapModalSearchResult).count()) <= 0) {
    //   await sleep(longPauseTime);
    // }
    // await sleep(mediumPauseTime);
    await iframe2.locator(this.mapModalSearchResult).first().click();
    await sleep(longPauseTime);
    await iframe2.locator(this.mapModalSelectButton).click();
  }

  async publishSite(siteName: string) {
    await sleep(mediumPauseTime);
    await this.publishButton.click();
    await this.page.waitForLoadState("load");
    await this.publishModalWebAddressTextBox.waitFor({ state: "visible" });
    await this.publishModalWebAddressTextBox.click();
    await this.page.keyboard.type(siteName);
    //To Append random numbers from sitename(to make it unique)
    while (await this.publishModalPublishButton.last().isDisabled()) {
      await sleep(mediumPauseTime);
      if (await this.publishModalPublishButton.last().isEnabled()) {
        break;
      }
      await this.publishModalWebAddressTextBox.click();
      await this.selectAll();
      await this.page.keyboard.press("Delete");
      await this.page.keyboard.type((siteName + (await random(1, 69))).replace(".", ""));
    }

    await this.publishModalPublishButton.last().click();
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
      await sleep(mediumPauseTime);
    }
  }
}
