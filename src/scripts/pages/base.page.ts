// src/scripts/pages/base.page.ts
import { Page } from "@playwright/test";
import { random } from "../../lib/utils.js";

export default class BasePage {
  constructor(readonly page: Page, readonly START_URL: string) {}

  async goToStartPage() {
    await this.page.goto(this.START_URL);
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
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

  async selectAll(): Promise<void> {
    const modifierKey = process.platform === "win32" ? "Control" : "Meta";
    await this.page.keyboard.press(`${modifierKey}+A`);
  }

  async sleepRandom({ minMs = 256, maxMs = 512, multiplier = 1 }): Promise<void> {
    const delay = await random(minMs, maxMs);
    await this.page.waitForTimeout(delay * multiplier);
  }
}
