// src/scripts/pages/base.page.ts
import { Page } from "@playwright/test";
import { random } from "./utils.js";

class Base {
  constructor(readonly page: Page, readonly START_URL: string) {
    this.page.setDefaultNavigationTimeout(1000 * 60 * 2);
    this.page.setDefaultTimeout(1000 * 60 * 5);
  }

  async goToStartPage() {
    await this.page.goto(this.START_URL, { waitUntil: "load" });
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
    await this.page.keyboard.type(text, { delay: random(50, 100) });
  }
}

export default Base;
