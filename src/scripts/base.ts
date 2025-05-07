// src/scripts/pages/base.page.ts
import { BrowserContext, Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom, tryForEach, Rando } from "../lib/utils.js";
import { promptee, tones } from "../lib/ask.js";
import { Decorations, Generators, Opts, Timeouts } from "./types.js";

export abstract class Base {
  readonly visited: string[] = [];
  readonly toner = tones;
  readonly propter = promptee;
  public page!: Page;
  constructor(
    readonly ctx: BrowserContext,
    readonly opts: Opts<unknown>,
    readonly scenario: (url: string) => Promise<number | unknown>,
    readonly rando: number = random(opts.settings.start.rando.min, opts.settings.start.rando.max),
    public iterations: number = random(
      opts.settings.start.iterations.min,
      opts.settings.start.iterations.max
    ),
    public variations: number = random(
      opts.settings.start.variations.min,
      opts.settings.start.variations.max
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
      console.error("Error navigating to URL:", e);
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
    return this.bang(
      "Element not found in" + selector,
      await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim())
    );
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

  async ask(task: string, generate: Partial<Generators>, decorate: Partial<Decorations> = {}) {
    const result = await this.propter({
      ...this.opts.ai,
      task: task,
      decorators: {
        ...this.opts.ai.decorators,
        ...decorate,
      },
      generations: {
        ...this.opts.ai.generations,
        ...generate,
      },
    });
    return result;
  }

  error(message: string, cause?: unknown) {
    return new Error(
      `[${this.opts.settings.start.feature}] - [${JSON.stringify(this.opts.settings.start)}] ${message}`,
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
