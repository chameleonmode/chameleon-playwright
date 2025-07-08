import { BrowserContext, Locator } from "@playwright/test";
import { Logger } from "../../lib/logger.js";
import { AI, Opts, Artifact, Settings, Thread, Anything } from "../../lib/index.js";

export type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
export type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments" | "Posts";
export type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

export interface Args {
	scope: Scope;
	sort: Sort;
	filter: Filter;
	artifacters: Artifact[];
}
export interface Options extends Opts<Args> {}

// Default values for Reddit configuration
export const BASE_URL: string = "https://www.reddit.com";
export const args: Args = {
	scope: "People",
	sort: "Relevance",
	filter: "All",
	artifacters: [{ type: "selections", data: ["vote"] }],
};
export const settings: Settings = {
	start: {
		urls: [],
		search: [],
		all: true,
		new: true,
		attempts: 9,
		feature: "reddit",
		rando: { min: 0, max: 0 },
		iterations: { min: 0, max: 0 },
		variations: { min: 0, max: 0 },
	},
	timeouts: {
		navigate: 60,
		default: 30,
		wait: 15,
		artifacto: { delay: 120 },
		naps: { min: 256, max: 512 },
	},
};
export const ai: AI = {
	model: "o4-mini",
	decorators: {
		system: `You are a Reddit-native assistant trained to generate relevant, tone-matching, socially appropriate information for Reddit.`,
		human: "Reddit-native content creator",
		audience: "Reddit-native website users relevant to the current context in the task data",
		background: "Browsing reddit for relevant content and interacting with the Reddit community.",
		tone: "adaptive to the relevant task data and context",
	},
};
export async function configure(ctx: BrowserContext, opts?: Partial<Options>) {
	Logger.debug("Opts", { opts });
	const search = opts?.settings?.start?.search || [];
	const urls = [
		...(opts?.settings?.start?.urls || []),
		...(search.length && !opts?.settings?.start?.urls?.length ? [BASE_URL] : [])
	].filter(Boolean);
	// if (!search.length && !urls.length) {
	// 	args.scope = "Posts"; // Default scope
	// 	args.sort = "Relevance"; // Default sort
	// 	args.filter = "All";

	// 	// If no search terms or URLs are provided, default to BASE_URL
	// 	search.push("joe rogan"); // Default search term
	// 	urls.push(BASE_URL); // Default URL
	// 	// urls.push("https://www.reddit.com/r/spaceporn/comments/1lqda9p/an_interstellar_object_has_been_detected_hurtling/"); 

	// 	settings.start.attempts = 12;
	// 	settings.start.new = false;
	// 	settings.start.rando = { min: 17, max: 17 }; //
	// 	settings.start.iterations = { min: 1, max: 1 }; //
	// 	settings.start.variations = { min: 1, max: 1 };

	// 	Logger.warn("No search terms or URLs provided, using default values.");
	// }
	const options: Options = {
		run: opts?.run ?? {},
		args: { ...args, ...opts?.args },
		settings: {
			start: {
				...settings.start, // Default start settings
				...opts?.settings?.start, // opts.settings.start overrides defaults
				urls,
				search, // Search terms are always taken from opts.settings.start.search
			},
			timeouts: {
				...settings.timeouts, // Default timeout settings
				...opts?.settings?.timeouts, // opts.settings.timeouts overrides defaults
				// Specific timeouts are then hardcoded, overriding any previous values:
				navigate: 1000 * 60,
				default: 1000 * 30,
				wait: 1000 * 15,
			},
		},
		ai: {
			model: ai.model, // Model is always taken from the global 'ai' object; opts.ai.model is ignored.
			decorators: {
				...ai.decorators,
				...opts?.ai?.decorators,
			},
		},
	};
	options.settings.start.rando.max = options.settings.start.rando.min;
	options.settings.start.iterations.max = options.settings.start.iterations.min;
	options.settings.start.variations.max = options.settings.start.variations.min;

	options.settings.timeouts.naps.multiplier = undefined;
	options.settings.timeouts.naps.max = options.settings.start.variations.min + 512;
	options.settings.timeouts.artifacto.delay = 1000 * options.settings.timeouts.artifacto.delay;

	Logger.debug("Options", options);
	const page = options.settings.start.new ? await ctx.newPage() : ctx.pages()[ctx.pages().length - 1];
	return { page, options };
}
export type Target = "comment" | "post" | "unknown";
export type RedditComment = { id: string; index: number; text: string; attributes: Anything; locator: Locator };
export type CommentTarget = { type: Target; comment?: RedditComment };
export type RedditCommentPrompt = {
	post: { id: string; url: string; content?: any; comments?: RedditComment[] };
	target?: CommentTarget;
};

export class Scopeulation {
	threaded: Thread[] = [];
	visited: string[] = [];
	searched: string[] = [];

	base = (url: string) => new URL(url).href === new URL(BASE_URL).href;
	user = (url: string) => /\.com\/user\/[^/]+/.test(url);
	subreddit = (url: string) => /\/r\/[^/]+\/?$/.test(url);
	comments = (url: string) => /\/r\/[^/]+\/comments(?:\/.*)?$/.test(url);
	search = (url: string) => /\/r\/[^/]+\/search(?:\/.*)?$/.test(url);

	iterative = (url: string) =>
		this.comments(url) || this.search(url) || this.user(url)
			? url
			: url.replace(/\/?(search)?$/, "/search");

	existing(thread: Thread) {
		if (!this.threaded.some((v) => JSON.stringify(v.listing) === JSON.stringify(thread.listing))) {
			scopeulation.threaded.push(thread);
			return thread;
		}
	}

	scoped(current: Scope) {
		const url = this.visited[this.visited.length - 1];
		const scope =
			["People", "Communities"].includes(current) &&
			(this.subreddit(url) || this.comments(url) || this.search(url))
				? "Posts"
				: current;
		const Url = new URL(url);
		const type = Url.searchParams.get("type");
		const sort = Url.searchParams.get("sort");
		const t = Url.searchParams.get("t");
		const community = scope === "Communities" || type === "communities";
		const people = scope === "People" || type === "people" || this.user(url);
		return { url, scope, type, sort, t, community, people };
	}
}
export const scopeulation = new Scopeulation();