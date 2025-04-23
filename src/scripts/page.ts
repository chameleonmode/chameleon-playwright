// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { Opts } from "./types.js";
import { random, rando, sleepRandom, tryForEach } from "../lib/utils.js";
import { askAI, scenario, tones } from "../lib/ask.js";

export default class {
  constructor(readonly page: Page, readonly opts: Opts) {
    this.page.setDefaultNavigationTimeout(1000 * 60 * 2);
    this.page.setDefaultTimeout(opts.settings.timeout || 1000 * 30);
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

  async click(locator: Locator, seconds = 5) {
    await sleepRandom();
    await this.waitForNavigation();
    const timeout = 1000 * seconds;
    const { errors } = await tryForEach([
      locator.waitFor({ timeout }),
      locator.scrollIntoViewIfNeeded({ timeout }),
    ]);
    const { fulfilled } = await tryForEach([
      expect(locator).toBeEnabled({ timeout }),
      expect(locator).toBeVisible({ timeout }),
    ]);
    // TODO: maby bang fulfilled or errors
    await locator.click();
    await this.waitForNavigation();
    await sleepRandom();
  }

  async scrollabit() {
    // Scroll down multiple times with delay to simulate natural scrolling
    for (let i = 0; i < random(3, 6); i++) {
      // Occasionally scroll up slightly (1 in 8 chance)
      const direction = Math.random() > 0.875 ? -1 : 1;
      await this.page.mouse.wheel(0, direction * random(1024, 2048));
      await sleepRandom();
    }
  }

  async nap() {
    await sleepRandom();
    await this.page.waitForTimeout(random(256, 512) * random(2, 4));
    await this.waitForNavigation();
  }

  async ai(background: string, scenario: scenario) {
    const result = await askAI({
      feature: this.opts.start.feature,
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
    return new Error(`[${this.opts.start.feature}] - [${this.opts.start.url}] ${message}`, { cause });
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
