import { BrowserContext } from "@playwright/test";
import { random } from "../../lib/utils.js";
import { configure, Options, Scope, Sort, BASE_URL, Filter } from "./configure.js";
import { Pager } from "../pager.js";
import { Player } from "../player.js";
import { Logger } from "../../lib/logger.js";

class Scopeulation {
	readonly visited: string[] = [];
	readonly searched: string[] = [];
	constructor() {}

	subreddit(url: string) {
		const pattern = /\/r\/[^/]+\/?$/;
		return pattern.test(url);
	}

	comments(url: string) {
		const pattern = /\/r\/[^/]+\/comments(?:\/.*)?$/;
		return pattern.test(url);
	}

	search(url: string) {
		const pattern = /\/r\/[^/]+\/search(?:\/.*)?$/;
		return pattern.test(url);
	}

	user(url: string) {
		const pattern = /\/user\/[^/]+\/?$/;
		return pattern.test(url);
	}

	reStartingPoint(url: string) {
		return this.comments(url) || this.search(url) || this.user(url)
			? url
			: url.replace(/\/?$/, "/") + "search";
	}
}
export const scopeulation = new Scopeulation();
export class Reddit extends Pager {
	readonly player = new Player(this);
	// patterns scopeulation

	// ctor
	constructor(
		readonly ctx: BrowserContext,
		readonly opts: Options,
		readonly action?: (url?: string) => Promise<unknown>
	) {
		super(ctx, opts, async (url: string) => {
			Logger.log("Scenario URL:", url);
			const pre = async () => {
				if (scopeulation.user(url)) {
					await this.click(
						this.opts.args.sort === "Posts"
							? 'a[slot="page-2"]:has-text("Posts")'
							: this.opts.args.sort === "Comments"
							? 'a[slot="page-3"]:has-text("Comments")'
							: 'a[slot="page-1"]:has-text("Overview")'
					);
				}
			};

			if (action && (scopeulation.comments(url) || scopeulation.user(url))) {
				for (let i = 0; i < this.opts.settings.start.attempts; i++) {
					try {
						this.opts.settings.start.iterations = { min: 1, max: 1 };
						await pre();
						return await action(url);
					} catch (e) {
						Logger.warn("Error in action function:", e);
						await this.page.reload({ waitUntil: "load" });
					} finally {
						Logger.log("Action function completed");
						// TODO: refactoroo
						// reddit.opts.args.search.push(...searches);
						// reddit.opts.settings.start.iterations = iterations;
					}
				}
			} else if (action) {
				try {
					const expecto = await this.findo(async () => {
						await pre();
						return await action();
					});
					return expecto.index;
				} catch (e) {
					Logger.warn("Error in action function:", e);
				} finally {
					const text = this.opts.args.search[scopeulation.searched.length];
					scopeulation.searched.push(text);
					Logger.log("Action function completed", text, scopeulation.searched);
				}
			} else {
				Logger.warn("No action provided", url);
			}
			return undefined;
		});
	}

	scopeulate() {
		const scopes: Scope[] = ["People", "Communities"];
		const url = scopeulation.visited[scopeulation.visited.length - 1];
		const scope =
			scopes.includes(this.opts.args.scope) &&
			(scopeulation.subreddit(url) || scopeulation.comments(url) || scopeulation.search(url))
				? "Posts"
				: this.opts.args.scope;
		const Url = new URL(url);
		const type = Url.searchParams.get("type");
		const sort = Url.searchParams.get("sort");
		const t = Url.searchParams.get("t");
		const community = scope === "Communities" || type === "communities";
		const people = scope === "People" || type === "people" || scopeulation.user(url);
		const scoped = { url, scope, Url, type, sort, t, community, people };
		return Logger.return(`Scoped:`, scoped);
	}

	// check todo's and done
	override status() {
		const todo = this.opts.settings.start.urls.length + this.opts.args.search.length;
		const visit = this.opts.settings.start.urls.length - scopeulation.visited.length;
		const search = this.opts.args.search.length - scopeulation.searched.length;
		const searched = search === 0 && this.opts.args.search.length > 0;
		const done = scopeulation.visited.length + scopeulation.searched.length;
		const stats = { todo, done, visit, search, searched };
		return Logger.return(`Status:`, stats);
	}

	// on every try
	override async onWhile(url: string): Promise<void | Error> {
		const { visit, search, searched } = this.status();
		const basic = scopeulation.subreddit(url) || url === BASE_URL;

		// check if we have completed all urls we need to also search on
		if (searched && scopeulation.subreddit(url) && !scopeulation.visited.includes(url)) {
			scopeulation.searched.length = 0;
			return await this.onWhile(url);
		}

		// check if we have completed all terms
		return search > 0 && basic
			? await this.searcho()
			: visit > 0 && !scopeulation.visited.includes(url)
			? await this.navigato(url)
			: Logger.trace(`All terms completed.`);
	}

	// on every retry/iteration
	override async onReIteration(url: string) {
		await this.nap();
		while (!this.page.url().startsWith(scopeulation.reStartingPoint(url))) {
			await this.page.goBack({ waitUntil: "load" });
			await this.nap({ multiplier: random(3, 6) });
		}
	}

	// on navigation needed
	async navigato(url: string) {
		await this.navigate(url);
		scopeulation.visited.push(url);
	}

	// searcho when search is needed
	async searcho() {
		const url = this.opts.settings.start.urls[scopeulation.visited.length];
		const navigate = scopeulation.searched.length === 0 && !scopeulation.visited.includes(url);
		if (navigate) await this.navigato(url);
		else await this.onReIteration(scopeulation.visited[scopeulation.visited.length - 1]);

		const text = this.opts.args.search[scopeulation.searched.length];
		const locator = this.page.locator(`faceplate-search-input`);
		const textbox = locator.getByRole("textbox");
		await this.click(textbox);

		const clearButton = locator.getByRole("button", { name: "Clear search" });
		await this.click(clearButton, { timeout: 1500, strict: false }).catch(() => false);

		await this.pressSequentially(textbox, text, false);
		await this.nap({ multiplier: 3 });
		await textbox.press("Enter");
		await this.nap();
	}

	// find an active context
	async findo(funco: () => Promise<unknown>, visited: number[] = this.player.state.visited) {
		const scopeulator = this.scopeulate();
		const findulator = (() => {
			const mapper: {
				[key in Scope]: { ids: string[]; strat: "testId" | "selector" | "text" };
			} = {
				Posts: {
					ids: ["search-post-unit", "search-sdui-unit", "search-post-with-content-preview"],
					strat: "testId",
				},
				Media: { ids: ["div[data-id='search-media-post-unit']"], strat: "selector" },
				Comments: { ids: ["search-sdui-comment-unit"], strat: "testId" },
				Communities: { ids: ["search-community"], strat: "testId" },
				People: { ids: ["search-author"], strat: "testId" },
			};

			// If not a user provided URL, we might need a different scope
			return mapper[scopeulator.scope];
		})();

		// TODO: refactor --------------------------
		try {
			if (!scopeulator.type) {
				await this.click(
					scopeulator.scope === "Posts"
						? this.page.getByRole("button", { name: scopeulator.scope }).first()
						: this.page.locator(`#search-results-page-tab-${scopeulator.scope.toLowerCase()}`).first()
				);
			}

			if (visited.length === 0) {
				// Function to click a sort option by its text
				const clickSortOptionByText = async () => {
					const scopes: Scope[] = ["Posts", "Comments", "Media"];
					const sorts: Sort[] = ["Hot", "Top", "New", "Comments"];
					if (
						scopeulator.sort ||
						!scopes.includes(scopeulator.scope) ||
						!sorts.includes(this.opts.args.sort)
					) {
						return;
					}

					// Click the sort dropdown
					const sortLocator = this.page.locator(`search-sort-dropdown-menu`).first();
					await this.click(sortLocator);

					// Normalize the text to handle spacing differences
					const normalizedText =
						this.opts.args.scope === "Comments" &&
						(this.opts.args.sort === "Comments" || this.opts.args.sort === "Hot")
							? "Top"
							: this.opts.args.sort.trim();
					const normalizedOption = normalizedText === "Comments" ? "Comment count" : normalizedText;

					try {
						// Locate the option by its display text
						const sortOption = this.page.locator(`li a span:has-text("${normalizedOption}")`).first();

						// First scroll the option into view
						await sortOption.scrollIntoViewIfNeeded();

						// Wait a brief moment to ensure it's properly visible
						// await this.page.waitForTimeout(200);

						// Get the parent 'a' element which is the actual clickable link
						const parentLink = sortOption.locator("xpath=./ancestor::a");
						// Click the link
						await this.click(parentLink);

						Logger.log(`Successfully clicked on the "${normalizedOption}" sort option`);
					} catch (error) {
						Logger.error(`Failed to click sort option "${normalizedOption}":`, error);

						// Alternative approach using evaluate if the above fails
						try {
							await this.page.evaluate((text) => {
								const elements = Array.from(document.querySelectorAll("li a span"));
								const targetElement = elements.find((el) => el.textContent?.includes(text));
								if (targetElement) {
									targetElement.closest("a")?.click();
									return true;
								}
								return false;
							}, normalizedOption);
							Logger.log(`Clicked on "${normalizedOption}" using evaluate method`);
						} catch (evalError) {
							Logger.error(`Alternative method also failed:`, evalError);
						}
					}
				};
				await clickSortOptionByText();
				await this.nap();

				// Function to click a time range option by its text
				const clickTimeRangeByText = async () => {
					const scopes: Scope[] = ["Posts", "Media"];
					const sorts: Sort[] = ["Relevance", "Top", "Comments"];
					const filters: Filter[] = ["Year", "Month", "Week", "Today", "Hour"];
					if (
						scopeulator.t ||
						scopeulator.sort === "communities" ||
						!scopes.includes(scopeulator.scope) ||
						!sorts.includes(this.opts.args.sort) ||
						!filters.includes(this.opts.args.filter)
					) {
						return;
					}
					// Click the time range dropdown
					const sortLocator = this.page.locator(`search-sort-dropdown-menu`);
					await this.click(sortLocator.nth(1));

					// Now find and click the option
					const optionText =
						this.opts.args.filter === "Today"
							? this.opts.args.filter.trim()
							: "Past " + this.opts.args.filter.trim().toLowerCase();
					try {
						// First approach - target by the exact text
						const exactOption = this.page.locator(`li a span:has-text("${optionText}")`).first();

						// Get the containing link element
						const linkElement = exactOption.locator("xpath=./ancestor::a");

						// Scroll into view and click
						await linkElement.scrollIntoViewIfNeeded();
						await this.click(linkElement);

						Logger.log(`Clicked on "${optionText}" time range option`);
						return true;
					} catch (error) {
						Logger.error(`Failed to click time range "${optionText}":`, error);

						// Try alternative approach using the specific structure
						try {
							// Find all list items in the dropdown
							const listItems = this.page.locator(
								"search-sort-dropdown-menu#search_modifier_time_range li"
							);
							const count = await listItems.count();

							for (let i = 0; i < count; i++) {
								const item = listItems.nth(i);
								const text = await item.locator("span span.text-14").textContent();

								if (text?.trim().includes(optionText)) {
									// Find the link within this item
									const link = item.locator("a");
									await link.scrollIntoViewIfNeeded();
									await this.page.waitForTimeout(200);
									await link.click();

									Logger.log(`Clicked on "${optionText}" time range option (alternative method)`);
									return true;
								}
							}

							Logger.error(`Could not find time range option "${optionText}" among ${count} options`);
							return false;
						} catch (alternativeError) {
							Logger.error(`Alternative method also failed:`, alternativeError);
							return false;
						}
					}
				};
				await clickTimeRangeByText();
			}
		} catch (e) {
			Logger.warn("Error in findo function:", e);
		}
		// ------------------------------------------

		for (let i = 0; i < Math.max(this.opts.settings.start.attempts, 1); i++) {
			Logger.debug(`Attempts remaining: ${this.opts.settings.start.attempts}`, i);
			await this.nap();
			await this.scrollabit();

			// Wait for thread elements to be available
			const { locator, count } = await this.find(findulator.ids, findulator.strat);

			// Filter out indices we've already tried
			const availableIndices = Array.from({ length: count }, (_, i) => i).filter(
				(index) => !visited.includes(index)
			);
			this.bang("available threads", availableIndices.length > 0, {
				triedIndices: visited,
				availableIndices,
			});

			// Randomly select an index from the available indices
			const index = availableIndices[Math.floor(Math.random() * availableIndices.length)];
			try {
				const thread = locator.nth(index);
				await this.click(thread);
				try {
					this.bang(
						"max attempts",
						this.opts.settings.start.attempts === 0,
						this.opts.settings.start.attempts
					);
					return { index, visited };
				} catch (e) {
					const funky = await funco();
					return { index, funky, visited };
				}
			} catch (e) {
				Logger.warn("error in findo loop", e);
				visited.push(index);
				await this.page.reload({ waitUntil: "load" });
				await this.onReIteration(scopeulation.visited[scopeulation.visited.length - 1]);
			}
		}

		throw Logger.ror(
			`Failed to find a thread with open comments after ${this.opts.settings.start.attempts} attempts.`
		);
	}

	// Join a conversation by clicking the "See full discussion" link and making sure post is open
	async joinConversation() {
		await this.click('a:has-text("See full discussion")', { timeout: 1500 }).catch(() => false);
		const { locator } = await this.find(
			[
				'div[contenteditable="true"][data-lexical-editor="true"]',
				'shreddit-composer div[contenteditable="true"]',
			],
			"selector"
		);
		return locator;
	}

	// Find and click a random post
	async navigateIntoPost() {
		const scopeulator = this.scopeulate();
		if (scopeulator.community || scopeulator.people) {
			await this.scrollabit();
			const posts = this.page.locator("a[slot='title']");
			const count = await posts.count();
			const index = Math.floor(Math.random() * count);
			const randomPost = posts.nth(index);
			await this.click(randomPost);
		}
	}

	// Get comments from post with limit
	async getComments(max = 36) {
		const loca = this.page.locator("shreddit-comment");
		const count = await loca.count();
		const length = Math.min(max, count);
		const comments: { id: string; index: number; text: string; attributes: any; locator: any }[] = [];

		// Extract comment data
		for (let i = 1; i < length; i++) {
			try {
				const locator = loca.nth(i);
				const text = await this.txtContent("div[slot='comment']", locator);
				const attributes = await this.attributes(locator);
				comments.push({ id: crypto.randomUUID(), index: i, text, attributes, locator });
			} catch (error) {
				console.log(`Error processing comment ${i}:`, error);
				continue;
			}
		}
		return comments;
	}
}

export default async function (
	ctx: BrowserContext,
	opts: Partial<Options>,
	action: (url?: string) => Promise<unknown>
) {
	// setup options
	const options = configure(opts);

	// start the plugin
	const reddit = new Reddit(ctx, options, action);
	await reddit.init();

	Logger.info("Feature:", {
		feature: options.settings.start.feature,
		artifacts: options.args.artifacters,
	});
	Logger.info("Options:", {
		options: options,
	});

	return { reddit };
}
