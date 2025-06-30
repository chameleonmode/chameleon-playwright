import { Locator, Page } from "@playwright/test";
import { random, ror } from "../../lib/utils.js";
import { RedditComment, Parameters, Findo, Funco } from "../../lib/types/index.js";
import { configure, Options, Scope, Sort, BASE_URL, Filter, scopeulation, Args } from "./configure.js";
import { Actor } from "../actor.js";
import { Logger } from "../../lib/logger.js";

export class Reddit extends Actor<Args> {
	constructor(setup: { page: Page; options: Options; funco: Funco }) {
		super(setup.page, setup.options, async (url: string) => {
			if (!setup.funco) return this.bang("No action function provided", undefined, { url });
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
			if (scopeulation.direct(this.opts.settings.start.feature)) {
				this.opts.settings.start.iterations = { min: 1, max: 1 };
				for (let i = 0; i < this.opts.settings.start.attempts; i++) {
					try {
						await pre();
						return await setup.funco(url);
					} catch (e) {
						Logger.warn("Error in action function", e);
						// If we are on a comments page or user page, we need to go back
						while (!this.page.url().startsWith(url) && this.opts.settings.start.attempts > 0) {
							await this.page.goBack();
							await this.nap({ min: 50, max: 75, multiplier: random(3, 6) });
						}
					}
				}
			} else {
				try {
					const scopeulator = this.scopeulate();
					try {
						await scopeulator.click();
						await scopeulator.clickSortOptionByText();
						await scopeulator.clickTimeRangeByText();
					} catch (e) {
						Logger.warn("Error in findo setup", e);
					}
					const findulator = await scopeulator.findulator();
					await this.scrollabit();

					// Wait for thread elements to be available
					const threads = await findulator.find.locator.all();
					const shuffled = threads.sort(() => Math.random() - 0.5);
					return await this.findo(shuffled, async (thread) => {
						await pre();
						return await setup.funco(url, thread);
					});
				} catch (e) {
					Logger.warn("Error in action function", e);
				} finally {
					const text = this.opts.args.search[scopeulation.searched.length];
					scopeulation.searched.push(text);
				}
			}

			Logger.log("Scenario function completed", scopeulation, url);
		});
	}

	scopeulate() {
		const scoped = scopeulation.scoped(this.opts.args.scope);
		const scopeulated = {
			...scoped,
			findulator: async () => {
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
			clickSortOptionByText: async () => {
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
			},
			clickTimeRangeByText: async () => {
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
			},
			click: async () => {
				if (scoped.type) return;
				// Click the appropriate tab based on the scope
				await this.click(
					scoped.scope === "Posts"
						? this.page.getByRole("button", { name: scoped.scope }).first()
						: this.page.locator(`#search-results-page-tab-${scoped.scope.toLowerCase()}`).first()
				);
			},
		};
		return this.bang(`scopeulate`, scopeulated, scoped);
	}

	// on every try
	override async onWhile(url: string): Promise<void | Error> {
		const basic = scopeulation.subreddit(url) || url === BASE_URL;
		const todo = this.opts.settings.start.urls.length + this.opts.args.search.length;
		const visit = this.opts.settings.start.urls.length - scopeulation.visited.length;
		const search = this.opts.args.search.length - scopeulation.searched.length;
		const searched = search === 0 && this.opts.args.search.length > 0;
		const done = scopeulation.visited.length + scopeulation.searched.length;
		const stats = { todo, done, visit, search, searched, basic };
		Logger.log(`Status`, stats, scopeulation);

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
		const until = () =>
			scopeulation.comments(url) || scopeulation.search(url) || scopeulation.user(url)
				? url
				: url.replace(/\/?$/, "/") + "search";
		while (!this.page.url().startsWith(until())) {
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
		if (await clearButton.isVisible().catch(() => false)) await clearButton.click().catch(() => false);

		await this.pressSequentially(textbox, text, false);
		await this.nap({ multiplier: 3 });
		await textbox.press("Enter");
		await this.nap();
	}

	// find an active context
	async findo<T>(posts: Locator[], funco: (findo: Findo) => Promise<T>): Promise<T> {
		const url = new URL(this.page.url());

		for (const listing of posts) {
			this.bang(
				"checking listing attempts",
				this.opts.settings.start.attempts > 0,
				this.opts.settings.start.attempts
			);
			const existing = scopeulation.findos.some(
				(v) => JSON.stringify(v.listing) === JSON.stringify(listing)
			);
			if (existing) continue; // Skip already visited listings
			try {
				const thread = { listing, attributes: await this.attributes(listing) };
				scopeulation.findos.push(thread);
				await thread.listing.scrollIntoViewIfNeeded();
				await this.nap();
				await thread.listing.click({ position: { x: 5, y: 5 } });
				await this.nap();
				return await funco(thread);
			} catch {
				this.opts.settings.start.attempts--;
				while (true && this.opts.settings.start.attempts > 0) {
					const pUrl = new URL(this.page.url());
					if (pUrl.pathname === url.pathname) break; // If we are at the base URL

					await this.page.goBack();
					await this.nap();
				}
			}
		}

		throw ror(
			`Failed to find a thread with open comments after ${this.opts.settings.start.attempts} attempts.`
		);
	}

	// Join a conversation by clicking the "See full discussion" link and making sure post is open
	async joinConversation() {
		await this.click('a:has-text("See full discussion")', { timeout: 600 }).catch(() => false);
		await this.scrollabit(3);

		const archived = this.page.locator('[slot="post-archived-banner"] >> text=Archived post');
		const closed = await archived.isVisible().catch(() => false);
		this.bang(`checking archive`, closed === false, { closed, archived });

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

		// // 3. Wait for rich editor to become visible
		// const editor = this.page.locator('shreddit-composer div[contenteditable="true"]');
		// await editor.waitFor({ state: "visible", timeout: 5000 });

		// // 4. Focus editor and fill text
		// await editor.click({ force: true });
		// // await editor.fill(commentText);

		// // 5. Wait for and click submit
		// // const submitBtn = this.page.locator('shreddit-composer button[type="submit"]');
		// // await submitBtn.waitFor({ state: 'visible', timeout: 3000 });
		// // await submitBtn.click({ force: true });

		// return editor;
	}

	// Find and click a random post
	async navigateIntoPost() {
		const scopeulator = this.scopeulate();
		if (!scopeulator.community && !scopeulator.people) return;

		await this.scrollabit();
		const locator = this.page.locator(
			`a[slot='title'], shreddit-profile-comment a.absolute[href][aria-label^='Thread for']`
		);
		const posts = await locator.all();
		return this.bing("found posts", posts.length, posts, { locator, scopeulator });
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
