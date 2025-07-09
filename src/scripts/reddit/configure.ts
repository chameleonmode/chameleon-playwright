import { BrowserContext, Locator } from "@playwright/test";
import { Logger } from "../../lib/logger.js";
import { AI, Opts, Artifact, Settings, Anything, state } from "../../lib/index.js";

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
		system: `You are a Reddit-native assistant trained to generate relevant, tone-matching, socially appropriate information for Reddit`,
		human: "Reddit-native content creator",
		audience: "Reddit-native website users relevant to the current context in the task data",
		background: "Browsing reddit for relevant content and interacting with the Reddit community",
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
	if (state.testing) {
		Logger.debug("Testing mode enabled, using provided URLs and search terms.");
		args.scope = "Posts"; // Default scope
		args.sort = "Relevance"; // Default sort
		args.filter = "All";

		// If no search terms or URLs are provided, default to BASE_URL
		search.push("joe rogan");
		urls.push(BASE_URL); 

		settings.start.attempts = 1;
		settings.start.new = false;
		settings.start.rando = { min: 19, max: 3 }; //
		settings.start.iterations = { min: 1, max: 1 }; //
		settings.start.variations = { min: 1, max: 1 };

		Logger.warn("No search terms or URLs provided, using default values.");
	}
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
