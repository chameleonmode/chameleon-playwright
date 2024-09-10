import playwright from "playwright-core";
import { config } from "./base.mjs";
import { expect } from "@playwright/test";

export const description = "Gsite - Test Case 1";
export const gsiteCase = async (testData) => {
  const browser = await playwright.chromium.connectOverCDP(
    `http://localhost:${config.cdpPort}`
  );
  const context = browser.contexts()[0];
  const page = await context.newPage();
  console.log("gsiteCase:", testData.testEmai);
  //Navigate to URL
  await page.goto(testData.url);

  try {
    //Enter Email
    await expect(page.locator(`//div//input[@type='email']`)).toBeVisible();
    await page.locator(`//div//input[@type='email']`).fill(testData.testEmail);
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible({
      timeout: 3000,
    });
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForTimeout(6000);
    //Enter Password
    await expect(page.locator(`//div//input[@type='password']`)).toBeVisible();
    await page.locator(`//div//input[@type='password']`).fill(testData.testPW);
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible({
      timeout: 3000,
    });
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("load");
  } catch (error) {
    console.error("gsiteCase Error:", error);
  }
  
  //Click on Sites
  await page.locator(`//img[contains(@src,'blank-googlecolors.png')]`).click();
  await page.waitForLoadState("load");

  //Populate the Blank Sheet Title
  await page.locator(`//div[@role='textbox']`).click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await page.keyboard.type("Anti Detect Browser");

  //Click Text and Populate it
  await page.locator(`//div[@aria-label='Text box']`).click();
  await page.locator(`//div[@role='textbox']//p`).click();
  await page.keyboard.type(testData.textContent);

  //Click Youtube
  await page
    .locator(`//div[@role='menu'][2]//span[contains(.,"YouTube")]`)
    .click();
  await page.waitForLoadState("load");
  const iframe = page.frameLocator(`//iframe`).last();
  await iframe
    .locator(
      `//input[@aria-label='Search all of YouTube or paste URL'] | //input[@aria-label="Search terms"]`
    )
    .click();
  await page.keyboard.type(testData.textSearch);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("load");
  await iframe.locator(`//div[@role='option'][1]`).click();
  await iframe.getByRole("button", { name: "Select" }).click();

  //Click Map
  await page.locator(`//div[@role='menu'][2]//span[contains(.,"Map")]`).click();
  await page.waitForLoadState("load");
  const iframe2 = page.frameLocator(`//iframe`).last();
  await iframe2
    .locator(`//form//input[@placeholder='Enter a location']`)
    .click();
  await page.keyboard.type(testData.washington);
  await page.waitForTimeout(3000);
  await iframe2.locator(`//div[@class='pac-item']`).first().click();
  await iframe2.getByRole("button", { name: "Select" }).click();
  await page.waitForTimeout(3000);
  //Publish

  await page.locator(`//span[text()="Publish"]`).click();
  await page.waitForLoadState("load");
  await page.locator(`//input[@class='poFWNe zHQkBf']`).click();
  await page.keyboard.type(testData.antidetect);
  await page.waitForLoadState("load");
  await page.getByRole("button", { name: "Publish" }).last().click();
};
