// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom, tryForEach } from "../lib/utils.js";
import { askAI, scenario, tones } from "../lib/ask.js";

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

  randoNth(locator: Locator, count: number) {
    return locator.nth(Math.floor(Math.random() * count));
  }

  async click(locator: Locator) {
    await sleepRandom();
    await this.waitForNavigation();
    await locator.waitFor();
    await locator.scrollIntoViewIfNeeded();
    const { fulfilled } = await tryForEach([
      expect(locator).toBeEnabled({ timeout: 1000 * 5 }),
      expect(locator).toBeVisible({ timeout: 1000 * 5 }),
    ]);
    await locator.click();
    await this.waitForNavigation();
    await sleepRandom();
  }

  async scrollabit() {
    // Scroll down multiple times with delay to simulate natural scrolling
    for (let i = 0; i < random(6, 9); i++) {
      // Occasionally scroll up slightly (1 in 8 chance)
      const direction = Math.random() > 0.875 ? -1 : 1;
      await this.page.mouse.wheel(0, direction * random(1024, 2048));
      await sleepRandom();
    }
  }

  async ai(background: string, scenario: scenario) {
    const result = await askAI({
      feature: this.feature,
      background,
      scenario: {
        tone: rando(tones),
        range: "10-50",
        ...scenario,
      },
    });
    return result.startsWith('"') && result.endsWith('"') ? result.slice(1, -1) : result;
  }

  error(message: string, cause?: unknown) {
    return new Error(`[${this.feature}] - [${this.START_URL}] ${message}`, { cause });
  }

  bang<T>(message: string, expect: T, source?: unknown) {
    if (expect) return expect;
    throw this.error(message, { source, expect });
  }

  async find(ids: string[], strategy: "testId" | "selector" | "text" = "testId") {
    for (const id of ids) {
      const locator =
        strategy === "testId"
          ? this.page.getByTestId(id)
          : strategy === "selector"
          ? this.page.locator(id)
          : this.page.getByText(id);

      const count = await locator.count();

      if (count > 0) {
        return { count, locator, id };
      }
    }

    throw this.error(`No elements found for IDs: ${ids.join(", ")} using strategy: ${strategy}`);
  }

  // Separate function for frames
  async findFrame(selectors: string[]) {
    for (const selector of selectors) {
      try {
        const frame = this.page.frameLocator(selector);
        const frameHandle = await this.page.$(selector);
        const contentFrame = frameHandle ? await frameHandle.contentFrame() : null;

        if (contentFrame) {
          return { frame, frameHandle, contentFrame, selector };
        }
      } catch (e) {
        // Continue to next selector if this one failed
        console.warn(`Failed to find frame for selector: ${selector}`, e);
        continue;
      }
    }

    throw this.error(`No frames found for selectors: ${selectors.join(", ")}`);
  }
}

export default Base;
