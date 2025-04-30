// src/scripts/pages/base.page.ts
import { BrowserContext, Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom, tryForEach } from "../lib/utils.js";
import { askAI, Scenario, tones } from "../lib/ask.js";
import { Opts, Timeouts } from "./types.js";

export class Base {
  page!: Page;
  timeouts: Timeouts;
  iterations: number;
  variations: number;
  rando: number;
  constructor(readonly context: BrowserContext, readonly opts: Opts<unknown>) {
    this.rando = random(opts.settings.start.rando.min, opts.settings.start.rando.max);
    this.iterations = random(opts.settings.start.iterations.min, opts.settings.start.iterations.max);
    this.variations = random(opts.settings.start.variations.min, opts.settings.start.variations.max);
    this.timeouts = {
      ...opts.settings.timeouts,
      navigate: 1000 * opts.settings.timeouts.navigate,
      default: 1000 * opts.settings.timeouts.default,
      wait: 1000 * opts.settings.timeouts.wait,
    };
  }
  async onTry(): Promise<void | Error> {
    throw this.error("onTry not implemented");
  }
  async onRetry() {
    throw this.error("onRetry not implemented");
  }

  async init() {
    this.page = this.opts.settings.start.new
      ? await this.context.newPage()
      : this.context.pages()[this.context.pages().length - 1];
    this.page.setDefaultTimeout(this.timeouts.default);
    this.page.setDefaultNavigationTimeout(this.timeouts.navigate);

    await this.navigate(this.opts.settings.start.url); // Added navigation to the start URL
    await this.nap();
  }

  async navigate(url: string | undefined) {
    if (url) await this.page.goto(url);
    await this.waitForNavigation();
  }

  async waitForNavigation(timeout = this.timeouts.navigate) {
    return await tryForEach([
      this.page.waitForLoadState("load", { timeout }),
      this.page.waitForLoadState("domcontentloaded", { timeout }),
    ]);
  }

  async getFocusedElement() {
    return this.page.evaluate(() => {
      const element = document.activeElement;
      return {
        element,
        tagName: element?.tagName,
        ariaLabel: element?.ariaLabel,
        textContent: element?.textContent,
      };
    });
  }

  async txtContent(selector: string, locator?: Locator) {
    const element = locator?.locator(selector).first() || this.page.locator(selector).first();
    await expect(element).toBeVisible();
    return this.bang(
      "Element not found in" + selector,
      await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim())
    );
  }

  async selectAll(locator?: Locator) {
    const modifierKey = process.platform === "win32" ? "Control" : "Meta";
    if(locator) await locator.press(`${modifierKey}+A`);
    else await this.page.keyboard.press(`${modifierKey}+A`);
  }

  async type(text: string) {
    await this.page.keyboard.type(text, {
      delay: random(64, 128),
    });
  }

  async pressSequentially(locator: Locator, text: string, click = true) {
    if (click) await this.click(locator);
    await locator.pressSequentially(text, {
      delay: random(64, 128),
      timeout: 1000 * 60 * 5,
    });
  }

  async click(locator: Locator, timeout = this.timeouts.wait) {
    await this.nap();

    // Expectorations
    const expecto = await tryForEach([
      expect(locator).toBeEnabled({ timeout }),
      expect(locator).toBeVisible({ timeout }),
    ]);
    this.bang(`expecto: ${locator}`, !expecto.errors.length || expecto.fulfilled.length); // banger

    // Locatorations
    const locato = await tryForEach([
      locator.waitFor({ timeout }),
      locator.scrollIntoViewIfNeeded({ timeout }),
      locator.click({ timeout, force: true }),
    ]);
    this.bang(`locato: ${locator}`, !locato.errors.length || locato.fulfilled.length); // banger

    await this.nap();
  }

  async scrollabit() {
    // Scroll down multiple times with delay to simulate natural scrolling
    for (let i = 0; i < random(3, 6); i++) {
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
      min: this.timeouts.naps.min,
      max: this.timeouts.naps.max,
      multiplier: this.timeouts.naps.multiplier,
    }
  ) {
    const sleepo = await sleepRandom(args);
    await this.page.waitForTimeout(sleepo);
    await this.waitForNavigation();
  }

  async ai(background: string, scenario: Scenario) {
    const result = await askAI({
      feature: this.opts.settings.start.feature,
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
    return new Error(
      `[${this.opts.settings.start.feature}] - [${this.opts.settings.start.url}] ${message}`,
      { cause }
    );
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
