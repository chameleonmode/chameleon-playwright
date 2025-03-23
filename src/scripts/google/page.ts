import { FrameLocator, Locator, Page, expect } from "@playwright/test";
import { random, sleepRandom } from "../../lib/utils.js";
import Base from "../../lib/page.js";

export default class GsitePage extends Base {
  // LOCATORS
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
  readonly xButton: Locator;
  readonly toolBar: {
    hyperLinkButton: Locator;
    textToHighLight: Locator;
    linkTextBox: Locator;
    applyButton: Locator;
  };

  constructor(readonly page: Page) {
    super(page, "https://sites.google.com/");

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

  async clickOnGotItButton() {
    await sleepRandom({ multiplier: 2 });
    if (await this.gotItButton.isVisible()) {
      await this.gotItButton.click();
    }
  }

  async addBlankSite() {
    await sleepRandom({ multiplier: 2 });
    await this.sites.waitFor({ state: "visible" });
    await this.sites.click();
  }

  async closeFloatingDialog() {
    await sleepRandom({ multiplier: 2 });
    if (await this.xButton.isVisible()) {
      await this.xButton.click();
    }
  }

  async clickOnSkipThisTourButton() {
    await sleepRandom({ multiplier: 2 });
    if ((await this.skipThisTourButton.count()) > 1) {
      await this.skipThisTourButton.click();
    }
  }

  async updateSiteName(siteName: string) {
    await sleepRandom({ multiplier: 2 });
    await this.siteTitle.waitFor({ state: "visible" });
    await this.siteTitle.fill(siteName);
  }

  async changePageTitle(pageTitle: string) {
    await sleepRandom({ multiplier: 2 });
    await this.siteHeader.waitFor({ state: "visible" });
    await this.siteHeader.click();

    await this.selectAll();
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.type(pageTitle);
  }

  async addTextElement(text: string) {
    await sleepRandom({ multiplier: 2 });
    await this.textIcon.waitFor({ state: "visible" });
    await this.textIcon.click();

    const textArea = this.page.locator(`//div[@role='textbox']//p`).nth(0);
    await textArea.waitFor({ state: "visible" });
    await textArea.click();

    await this.page.keyboard.type(text);
  }

  async insertHyperLinkOnText(link: string, linkText: string) {
    await sleepRandom({ multiplier: 2 });
    await this.textIcon.waitFor({ state: "visible" });
    await this.textIcon.click();

    const textArea = this.page.locator(`//div[@role='textbox']//p`).nth(1);
    await textArea.waitFor({ state: "visible" });
    await textArea.click();

    await sleepRandom({ multiplier: 2 });
    await this.toolBar.hyperLinkButton.waitFor({ state: "visible" });
    await this.toolBar.hyperLinkButton.click();

    await this.toolBar.textToHighLight.waitFor({ state: "visible" });
    await this.toolBar.textToHighLight.click();
    await this.toolBar.textToHighLight.fill(linkText);

    await this.toolBar.linkTextBox.click();
    await this.toolBar.linkTextBox.fill(link);
    await sleepRandom({ multiplier: 2 });

    await expect(this.toolBar.applyButton).toBeEnabled();

    await this.toolBar.applyButton.click();
    await sleepRandom({ multiplier: 2 });
  }

  async addYouTube(textToSearch: string) {
    await sleepRandom({ multiplier: 2 });
    await this.youTubeIcon.click();
    await sleepRandom({ multiplier: 3 });
    const iframe = this.iFrame;
    while (await iframe.locator(this.youTubeSearchResults).first().isHidden()) {
      await iframe.locator(this.youtubeModalSearchTextBox).click();
      await this.page.keyboard.type(textToSearch);
      await sleepRandom({ multiplier: 3 });
      await this.page.keyboard.press("Enter");
      await sleepRandom({ multiplier: 3 });
      if ((await iframe.locator(this.youTubeSearchResults).count()) > 0) {
        await this.selectAll();
        await this.page.keyboard.press("Delete");
        await sleepRandom({ multiplier: 2 });
      }
    }
    let resultsCount = await iframe.locator(this.youTubeSearchResults).count();
    let randomIndex = Math.floor(Math.random() * resultsCount);
    await iframe.locator(this.youTubeSearchResults).nth(randomIndex).click();
    await iframe.locator(this.youTubeModalInsertButton).click();
  }

  async addLocation(location: string) {
    await sleepRandom({ multiplier: 2 });
    await this.mapIcon.click();
    const iframe2 = this.iFrame;
    await iframe2.locator(this.mapModalSearchTextBox).waitFor({ state: "visible" });
    await iframe2.locator(this.mapModalSearchTextBox).click();

    await this.page.keyboard.type(location);
    await sleepRandom({ multiplier: 4 });

    await iframe2.locator(this.mapModalSearchResult).first().waitFor({ state: "visible" });
    await iframe2.locator(this.mapModalSearchResult).first().click();
    await sleepRandom({ multiplier: 2 });
    await iframe2.locator(this.mapModalSelectButton).click();
  }

  async publishSite(siteName: string) {
    await sleepRandom({ multiplier: 2 });
    await this.publishButton.click();
    await this.page.waitForLoadState("load");
    await this.publishModalWebAddressTextBox.waitFor({ state: "visible" });
    await this.publishModalWebAddressTextBox.click();
    await this.page.keyboard.type(siteName);
    while (await this.publishModalPublishButton.last().isDisabled()) {
      await sleepRandom({ multiplier: 3 });
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
}
