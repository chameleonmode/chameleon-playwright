import { Locator, Page, expect } from "@playwright/test";

export interface TestData {
  url: string;
  testEmail: string;
  testPW: string;
  textContent: string;
  textSearch: string;
  washington: string;
  antidetect: string;
  gsiteTitle: string;
}

const TIMEOUT = 6000;
const SHORT_TIMEOUT = 3000;
const BASE_URL = "https://sites.google.com/new";
const LOGIN_URL = "https://accounts.google.com";

export default class GsitePage {
  private readonly page: Page;
  private readonly emailTextBox: Locator;
  private readonly passwordTextBox: Locator;
  private readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailTextBox = page.locator(`//div//input[@type='email']`);
    this.passwordTextBox = page.locator(`//div//input[@type='password']`);
    this.nextButton = page.getByRole("button", { name: "Next" });
  }

  /**
   * Logs into Google Sites with the provided credentials.
   * @param email The email address to use for login.
   * @param password The password to use for login.
   */
  async loginToGsite(email: string, password: string): Promise<void> {
    await this.emailTextBox.waitFor({ state: "visible" });
    await this.emailTextBox.fill(email);
    await expect(this.nextButton).toBeVisible({ timeout: SHORT_TIMEOUT });
    await this.nextButton.click();
    await this.page.waitForTimeout(TIMEOUT);

    await this.passwordTextBox.waitFor({ state: "visible" });
    await this.passwordTextBox.fill(password);
    await expect(this.nextButton).toBeVisible({ timeout: SHORT_TIMEOUT });
    await this.nextButton.click();
    await this.page.waitForTimeout(TIMEOUT);
  }

  /**
   * Navigates to the Google Sites homepage.
   */
  async navigateToHomePage(): Promise<void> {
    await this.page.goto(BASE_URL);
  }

  /**
   * Creates a new website with the provided test data.
   * @param testData The test data to use for creating the website.
   */
  async createWebsite(testData: TestData): Promise<void> {
    try {
      await this.page.goto(testData.url);
      const currentUrl = this.page.url();
      if (currentUrl.startsWith(LOGIN_URL) && currentUrl !== BASE_URL) {
        await this.loginToGsite(testData.testEmail, testData.testPW);
      }
      await this.selectBlankTemplate();
      await this.setWebsiteTitle(testData.gsiteTitle);
      await this.setMainContent("Anti Detect Browser", testData.textContent);
      await this.addYouTubeVideo(testData.textSearch);
      await this.addMap(testData.washington);
      await this.publishWebsite(testData.antidetect);
    } catch (error) {
      console.error("Error creating website:", error);
    }
  }

  private async selectBlankTemplate(): Promise<void> {
    const blankTemplate = this.page.locator(
      `//img[contains(@src,'blank-googlecolors.png')]`
    );
    await blankTemplate.waitFor({ state: "visible" });
    await blankTemplate.click();
    await this.page.waitForLoadState("load");
  }

  private async setWebsiteTitle(title: string): Promise<void> {
    const titleInput = this.page.locator(`label[for='i5']`);
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);
  }

  private async setMainContent(title: string, content: string): Promise<void> {
    const textbox = this.page.locator(`//div[@role='textbox']`);
    await textbox.click();
    await this.page.keyboard.press("Control+A");
    await this.page.keyboard.press("Delete");
    await this.page.keyboard.type(title);

    await this.page.locator(`//div[@aria-label='Text box']`).click();
    await this.page.locator(`//div[@role='textbox']//p`).click();
    await this.page.keyboard.type(content);
  }

  private async addYouTubeVideo(searchTerm: string): Promise<void> {
    await this.page
      .locator(`//div[@role='menu'][2]//span[contains(.,"YouTube")]`)
      .click();
    await this.page.waitForLoadState("load");

    const iframe = this.page.frameLocator(`//iframe`).last();
    const searchInput = iframe.locator(
      `//input[@aria-label='Search all of YouTube or paste URL'] | //input[@aria-label="Search terms"]`
    );

    await searchInput.click();
    await this.page.keyboard.type(searchTerm);
    await this.page.keyboard.press("Enter");
    await this.page.waitForLoadState("load");

    await iframe.locator(`//div[@role='option'][1]`).click();
    await iframe.getByRole("button", { name: "Select" }).click();
    await this.page.waitForTimeout(SHORT_TIMEOUT);
  }

  private async addMap(location: string): Promise<void> {
    await this.page
      .locator(`//div[@role='menu'][2]//span[contains(.,"Map")]`)
      .click();
    await this.page.waitForLoadState("load");

    const iframe = this.page.frameLocator(`//iframe`).last();
    const locationInput = iframe.locator(
      `//form//input[@placeholder='Enter a location']`
    );

    await expect(locationInput).toBeVisible({ timeout: TIMEOUT });
    await locationInput.click();
    await this.page.keyboard.type(location);
    await this.page.waitForTimeout(SHORT_TIMEOUT);

    await expect(
      iframe.locator(`//div[@class='pac-item']`).first()
    ).toBeVisible();
    await iframe.locator(`//div[@class='pac-item']`).first().click();
    await iframe.getByRole("button", { name: "Select" }).click();
    await this.page.waitForTimeout(SHORT_TIMEOUT);
  }

  private async publishWebsite(antidetect: string): Promise<void> {
    await this.page.locator(`//span[text()="Publish"]`).click();
    await this.page.waitForLoadState("load");

    const urlInput = this.page.locator(`//input[@class='poFWNe zHQkBf']`);
    await expect(urlInput).toBeVisible();
    await urlInput.click();

    const publishButton = this.page
      .getByRole("button", { name: "Publish" })
      .last();

    while (await publishButton.isDisabled()) {
      const uniqueAntiDetectName = `Gsite${Math.random()
        .toString()
        .replace(".", "")}`;
      console.log(uniqueAntiDetectName);
      await this.page.keyboard.type(uniqueAntiDetectName);
      await this.page.waitForLoadState("load");

      await this.delay(SHORT_TIMEOUT);
      if (await publishButton.isEnabled()) {
        break;
      }

      await this.page.keyboard.press("Control+A");
      await this.page.keyboard.press("Delete");
    }

    await publishButton.click();
  }

  // Utility function to add a delay
  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
