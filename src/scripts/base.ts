// src/scripts/pages/base.page.ts
import { BrowserContext, Locator, Page, expect } from "@playwright/test";
import { random, rando, sleepRandom, tryForEach } from "../lib/utils.js";
import { promptee, tones } from "../lib/ask.js";
import {
  Actionable,
  Click,
  Decorations,
  Generators,
  Input,
  Keypress,
  Opts,
  Rando,
  Scroll,
  Timeouts,
  Type,
} from "../lib/types/index.js";
import { Logger } from "../lib/logger.js";

export abstract class Base {
  readonly visited: string[] = [];
  readonly toner = tones;
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
    return this.bang(
      "Element txt content" + selector,
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
          scrollTop + clientHeight <= scrollHeight
        );

        // Occasionally scroll up slightly (1 in 8 chance)
        const direction = i > 0 && Math.random() > 0.875 ? -1 : 1;
        await this.page.mouse.wheel(0, direction * random(clientHeight / 2, clientHeight));
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
        Logger.warn(`Failed to find frame for selector: ${selector}`, e);
        continue;
      }
    }

    throw this.error(`No frames found for selectors: ${selectors.join(", ")}`);
  }

  async ask(opts: { task: string; generate: Generators }) {
    const result = await promptee<Input[]>({
      ...this.opts.ai,
      task: opts.task,
      generations: opts.generate,
    });
    return result;
  }

  async handles(act: Actionable) {
    // Given a computer action (e.g., click, double_click, scroll, etc.),
    // execute the corresponding operation on the Playwright page.

    try {
      switch (act.type) {
        case "click": {
          const { x, y, button = "left" } = act.action as Click;
          Logger.log(`Action: click at (${x}, ${y}) with button '${button}'`);
          await this.page.mouse.click(x, y, { button: button as any });
          break;
        }

        case "scroll": {
          const { x, y, scroll_x, scroll_y } = act.action as Scroll;
          Logger.log(
            `Action: scroll at (${x}, ${y}) with offsets (scrollX=${scroll_x}, scrollY=${scroll_y})`
          );
          await this.page.mouse.move(x, y);
          await this.page.evaluate(({ sx, sy }) => window.scrollBy(sx, sy), { sx: scroll_x, sy: scroll_y });
          break;
        }

        case "keypress": {
          const { keys } = act.action as Keypress;
          for (const k of keys) {
            Logger.log(`Action: keypress '${k}'`);
            // A simple mapping for common keys; expand as needed.
            if (k.includes("ENTER")) {
              await this.page.keyboard.press("Enter");
            } else if (k.includes("SPACE")) {
              await this.page.keyboard.press(" ");
            } else {
              await this.page.keyboard.press(k);
            }
          }
          break;
        }

        case "type": {
          const { text } = act.action as Type;
          Logger.log(`Action: type text '${text}'`);
          await this.page.keyboard.type(text);
          break;
        }

        case "wait": {
          Logger.log(`Action: wait`);
          await this.page.waitForTimeout(2000);
          break;
        }

        case "screenshot": {
          // Nothing to do as screenshot is taken at each turn
          Logger.log(`Action: screenshot`);
          break;
        }

        // Handle other actions here

        default:
          Logger.log("Unrecognized action:", act);
      }
    } catch (e) {
      Logger.error("Error handling action", act, ":", e);
    }
  }

  async handlee(action: any) {
    const keyMap: Record<string, string> = {
      ENTER: "Enter",
      ARROWLEFT: "ArrowLeft",
      ARROWRIGHT: "ArrowRight",
      ARROWUP: "ArrowUp",
      ARROWDOWN: "ArrowDown",
      ALT: "Alt",
      CTRL: "Control",
      SHIFT: "Shift",
      CMD: "Meta", // macOS Command key
    };

    const modifierKeys = new Set(["Control", "Shift", "Alt", "Meta"]);

    try {
      const page = this.page;
      const { x, y, button, path, scroll_x, scroll_y, text, keys, url } = action;

      switch (action.type) {
        case "click":
          Logger.log(`Clicking at (${x}, ${y}), ${button} button`);
          await page.mouse.click(x, y);
          break;
        case "double_click":
          Logger.log(`Double clicking at (${x}, ${y})`);
          await page.mouse.dblclick(x, y);
          break;
        case "move":
          Logger.log(`Moving mouse to (${x}, ${y})`);
          await page.mouse.move(x, y);
          break;
        case "drag":
          Logger.log("Dragging along path", path);
          if (Array.isArray(path) && path.length > 0) {
            const [firstPoint, ...restPoints] = path;
            await page.mouse.move(firstPoint.x, firstPoint.y);
            await page.mouse.down();
            for (const point of restPoints) {
              await page.mouse.move(point.x, point.y);
            }
            await page.mouse.up();
          } else {
            Logger.log("Drag action missing a valid path");
          }
          break;
        case "scroll":
          Logger.log(`Scrolling by (${scroll_x}, ${scroll_y})`);
          await page.mouse.wheel(scroll_x, scroll_y);
          break;
        case "type":
          Logger.log(`Typing text: ${text}`);
          await page.keyboard.type(text);
          break;
        case "keypress":
          Logger.log(`Pressing key: ${keys}`);
          const mappedKeys = keys.map((key: string) => keyMap[key.toUpperCase()] || key);
          const modifiers = mappedKeys.filter((key: string) => modifierKeys.has(key));
          const normalKeys = mappedKeys.filter((key: string) => !modifierKeys.has(key));

          if (
            (mappedKeys[0] === "Meta" && mappedKeys[1] === "[") ||
            (mappedKeys[0] === "Alt" && mappedKeys[1] === "ArrowLeft")
          ) {
            await page.goBack();
            break;
          }

          // Hold down modifier keys
          for (const key of modifiers) {
            await page.keyboard.down(key);
          }

          // Press normal keys
          for (const key of normalKeys) {
            await page.keyboard.press(key);
          }

          // Release modifier keys
          for (const key of modifiers) {
            await page.keyboard.up(key);
          }
          break;
        case "wait":
          Logger.log("Waiting for browser...");
          await page.waitForTimeout(1000);
          break;
        case "goto":
          Logger.log(`Navigating to ${url}`);
          await page.goto(url);
          break;
        case "back":
          Logger.log("Navigating back");
          await page.goBack();
          break;
        case "forward":
          Logger.log("Navigating forward");
          await page.goForward();
          break;
        case "screenshot":
          Logger.log("Taking a screenshot");
          break;
        default:
          Logger.log("Unknown action:", action);
      }
    } catch (error) {
      Logger.error("Error executing action:", action, error);
    }
  }
  async getScreenshotAsBase64() {
    const screenshotBuffer = await this.page.screenshot({ fullPage: true });
    return screenshotBuffer.toString("base64");
  }

  error(message: string, cause?: unknown) {
    const error = new Error(
      `[${this.opts.settings.start.feature}] - [${JSON.stringify(this.opts.settings.start)}] ${message}`,
      { cause }
    );
    Logger.error(`${message}`, cause);
    return error;
  }

  bang<T>(message: string, expect: T, source?: unknown) {
    Logger.debug(`Banging: ${message}`, expect, source);
    if (expect) return expect;
    throw this.error(message, { source, expect });
  }
}
