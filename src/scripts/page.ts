// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom, tryForEach } from "../lib/utils.js";
import { askAI, Scenario, tones } from "../lib/ask.js";
import { Opts } from "./types.js";

export class Base{
  timout: number;
  constructor(readonly page: Page, readonly opts: Opts<unknown>) {
    this.timout = 1000 * 60 * opts.settings.timeouts.navigate;
    this.page.setDefaultNavigationTimeout(this.timout);
    this.page.setDefaultTimeout(1000 * 60 * opts.settings.timeouts.default);
  }

  async navigate(url: string) {
    await this.page.goto(url);
    await this.waitForNavigation();
  }

  async waitForNavigation() {
    return await tryForEach([
      this.page.waitForLoadState("load", { timeout: this.timout }),
      this.page.waitForLoadState("domcontentloaded", { timeout: this.timout }),
      // this.page.waitForLoadState("networkidle", { timeout: this.timout }),
    ]);
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
    return locator.nth(Math.min(
      random(this.opts.settings.rando.min, this.opts.settings.rando.max), rando(count))
    );
  }

  async click(locator: Locator, timeout = 1000 * this.opts.settings.timeouts.wait) {
    await this.nap();

    // Expect for the element to be enabled and visible
    const expecto = await tryForEach([
      locator.click({ timeout, force: true }),
      expect(locator).toBeEnabled({ timeout }),
      expect(locator).toBeVisible({ timeout }),
    ]);
    this.bang(`expecto: ${locator}`, !expecto.errors.length || expecto.fulfilled.length); // Added bang for fulfilled check

    // Wait for the element to be in the viewport and scroll into view
    const locato = await tryForEach([
      locator.waitFor({ timeout }),
      locator.scrollIntoViewIfNeeded({ timeout }),
    ]);
    this.bang(`locato: ${locator}`, !locato.errors.length || locato.fulfilled.length); // Added bang for errors check


    await this.nap();
  }

  async scrollabit() {
    // Scroll down multiple times with delay to simulate natural scrolling
    for (let i = 0; i < random(3, 9); i++) {
      await this.nap(); 
      try {
        // if already scrolled till end break
        const { scrollTop, scrollHeight, clientHeight } = await this.page.evaluate(() => {
          return {
            scrollTop: window.scrollY,
            clientHeight: document.documentElement.clientHeight,
            scrollHeight: document.body.scrollHeight,
          };
        });

        // Throws when at bottom or can't scroll further
        this.bang(
          `scrollHeight: ${scrollHeight}, scrollTop: ${scrollTop}, clientHeight: ${clientHeight}`,
          scrollTop + clientHeight < scrollHeight
        );
      } catch (e) {
        break;
      }
      // Occasionally scroll up slightly (1 in 8 chance)
      const direction = i > 0 && Math.random() > 0.875 ? -1 : 1;
      await this.page.mouse.wheel(0, direction * random(1024, 2048));
    }
  }

  async nap(
    args: { min: number; max: number; multiplier?: number } = {
      min: this.opts.settings.timeouts.rando.min,
      max: this.opts.settings.timeouts.rando.max,
      multiplier: this.opts.settings.timeouts.rando.multiplier,
    }
  ) {
    await sleepRandom(args);
    await this.page.waitForTimeout(random(args.min, args.max) * (args.multiplier || random(2, 4)));
    await this.waitForNavigation();
  }

  async ai(background: string, scenario: Scenario) {
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
    console.log(`[Banger] Message: ${message}`, expect, source);
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
