// src/scripts/pages/base.page.ts
import { BrowserContext, Locator, Page, expect } from "@playwright/test";
import { requests, Input, Opts, Rando, Timeouts, Output } from "../lib/types/index.js";
import { rando, sleepRandom, tryForEach, trySequentially } from "../lib/utils.js";
import { promptee } from "../lib/requests.js";
import { Logger } from "../lib/logger.js";

export abstract class Base {
  readonly visited: string[] = [];
  public page!: Page;
  constructor(
    readonly ctx: BrowserContext,
    readonly opts: Opts<unknown>,
    readonly scenario: (url: string) => Promise<number | unknown>,
    public iterations: number = rando(
      opts.settings.start.iterations.min,
      opts.settings.start.iterations.max
    ),
    readonly timeouts: Timeouts = {
      ...opts.settings.timeouts,
      navigate: 1000 * opts.settings.timeouts.navigate,
      default: 1000 * opts.settings.timeouts.default,
      wait: 1000 * opts.settings.timeouts.wait,
    }
  ) {}
  status() {
    const todo = this.opts.settings.start.urls.length;
    const done = this.visited.length;
    return { todo, done };
  }
  abstract onTry(url: string): Promise<void | Error>;
  abstract onIteration(url: string): Promise<void | Error>;

  async init() {
    this.page = this.opts.settings.start.new
      ? await this.ctx.newPage()
      : this.ctx.pages()[this.ctx.pages().length - 1];
    this.page.setDefaultTimeout(this.timeouts.default);
    this.page.setDefaultNavigationTimeout(this.timeouts.navigate);
  }

  async navigate(url: string | undefined) {
    try {
      if (url) await this.page.goto(url, { waitUntil: "load" });
      await this.waitForNavigation();
      await this.nap();
    } catch (e) {
      Logger.error("Error navigating to URL:", e);
      await sleepRandom({
        min: 1000 * 7,
        max: 1000 * 14,
        multiplier: 1,
      });
      await this.navigate(url);
    }
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

    const result = await trySequentially([
      async () => await element.scrollIntoViewIfNeeded({ timeout: this.timeouts.wait }),
    ]);
    this.banger(result, result); // banger

    const text = await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim());
    return this.bang("Element txt content" + selector, text);
  }

  async selectAll(locator?: Locator, clear = false) {
    const modifierKey = process.platform === "win32" ? "Control" : "Meta";
    await (locator ? locator.press(`${modifierKey}+A`) : this.page.keyboard.press(`${modifierKey}+A`));
    if (clear) {
      await this.nap();
      await (locator ? locator.press("Backspace") : this.page.keyboard.press("Backspace"));
    }
  }

  async type(text: string) {
    await this.page.keyboard.type(text, {
      delay: rando(64, 128),
    });
  }

  async pressSequentially(locator: Locator, text: string, click = true) {
    if (click) await this.click(locator);
    await locator.pressSequentially(text, {
      delay: rando(64, 128),
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
    for (let i = 0; i < rando(3, 6); i++) {
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

        // Occasionally scroll up slightly (1 in 8 chance)
        const direction = i > 0 && Math.random() > 0.875 ? -1 : 1;
        const y = direction * rando(clientHeight / 2, clientHeight);

        // Throws when at bottom or can't scroll further
        this.bang(
          { y, scrollTop, clientHeight, scrollHeight },
          y + clientHeight <= scrollHeight || scrollTop + clientHeight <= scrollHeight
        );

        if (rando()) await this.page.mouse.wheel(0, y);
        else
          direction > 0
            ? await this.page.keyboard.press("PageDown")
            : await this.page.keyboard.press("PageUp");
      } catch (e) {
        break;
      }
    }
  }

  async nap(
    args: Rando = {
      min: this.timeouts.naps.min,
      max: this.timeouts.naps.max,
      multiplier: this.timeouts.naps.multiplier,
    }
  ) {
    const sleepo = await sleepRandom(args);
    await this.page.waitForTimeout(sleepo);
    await this.waitForNavigation();
  }

  // Find elements by testId, selector, or text
  // This function will return the first found element based on the strategy
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

  // Find frames by selector seperate for find
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
        Logger.warn(`Failed to find frame for selector: ${selector}`, e);
        continue;
      }
    }

    throw this.error(`No frames found for selectors: ${selectors.join(", ")}`);
  }

  async dimensions() {
    return await this.page.evaluate(() => {
      return {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      };
    });
  }

  /**
   * Capture only the viewport (not full_page).
   */
  async screenshot(clip: boolean = true) {
    if (clip) {
      const { width, height } = await this.dimensions();
      return (
        await this.page.screenshot({
          fullPage: true,
          scale: "css",
          type: "jpeg",
          quality: 18,
          clip: { x: 0, y: 0, width, height: height - height / 2 },
        })
      ).toString("base64");
    }
    return (await this.page.screenshot({ fullPage: false })).toString("base64");
  }

  async ask(opts: { task: string; image: requests.Image; generations: requests.Generators }) {
    return await promptee.prompt({
      model: this.opts.ai.model,
      decorators: this.opts.ai.decorators,
      ...opts,
    });
  }

  error(message: unknown, cause?: unknown) {
    const error = new Error(
      `[${this.opts.settings.start.feature}] - [${JSON.stringify(this.opts.settings.start)}] ${message}`,
      { cause }
    );
    Logger.error(`${message}`, cause);
    return error;
  }

  bang<T>(message: unknown, expect: T, source?: unknown) {
    Logger.debug(`Banging: ${message}`, expect, source);
    if (expect) return expect;
    throw this.error(message, { source, expect });
  }

  banger<T>(expect: T, source?: unknown) {
    return this.bang(``, expect, source);
  }
}
