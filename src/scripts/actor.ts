// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { rando, er, sleepo, tryForEach, bang, delay } from "../lib/utils.js";
import { Opts, state } from "../lib/index.js";
import { Logger } from "../lib/logger.js";
import { Player } from "./player.js";

export abstract class Actor<T> {
	readonly player = new Player(this);
	constructor(
		readonly page: Page,
		readonly opts: Opts<T>,
		readonly scenario: (url: string) => Promise<number | unknown>
	) {
		state.ai = opts.ai;
	}
	abstract onWhile(url: string): Promise<void | Error>;
	abstract onReIteration(url: string): Promise<void | Error>;

	async init() {
		this.page.setDefaultTimeout(this.opts.settings.timeouts.default);
		this.page.setDefaultNavigationTimeout(this.opts.settings.timeouts.navigate);
	}

	async navigate(url: string, attempt = 0) {
		try {
			if (url) await this.page.goto(url, { waitUntil: "load" });
			await this.waitForNavigation();
			await this.nap();
		} catch (e) {
			Logger.error("Error navigating to URL:", e);
			await sleepo({ min: 1000 * 7, max: 1000 * 14, multiplier: 1 });
			bang(
				"checking navigation attempts",
				this.opts.settings.start.attempts > attempt,
				this.opts.settings.start.attempts
			);
			await this.navigate(url, attempt + 1);
		}
	}

	async waitForNavigation(timeout = this.opts.settings.timeouts.navigate) {
		await this.page.waitForLoadState("load", { timeout });
		await this.page.waitForLoadState("domcontentloaded", { timeout });
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

	async txtContent(selector: string, within?: Locator) {
		const locator = within?.locator(selector) || this.page.locator(selector);
		let looper = 0;
		for (const location of await locator.all()) {
			if (!(await location.isVisible())) continue; // Skip if not visible

			if (looper++ > 3) {
				await sleepo(this.opts.settings.timeouts.naps);
				await location.scrollIntoViewIfNeeded();
			}
			const text = await location.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim());
			if (text) return bang("txtContent " + selector, text, { location, text }, { print: false });
		}
		throw er(`No visible elements found for ${selector}`, locator);
	}

	async attributes(locator: Locator) {
		const attributes = await locator.evaluate((node) => {
			const attrs: Record<string, string> = {};
			for (const attr of node.attributes) {
				attrs[attr.name] = attr.value;
			}
			return attrs;
		});
		return bang("attributes " + locator, attributes, { locator, attributes }, { print: false });
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
		await this.nap();
	}

	async assert(locator: Locator, { timeout = 1000 * 6 } = {}) {
		// Expectorations
		const expecto = await tryForEach([
			expect(locator).toBeEnabled({ timeout }),
			expect(locator).toBeVisible({ timeout }),
		]);
		bang(`expecto ${locator}`, !expecto.errors.length || expecto.fulfilled.length, expecto); // banger

		// Locatorations
		await locator.waitFor({ timeout });
		return bang(`assert ${locator}`, locator, { timeout, locator });
	}

	async click(thang: string | Locator, options: { timeout?: number } = {}): Promise<Locator> {
		const { timeout = this.opts.settings.timeouts.wait } = options;
		await this.nap();
		const things = typeof thang === "string" ? this.page.locator(thang) : thang;
		const count = await things.count();
		const locator =
			count > 1
				? await (async () => {
						let nth = -1;
						while (++nth < count) {
							const locator = things.nth(nth);
							if (await locator.isVisible({ timeout })) return locator;
						}
				  })()
				: things;
		const locatoree = bang("checking element count", locator, { locator, count }); // banger

		// Ensure the locator is visible and enabled before clicking
		await this.assert(locatoree, { timeout });

		// Click the locator
		await locatoree.click({ timeout, force: true });
		await this.nap();
		return bang(`clicked locator`, locator, { locator });
	}

	async waitabit<T>(promise: Promise<T>) {
		await this.scrollabit();
		let racer = await Promise.race([promise, delay(100)]);
		while (typeof racer === "number"){
			await this.scrollabit(3);
			racer = await Promise.race([promise, delay(100)]);
		}
		// racer = await Promise.race([promise, delay(100)]);
		// if (typeof racer === "number") await this.scrollabit(3);
		// racer = await Promise.race([promise, delay(100)]);
		// if (typeof racer === "number") await this.scrollabit();
		return await promise;
	}

	async scrollabit(times = rando(3, 6)) {
		// Scroll down multiple times with delay to simulate natural scrolling
		for (let i = 0; i < times; i++) {
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
				const direction =
					(i > 0 && Math.random() > 0.875) || scrollTop + clientHeight >= scrollHeight ? -1 : 1;
				const y = direction * rando(clientHeight / 2, clientHeight);

				// Throws when at bottom or can't scroll further
				bang(
					`Scroll attempt ${i + 1}/${times}: ${y} (direction: ${direction})`,
					y + clientHeight <= scrollHeight || scrollTop + clientHeight <= scrollHeight,
					{ y, scrollTop, clientHeight, scrollHeight }
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

	async nap(args?: { min?: number; max?: number; multiplier?: number }) {
		const qargs = { ...this.opts.settings.timeouts.naps, ...args };
		const sleep = await sleepo(qargs);
		await this.page.waitForTimeout(sleep);
		await this.waitForNavigation();
	}

	// Find elements by testId, selector, or text
	// This function will return the first found element based on the strategy
	async find(ids: string[], strategy: "testId" | "selector" | "text") {
		for (const selector of ids) {
			const target = (() => {
				switch (strategy) {
					case "testId":
						return this.page.getByTestId(selector);
					case "selector":
						return this.page.locator(selector);
					case "text":
						return this.page.getByText(selector);
					default:
						throw er(`Unknown strategy: ${strategy}`);
				}
			})();

			try {
				const firstVisible = async (current: Locator, depth = 18, timeout = 36): Promise<Locator> => {
					for (const location of await current.all()) {
						if (await location.isVisible({ timeout })) return location;

						const siblings = location.locator(":scope > *"); // all children of the parent
						for (const sibling of await siblings.all()) {
							if (await sibling.isVisible({ timeout })) return sibling;
						}
						if (depth > 0) return firstVisible(location.locator(".."), depth - 1, timeout * 2);
					}
					throw er(`Max depth reached while finding visible ancestor for ${selector}`);
				};
				const locator = strategy === "testId" ? target : await firstVisible(target);
				return { target, locator, selector, count: await locator.count() };
			} catch (e) {
				Logger.warn(`Failed to resolve ${strategy} locator for ${selector}`, e);
			}
		}

		throw er(`No elements found for IDs: ${ids.join(", ")} using strategy: ${strategy}`);
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

		throw er(`No frames found for selectors: ${selectors.join(", ")}`);
	}

	// Take a screenshot of the page or a specific locator
	async screenshot(locator: Locator) {
		return (
			await locator.screenshot({
				// path: ".cache/screenshot.png",
				scale: "css",
				type: "jpeg",
				quality: 72,
			})
		).toString("base64");
	}
}
