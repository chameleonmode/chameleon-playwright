// src/scripts/pages/base.page.ts
import { Locator, Page, expect } from "@playwright/test";
import { rando, ror, sleepo, tryForEach, trySequentially } from "../lib/utils.js";
import { Opts } from "../lib/types/index.js";
import { Logger } from "../lib/logger.js";
import { Player } from "./player.js";

export abstract class Actor {
	readonly player = new Player(this);
	constructor(
		readonly page: Page,
		readonly opts: Opts<unknown>,
		readonly scenario: (url: string) => Promise<number | unknown>
	) {}
	abstract status(): unknown;
	abstract onWhile(url: string): Promise<void | Error>;
	abstract onReIteration(url: string): Promise<void | Error>;

	async init() {
		this.page.setDefaultTimeout(this.opts.settings.timeouts.default);
		this.page.setDefaultNavigationTimeout(this.opts.settings.timeouts.navigate);
	}

	async navigate(url: string | undefined, attempt = 0) {
		try {
			if (url) await this.page.goto(url, { waitUntil: "load" });
			await this.waitForNavigation();
			await this.nap();
		} catch (e) {
			Logger.error("Error navigating to URL:", e);
			await sleepo({ min: 1000 * 7, max: 1000 * 14, multiplier: 1 });
			this.bang(
				"checking navigation attempts",
				this.opts.settings.start.attempts > attempt++,
				this.opts.settings.start.attempts
			);
			await this.navigate(url, attempt);
		}
	}

	async waitForNavigation(timeout = this.opts.settings.timeouts.navigate) {
		return await trySequentially([
			() => this.page.waitForLoadState("load", { timeout }),
			() => this.page.waitForLoadState("domcontentloaded", { timeout }),
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
		const location = locator?.locator(selector) || this.page.locator(selector);
		const locations = await location.count();
		this.bang(`firstVisible: ${location}`, locations > 0, { location, locations }, { print: false }); // banger

		for (let i = 0; i < locations; i++) {
			const element = location.nth(i);
			await sleepo(this.opts.settings.timeouts.naps);
			if (await element.isVisible()) {
				await element.scrollIntoViewIfNeeded();
				const text = await element.evaluate((ele) => ele?.textContent?.replace(/\s+/g, " ").trim());
				if (!text) continue; // Skip if no text content
				return this.bang("txtContent: " + selector, text, { element, text }, { print: false });
			}
		}
		throw ror(`No visible elements found for selector: ${location}`, { locations, location });
	}

	async attributes(locator: Locator) {
		const attributes = await locator.evaluate((node) => {
			const attrs: Record<string, string> = {};
			for (const attr of node.attributes) {
				attrs[attr.name] = attr.value;
			}
			return attrs;
		});
		return this.bang("attributes: " + locator, attributes, { locator, attributes }, { print: false });
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

	async assert(locator: Locator, { timeout = 1000 * 6 } = {}) {
		// Expectorations
		const expecto = await tryForEach([
			expect(locator).toBeEnabled({ timeout }),
			expect(locator).toBeVisible({ timeout }),
		]);
		this.bang(`expecto: ${locator}`, !expecto.errors.length || expecto.fulfilled.length, expecto); // banger

		// Locatorations
		await locator.waitFor({ timeout });
		return this.bang(`assert: ${locator}`, locator, { timeout, locator });
	}

	async click(locator: Locator, options?: { strict?: boolean; timeout?: number }): Promise<Locator>;
	async click(selector: string, options?: { strict?: boolean; timeout?: number }): Promise<Locator>;
	async click(
		thang: string | Locator,
		options: { strict?: boolean; timeout?: number } = {}
	): Promise<Locator> {
		const locator = typeof thang === "string" ? this.page.locator(thang).first() : thang;
		const { strict = true, timeout = this.opts.settings.timeouts.wait } = options;
		await this.nap();
		const count = await locator.count();
		this.bang("checking element count", count, { locator, count }); // banger

		if (strict) {
			// Ensure the locator is visible and enabled before clicking
			await this.assert(locator, { timeout });
		}

		// Click the locator
		const locato = await trySequentially(
			[
				async () => await locator.scrollIntoViewIfNeeded({ timeout }),
				async () => await locator.click({ timeout, force: true }),
			],
			{ first: false }
		);
		this.bang(`locato: ${locator}`, !locato.errors.length || locato.fulfilled.length, locato); // banger

		await this.nap();
		return this.bang(`click: ${locator}`, locator, { options, locator });
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
				const direction = i > 0 && Math.random() > 0.875 ? -1 : 1;
				const y = direction * rando(clientHeight / 2, clientHeight);

				// Throws when at bottom or can't scroll further
				this.bang(
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
						throw ror(`Unknown strategy: ${strategy}`);
				}
			})();

			try {
				const firstVisible = async (current: Locator, depth = 18, timeout = 36): Promise<Locator> => {
					// Logger.log(`Finding visible ancestor for ${selector} with max depth ${maxDepth}`);

					for (const location of await current.all()) {
						if (await location.isVisible({ timeout }).catch(() => false)) return location;

						const siblings = location.locator(":scope > *"); // all children of the parent
						for (const sibling of await siblings.all()) {
							// Logger.log(`Sibling: <${location}>`, sibling);
							if (await sibling.isVisible({ timeout }).catch(() => false)) return sibling;
						}
						if (depth > 0) return firstVisible(location.locator(".."), depth - 1);
					}
					throw ror(`Max depth reached while finding visible ancestor for ${selector}`);
				};
				const locator = strategy === "testId" ? target : await firstVisible(target);
				return { target, locator, selector, count: await locator.count() };
			} catch (e) {
				Logger.warn(`Failed to resolve ${strategy} locator for ${selector}`, e);
			}
		}

		throw ror(`No elements found for IDs: ${ids.join(", ")} using strategy: ${strategy}`);
	}

	async findAll(ids: string[]) {
		const locations = [];
		for (const selector of ids) {
			const location = await this.find([selector], "selector").catch(() => false);
			if (!location) continue; // Skip if not found
			locations.push(location);
		}

		if (locations.length === 0) throw ror(`No elements found for IDs: ${ids.join(", ")}`);
		else return locations;
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

		throw ror(`No frames found for selectors: ${selectors.join(", ")}`);
	}

	// Take a screenshot of the page or a specific locator
	async screenshot(locator: Locator) {
		return (
			await locator.screenshot({
				scale: "css",
				type: "jpeg",
				quality: 72,
			})
		).toString("base64");

		// if (clip) {
		// 	const { width, height } = await this.dimensions();
		// 	return (
		// 		await this.page.screenshot({
		// 			fullPage: true,
		// 			scale: "css",
		// 			type: "jpeg",
		// 			quality: 18,
		// 		})
		// 	).toString("base64");
		// }
		// return (await this.page.screenshot({ fullPage: false })).toString("base64");
	}

	bang<T>(
		message: string,
		expect: T,
		source: unknown,
		{ print = true, caller = Logger.getCallerLine() } = {}
	) {
		if (print) {
			Logger.debug(
				`bang/${this.opts.settings.start.feature}`,
				`\x1b[38;5;208mmessage:\x1b[0m`,
				message,
				`\n`,
				`expect:`,
				expect,
				`\n`,
				`source:`,
				source,
				`\n`,
				"caller: {\n\t",
				caller.method,
				`\n\t`,
				caller.filename,
				"\n",
				"}"
			);
		}
		if (expect) return expect;
		throw ror(message, { source, expect });
	}

	bing<T>(message: string, expect: unknown, returnz: T, source: unknown) {
		const caller = Logger.getCallerLine();
		if (this.bang(message, expect, source, { caller })) return returnz;
		throw ror(message, { source, expect });
	}
}
