// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { random } from "./utils.js";

class Base {
  constructor(readonly page: Page, readonly START_URL: string, readonly feature: string) {
    this.page.setDefaultNavigationTimeout(1000 * 60 * 2);
    this.page.setDefaultTimeout(1000 * 60 * 5);
  }
  async goToStartPage() {
    await this.navigate(this.START_URL);
  }

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: "load" });
    await this.waitForNavigation();
  }

  async waitForNavigation() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("load");
  }

  async getFocusedElement() {
    return this.page.evaluate(() => {
      const active = document.activeElement;
      return {
        element: active,
        tagName: active?.tagName,
        ariaLabel: active?.getAttribute("aria-label"),
      };
    });
  }

  async selectAll() {
    const modifierKey = process.platform === "win32" ? "Control" : "Meta";
    await this.page.keyboard.press(`${modifierKey}+A`);
  }

  async type(text: string) {
    await this.page.keyboard.type(text, {
      delay: random(64, 128),
    });
  }

  async pressSequentially(locator: Locator, text: string) {
    await this.click(locator);
    await locator.pressSequentially(text, {
      delay: random(64, 128),
    });
  }

  async randoNth<T>(locator: Locator) {
    return locator.nth(Math.floor(Math.random() * (await locator.count())));
  }

  async click<T>(locator: Locator) {
    await this.waitForNavigation();
    await locator.waitFor();
    await locator.scrollIntoViewIfNeeded();
    expect(locator).toBeVisible();
    expect(locator).toBeEnabled();
    await locator.click();
    await this.waitForNavigation();
  }

  error(message: string, cause?: unknown) {
    return new Error(`[${this.feature}] - [${this.START_URL}] ${message}`, { cause });
  }

  bang<T>(message: string, expect: T, source?: unknown) {
    if (expect) return expect;
    throw this.error(message, { source, expect });
  }
}

export default Base;
