import { Locator, Page } from "@playwright/test";
import { Parameters, Thread, Funco, er, bang, bing, delay, Logger, promptee } from "../../lib/index.js";
import {
	configure,
	Options,
	Scope,
	Sort,
	BASE_URL,
	Filter,
	scopeulation,
	Args,
	RedditComment,
} from "./configure.js";
import { Actor } from "../actor.js";

export class Reddit extends Actor<Args> {
	constructor(setup: { page: Page; options: Options; funco: Funco }) {
		super(setup.page, setup.options, async (url: string) => {
			if (!setup.funco) return bang("No action function provided", undefined, { url });
			else Logger.log("Scenario URL", url);

			const pre = async () => {
				if (scopeulation.user(this.page.url()) || scopeulation.user(url)) {
					await this.click(
						this.opts.args.sort === "Posts"
							? 'a[slot="page-2"]:has-text("Posts")'
							: this.opts.args.sort === "Comments"
							? 'a[slot="page-3"]:has-text("Comments")'
							: 'a[slot="page-1"]:has-text("Overview")'
					);
				}
			};
			const attempter = async (func: () => Promise<unknown>) => {
				try {
					return await func();
				} catch (e) {
					await this.backscratcher(new URL(url), e);
					return await attempter(func);
				}
			};
			if (this.scopeulate().direct(url)) {
				return await attempter(async () => {
					await pre();
					return await setup.funco(url);
				});
			} else {
				const { batches } = await (async () => {
					const locatorz = await this.navigateIntoPost().catch(async () => {
						const scopeulator = this.scopeulate();
						const finder = await scopeulator.findulator();
						await this.scrollabit(6);
						return await finder.find.locator.all();
					});
					// Wait for thread elements to be available
					const batches: Thread[][] = [[]];
					for (let i = 0; i < locatorz.length; i++) {
						const idx = batches.length - 1;
						if (batches[idx].length >= 10) batches.push([]); // Create a new batch every 10 threads

						const listing = locatorz[i];
						// const locator = listing.locator('xpath=ancestor::article[1]') ?? listing;
						if (!(await listing.isVisible())) continue; // Skip if not visible

						const { id, content, attributes } = await this.raw(listing, false).catch();
						batches[idx].push({ id, content, listing, attributes });
					}
					return { batches };
				})();

				const rank = async (func: (locators: Locator[]) => Promise<unknown>) => {
					for (const data of batches) {
						const promptmise = promptee.ranking({
							task: `score these reddit threads by relevance to the users inception. make sure to include a rank number along with the thread ID provided.`,
							generations: {
								type: "ranking",
								range: { min: 1, max: 1 },
								input: {
									data: data,
									user_intent: `Rank all of these threads for ${
										this.opts.settings.start.feature
									} @${this.page.url()}`,
								},
							},
						});
						const reply = await this.waitabit(promptmise);
						const threaded = reply[0].data
							.sort((a) => a.rank)
							.map((item) => {
								const thread = data.find((t) => t.id === item.id);
								return thread?.listing;
							}) as Locator[];
						await func(threaded);
					}
				};
				return await attempter(
					async () =>
						await rank(
							async (threads) =>
								await this.findo(threads, async (thread) => {
									await pre();
									return await setup.funco(url, thread);
								})
						)
				);
			}
		});
	}

	scopeulate() {
		const scoped = scopeulation.scoped(this.opts.args.scope);
		const click = async () => {
			if (scoped.type) return;
			// Click the appropriate tab based on the scope
			const tab =
				scoped.scope === "Posts"
					? this.page.getByRole("button", { name: scoped.scope })
					: this.page.locator(`#search-results-page-tab-${scoped.scope.toLowerCase()}`);
			await this.click(tab);
		};
		const clickSort = async () => {
			const scopes: Scope[] = ["Posts", "Comments", "Media"];
			const sorts: Sort[] = ["Hot", "Top", "New", "Comments"];
			const skips = scoped.sort || !scopes.includes(scoped.scope) || !sorts.includes(this.opts.args.sort);
			if (skips) return;
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
			await this.nap();
		};
		const clickRange = async () => {
			const scopes: Scope[] = ["Posts", "Media"];
			const sorts: Sort[] = ["Relevance", "Top", "Comments"];
			const filters: Filter[] = ["Year", "Month", "Week", "Today", "Hour"];
			const skips =
				scoped.t ||
				!scopes.includes(scoped.scope) ||
				!sorts.includes(this.opts.args.sort) ||
				!filters.includes(this.opts.args.filter);
			if (skips) return;

			// Click the time range dropdown
			const sortLocator = this.page.locator(`search-sort-dropdown-menu`);
			await this.click(sortLocator.nth(1));

			// Now find and click the option
			const optionText =
				this.opts.args.filter === "Today"
					? this.opts.args.filter.trim()
					: "Past " + this.opts.args.filter.trim().toLowerCase();
			// First approach - target by the exact text
			const exactOption = this.page.locator(`li a span:has-text("${optionText}")`).first();

			// Get the containing link element
			const linkElement = exactOption.locator("xpath=./ancestor::a");

			// Scroll into view and click
			await linkElement.scrollIntoViewIfNeeded();
			await this.click(linkElement);

			Logger.log(`Clicked on "${optionText}" time range option`);
		};
		const homepage = scopeulation.base(this.page.url()) && this.opts.settings.start.search.length === 0;
		const scopeulated = {
			...scoped,
			homepage,
			direct: (url?: string) => {
				const base = url ? scopeulation.comments(url) || scopeulation.user(url) : homepage;
				return base || scoped.people || scoped.community;
			},
			findulator: async () => {
				try {
					await click();
					await clickSort();
					await clickRange();
				} catch (e) {
					Logger.warn("Error in scopeulator setup", e);
				}
				const mapper: {
					[key in Scope]: { ids: string[]; strat: "testId" | "selector" | "text" };
				} = {
					Posts: {
						ids: ["search-post-unit", "search-post-with-content-preview"],
						strat: "testId",
					},
					Media: { ids: ["div[data-id='search-media-post-unit']"], strat: "selector" },
					Comments: { ids: ["search-sdui-comment-unit"], strat: "testId" },
					Communities: { ids: ["search-community"], strat: "testId" },
					People: { ids: ["search-author"], strat: "testId" },
				};
				const scope = mapper[scoped.scope];

				// If not a user provided URL, we might need a different scope
				return { scope, find: await this.find(scope.ids, scope.strat) };
			},
			click,
			clickSort,
			clickRange,
		};
		return bang(`scopeulate`, scopeulated, scoped);
	}

	async backscratcher(url: URL, error?: unknown) {
		bang("backscratcher checking listing attempts", !error || this.opts.settings.start.attempts-- > 0, {
			attempts: this.opts.settings.start.attempts,
			error,
		});
		while (await this.page.evaluate(() => window.history.length > 1)) {
			if (new URL(this.page.url()).pathname === url.pathname) break; // If we are at the base URL

			await this.page.goBack();
			await this.nap();
		}
	}

	// Extract full post data with screenshot
	async raw(locator: Locator = this.page.locator("shreddit-post").first(), screenshots = true) {
		await locator.waitFor();

		const id = crypto.randomUUID();
		const url = new URL(this.page.url());
		// Get attributes of the post element
		const attributes = await this.attributes(locator);

		// Take screenshot of post element
		const screenshot = screenshots ? await this.screenshot(locator) : "";

		// Extract post content and attributes
		const content = await locator.evaluate((root) => {
			const relevantAttrPrefixes = [
				"post-",
				"subreddit-",
				"author-",
				"content-",
				"comment-",
				"domain",
				"id",
				"title",
				"href",
				"src",
				"datetime",
			];

			const extractAttributes = (el: Element) => {
				const data: Record<string, string> = {};
				for (const { name, value } of el.attributes) {
					if (relevantAttrPrefixes.some((prefix) => name.startsWith(prefix) || prefix === name)) {
						data[name] = value;
					}
				}
				return data;
			};

			const extractTextContent = (node: Node): string => {
				if (node.nodeType === Node.TEXT_NODE) {
					return node.textContent?.trim() || "";
				}
				if (node.nodeType === Node.ELEMENT_NODE) {
					return Array.from(node.childNodes)
						.map(extractTextContent)
						.filter(Boolean)
						.join(" ")
						.replace(/\s+/g, " ")
						.trim();
				}
				return "";
			};

			const extractMedia = (el: Element) =>
				Array.from(el.querySelectorAll("img, video"))
					.map((node) => ({ type: node.tagName.toLowerCase(), src: node.getAttribute("src") }))
					.filter((item) => item.src);

			return {
				tag: root.tagName.toLowerCase(),
				attributes: extractAttributes(root),
				title: root.querySelector("h1")?.textContent?.trim(),
				flair: root.querySelector("shreddit-post-flair")?.textContent?.trim(),
				body: extractTextContent(root.querySelector('[slot="text-body"]') || root),
				media: extractMedia(root),
			};
		});

		return { id, url, attributes, content, screenshot };
	}

	// on every try
	override async onWhile(url: string): Promise<void | Error> {
		const basic = scopeulation.subreddit(url) || url === BASE_URL;
		const todo = this.opts.settings.start.urls.length + this.opts.settings.start.search.length;
		const visit = this.opts.settings.start.urls.length - scopeulation.visited.length;
		const search = this.opts.settings.start.search.length - scopeulation.searched.length;
		const searched = search === 0 && this.opts.settings.start.search.length > 0;
		const done = scopeulation.visited.length + scopeulation.searched.length;
		const stats = { todo, done, visit, search, searched, basic };
		Logger.log(`Status`, stats, scopeulation);

		// check if we have completed all urls we need to also search on
		// if (searched && scopeulation.subreddit(url) && !scopeulation.visited.includes(url)) {
		// 	scopeulation.searched.length = 0;
		// 	return await this.onWhile(url);
		// }

		// check if we have completed all terms
		return search && basic
			? await this.searcho()
			: visit && !scopeulation.visited.includes(url)
			? await this.navigato(url)
			: Logger.trace(`All terms completed.`);
	}

	// on every retry/iteration
	override async onReIteration(url: string) {
		await this.backscratcher(new URL(scopeulation.iterative(url)));
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

		const text = this.opts.settings.start.search[scopeulation.searched.length];
		const locator = this.page.locator(`faceplate-search-input`);
		const textbox = locator.getByRole("textbox");
		await this.click(textbox);

		const clearButton = locator.getByRole("button", { name: "Clear search" });
		if (await clearButton.isVisible()) await clearButton.click().catch(() => false);

		await this.pressSequentially(textbox, text, false);
		await textbox.press("Enter");
		await this.nap();
		scopeulation.searched.push(text);
	}

	// find an active context
	async findo<T>(posts: Locator[], funco: (current: Thread) => Promise<T>): Promise<T> {
		const url = new URL(this.page.url());
		for (const listing of posts) {
			try {
				const thread = scopeulation.existing({
					id: crypto.randomUUID(),
					listing,
					attributes: await this.attributes(listing),
				});
				if (!thread || !thread.listing) continue;
				await this.click(thread.listing);
				await this.nap();
				return await funco(thread);
			} catch (error) {
				await this.backscratcher(url, error);
			}
		}

		throw er(`Failed to find a thread.`, this.opts.settings.start.attempts);
	}

	// Join a conversation by clicking the "See full discussion" link and making sure post is open
	async joinConversation() {
		if (this.scopeulate().direct()) return false;
		await this.click('a:has-text("See full discussion")', { timeout: 600 }).catch(() => false);
		await this.scrollabit();

		const archived = this.page.locator('[slot="post-archived-banner"] >> text=Archived post');
		const closed = await archived.isVisible().catch(() => false);
		bang(`checking archive`, closed === false, { closed, archived });

		// 1. Locate visible trigger
		const triggers = this.page.locator(
			'comment-composer-host faceplate-textarea-input[placeholder="Join the conversation"]'
		);
		const count = await triggers.count();
		for (let i = 0; i < count; i++) {
			const trigger = triggers.nth(i);
			if (await trigger.isVisible())
				try {
					await trigger.click({ force: true });
					return trigger;
				} catch {}
		}

		// 2. Fallback: try to force dispatch focus with JS if no visible trigger worked
		Logger.warn("Trying JS-based fallback trigger...");
		return await this.page.evaluate(() => {
			const el = document.querySelector(
				'comment-composer-host faceplate-textarea-input[placeholder="Join the conversation"]'
			);
			if (el) el.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }));
			return el;
		});
	}

	// Find and click a random post
	async navigateIntoPost() {
		const scopeulator = this.scopeulate();
		bang("navigateIntoPost", scopeulator.direct(), { scopeulator });

		await this.scrollabit();
		const locator = this.page.locator(
			`a[slot='title'], shreddit-profile-comment a.absolute[href][aria-label^='Thread for']`
		);
		const posts = await locator.all();
		return bing("found posts", posts.length, posts, { locator, scopeulator });
	}

	// Get comments from post with limit
	async getComments(max = 36) {
		const loca = this.page.locator("shreddit-comment");
		const count = await loca.count();
		const length = Math.min(max, count);
		const comments: RedditComment[] = [];

		// Extract comment data
		for (let i = 1; i < length; i++) {
			try {
				const locator = loca.nth(i);
				const text = await this.txtContent("div[slot='comment']", locator);
				const attributes = await this.attributes(locator);
				comments.push({ id: crypto.randomUUID(), index: i, text, attributes, locator });
			} catch (error) {
				Logger.warn(`Error processing comment ${i}:`, error);
				continue;
			}
		}
		return comments;
	}
}

export default async function (params: Parameters<Options>, funco: Funco) {
	// setup options
	const config = await configure(params.ctx, params.opts);

	// start the plugin
	const reddit = new Reddit({ ...config, funco });
	await reddit.init();

	return { reddit };
}
