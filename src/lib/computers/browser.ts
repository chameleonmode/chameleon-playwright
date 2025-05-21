import { spawn } from "node:child_process";
import { Page, Browser, chromium, BrowserContext } from "@playwright/test";
import { getChromePath } from "../utils.js";
import { run } from "../runner.js";
import { req } from "../requests.js";
import { Logger } from "../logger.js";

export type Funkaroo = {
  funk: string;
  args: any;
};

// Optional: key mapping if your model uses "CUA" style keys
export const CUA_KEY_TO_PLAYWRIGHT_KEY: Record<string, string> = {
  "/": "Divide",
  "\\": "Backslash",
  alt: "Alt",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  arrowup: "ArrowUp",
  backspace: "Backspace",
  capslock: "CapsLock",
  cmd: "Meta",
  ctrl: "Control",
  delete: "Delete",
  end: "End",
  enter: "Enter",
  esc: "Escape",
  home: "Home",
  insert: "Insert",
  option: "Alt",
  pagedown: "PageDown",
  pageup: "PageUp",
  shift: "Shift",
  space: " ",
  super: "Meta",
  tab: "Tab",
  win: "Meta",
};

export async function cua<T>(input: any[], display: { width: number; height: number }) {
  const body = { input, display };
  const headers = { ai: "cua", type: "roo" };
  return await req<T>("/promptee/agent", { body, headers });
}

export class Playwrighteer {
  [key: string]: any; // Add index signature to allow string indexing
  browser?: Browser;
  ctx?: BrowserContext;
  page!: Page;
  readonly funkers: Funkaroo[] = [];
  constructor() {}

  async setup({
    dir = "/Users/dev/Library/Application Support/Chameleon/Chrome/29256",
    port = 9613,
  }): Promise<{ port: number; browser: Browser }> {
    const connect = async () => {
      // Try to connect to an already running Chrome instance
      const browser = await chromium.connectOverCDP(`http://localhost:${port}`);
      const contexts = browser.contexts();
      return { port, browser };
    };
    try {
      return await connect();
    } catch (error) {
      const chromePath = getChromePath(); // your platform-specific lookup
      const args = [
        "--disable-extensions",
        `--profile-directory=Default`,
        `--user-data-dir=${dir}`,
        `--remote-debugging-port=${port}`,
      ];
      // spawn detached so Chrome keeps running after your script exits:
      const child = spawn(chromePath, args, {
        detached: true,
        stdio: "ignore",
      });
      // allow parent to exit independently:
      child.unref();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return await this.setup({ dir, port });
    }
  }

  async runner(args: string[]) {
    const [file, port, dir, opts] = args;
    const { port: ported } = await this.setup({ dir, port: port ? parseInt(port, 10) : 9613 });

    await run({
      file,
      port: ported,
      opts: opts ? JSON.parse(opts) : opts,
    });
  }

  async cua(args: string) {
    const {
      dir = "/Users/dev/Library/Application Support/Chameleon/Chrome/29256",
      port = 9613,
      inputs = [
        { role: "user", content: "go to https://loadmill-center-12baa23ad9e4.herokuapp.com/" },
        { role: "user", content: "Start a new chat" },
        { role: "user", content: "Write a hello world message in the chat and Send it" },
        { role: "user", content: "Go back to the previous page" },
        { role: "user", content: "Go to the agent login" },
        { role: "user", content: "Enter user login info a@b.com and the pass 123456 and login" },
        { role: "user", content: "reply 'ok' to the first message" },
        //
      ],
    } = JSON.parse(args) as {
      dir: string;
      port: number;
      inputs: { role: string; content: string }[];
    };
    const { browser } = await this.setup({ dir, port });
    this.browser = browser;
    this.ctx = this.browser.contexts()[0] || await this.browser.newContext();
    this.page = await this.ctx.newPage();

    const items = [
      {
        role: "system",
        content: "You running on nodeJS + playwright + " + process.platform,
      },
      {
        role: "developer",
        content: "Use the back() or goto() functions to navigate the browser",
      },
    ];
    const shifted = [];
    while (inputs.length) {
      const input = inputs.shift();
      if (!input) break;
      try {
        shifted.push(input);
        const response = await this.runFullTurn([...items, input]);
        items.push(...response);
      } catch (e) {
        Logger.warn("", e);
        inputs.unshift(shifted.pop() || input);
      }
    }
  }

  async handleItem(item: {
    type: string;
    name: string;
    arguments: string;
    call_id: string;
    content: any[];
    summary: any[];
    action: { [x: string]: any; type: any };
    pending_safety_checks: any[];
  }) {
    Logger.debug("handleItem", { ...item });
    /** Handle each item; may cause a computer action + screenshot. **/
    if (item.type === "message") {
      Logger.debug(item.content[0]);
    }
    if (item.type === "reasoning") {
      Logger.debug(item.summary[0]);
    } else if (item.type === "function_call") {
      const funk = item.name;
      const args = JSON.parse(item.arguments);
      const functioneer = {
        type: "function_call_output",
        call_id: item.call_id,
        output: await this.funkytime({ funk, args }), // hard-coded output for demo
      };

      return [functioneer];
    } else if (item.type === "computer_call") {
      const { type: funk, ...args } = item.action;

      // perform the action on the computer
      await this.funkytime({ funk, args });

      // handle safety checks
      const pendingChecks = item.pending_safety_checks || [];
      for (const check of pendingChecks) {
        const message = check.message;
        this.acknowledgeSafetyCheckCallback(message);
      }
      const callOutput = {
        type: "computer_call_output",
        call_id: item.call_id,
        acknowledged_safety_checks: pendingChecks,
        output: {
          type: "input_image",
          image_url: `data:image/png;base64,${await this.screenshot()}`,
        },
      };
      return [callOutput];
    }

    return [];
  }

  async runFullTurn(inputItems: any[]) {
    const newItems = [];

    // keep looping until we get a final assistant response
    while (newItems.length === 0 || newItems[newItems.length - 1].role !== "assistant") {
      const response: { output: any } = await cua<{ output: any[] }>(
        inputItems.concat(newItems),
        await this.getDimensions()
      );
      // previous: { response: { id: newItems[0]?.id } },

      if (!response.output) {
        Logger.error("", response);
        throw new Error("No output from model");
      }

      newItems.push(...response.output);

      for (const item of response.output) {
        // handle each item
        const handled = await this.handleItem(item);
        newItems.push(...handled);
      }
    }

    return newItems;
  }

  async teardown() {
    await this.page?.close();
  }

  // --- Computer methods ---
  async funkytime(funka: Funkaroo) {
    Logger.log("Funky time:", funka);

    // delay to let each item process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Perform the action based on the name and args
    const { funk, args } = funka;

    // Focus the page before performing any action
    await this.page.focus("body");
    if (funk !== "screenshot") {
      const frunker = this.funkers.length ? this.funkers[this.funkers.length - 1] : undefined;
      Logger.debug("frunker !== funker", frunker !== funka, JSON.stringify(frunker), JSON.stringify(funka));
      if (!frunker || frunker !== funka) await this[funk](args);
      this.funkers.push(funka);
    }
    return await new Promise((resolve) => setTimeout(() => resolve("success"), 3000));
  }

  async getDimensions() {
    const viewport =
      this.page.viewportSize() ||
      (await this.page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
        };
      }));
    return viewport ?? { width: 1024, height: 768 };
  }

  // --- Common "Computer" actions ---
  async screenshot() {
    /**
     * Capture only the viewport (not full_page).
     */
    const pngBuffer = await this.page.screenshot({ fullPage: false });
    return pngBuffer.toString("base64");
  }

  async click(args: { x: any; y: any; button?: "left" | undefined }) {
    const { x, y, button = "left" } = args;
    await this.page.mouse.click(x, y, { button: button || "left" });
  }

  async doubleClick(args: { x: any; y: any }) {
    const { x, y } = args;
    await this.page.mouse.dblclick(x, y);
  }

  async scroll(args: { x: any; y: any; scroll_x: any; scroll_y: any }) {
    const { x, y, scroll_x, scroll_y } = args;
    await this.page.mouse.move(x, y);
    await this.page.evaluate(`window.scrollBy(${scroll_x}, ${scroll_y})`);
  }

  async type(args: { text: any }) {
    const { text } = args;
    await this.page.keyboard.type(text);
  }

  async wait(args: { ms?: number } = {}) {
    const { ms = 1000 } = args;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async move(args: { x: any; y: any }) {
    const { x, y } = args;
    await this.page.mouse.move(x, y);
  }

  async keypress(args: { keys: any }) {
    const { keys } = args;
    const mappedKeys = keys.map((key: string) => CUA_KEY_TO_PLAYWRIGHT_KEY[key.toLowerCase()] || key);

    // Press all keys down
    for (const key of mappedKeys) {
      await this.page.keyboard.down(key);
    }

    // Release all keys in reverse order
    for (const key of mappedKeys.reverse()) {
      await this.page.keyboard.up(key);
    }
  }

  async drag(args: { path: any }) {
    const { path } = args;
    if (!path || path.length === 0) return;

    await this.page.mouse.move(path[0].x, path[0].y);
    await this.page.mouse.down();

    for (const point of path.slice(1)) {
      await this.page.mouse.move(point.x, point.y);
    }

    await this.page.mouse.up();
  }

  // --- Extra browser-oriented actions ---
  async goto(args: { url: any }) {
    const { url } = args;
    try {
      return await this.page.goto(url);
    } catch (e) {
      Logger.error(`Error navigating to ${url}: ${e}`);
    }
  }

  async back() {
    return await this.page.goBack();
  }

  async forward() {
    return await this.page.goForward();
  }
}
