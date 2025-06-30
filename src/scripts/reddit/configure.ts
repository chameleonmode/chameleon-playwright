import { Logger } from "../../lib/logger.js";
import { AI, Opts, Artifact, Settings, Findo } from "../../lib/types/index.js";


//
export type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
export type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments" | "Posts";
export type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

export interface Args {
	search: string[];
	scope: Scope;
	sort: Sort;
	filter: Filter;
	artifacters: Artifact[];
}
export interface Options extends Opts<Args> {}
export class Scopeulation {
	findos: Findo[] = [];
	visited: string[] = [];
	searched: string[] = [];

	subreddit(url: string): boolean {
		const pattern = /\/r\/[^/]+\/?$/;
		return pattern.test(url);
	}

	comments(url: string): boolean {
		const pattern = /\/r\/[^/]+\/comments(?:\/.*)?$/;
		return pattern.test(url);
	}

	search(url: string): boolean {
		const pattern = /\/r\/[^/]+\/search(?:\/.*)?$/;
		return pattern.test(url);
	}

	user(url: string): boolean {
		const pattern = /\.com\/user\/[^/]+/;
		return pattern.test(url);
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
export const BASE_URL: string = "https://www.reddit.com";
export const args: Args = {
	search: [], //["popeye"],
	scope: "People", // "Posts", "Communities", "Comments", "Media", "People"
	sort: "Relevance",
	filter: "All",
	artifacters: [{ type: "selections", data: ["vote"] }],
};
export const settings: Settings = {
	start: {
		urls: [],
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
		system: "You are a Reddit-native assistant",
		human: "reddit content creator",
		audience: "reddit website users",
		background: "surfing reddit",
		tone: "adaptive",
	},
};
export function configure(opts?: Partial<Options>) {
	const search = opts?.args?.search || args.search;
	const urls = [
		...(opts?.settings?.start?.urls || []),
		...settings.start.urls, // Append default start URLs
	];
	if(!search.length && !urls.length) {
		args.scope = "Communities"; 
		args.sort = "Relevance"; 
		args.filter = "All"; 

		// If no search terms or URLs are provided, default to BASE_URL
		search.push("popeye"); // Default search term
		// urls.push("https://www.reddit.com/user/Stompinstein/"); // Default URL
		// urls.push("https://www.reddit.com/r/MurderDrones/comments/1br2s0y/like_why/");
		// urls.push("https://www.reddit.com/r/cartoons/comments/1066oh1/anyone_remember_this_this_show_was_such_an/"); // Default URL
		// urls.push("https://www.reddit.com/r/agedlikemilk/comments/1lcpl1n/aged_like_baby_spinach/");

		settings.start.attempts = 12;
		settings.start.new = false;
		settings.start.rando = { min: 9, max: 9 }; //
		settings.start.iterations = { min: 1, max: 1 }; // 
		settings.start.variations = { min: 1, max: 1 };
		Logger.warn("No search terms or URLs provided, using default values.");

		//["https://www.reddit.com/r/publicdomain/comments/1hn0t95/brutus_from_popeye/"], //["https://www.reddit.com/r/PowerScaling/comments/y9vrel/being_completely_reasonable_with_no_memes_or/"],
	}
	Logger.debug("Opts", { opts });
	const options: Options = {
		run: opts?.run ?? {},
		args: { ...args, ...opts?.args, search },
		settings: {
			start: {
				...settings.start, // Default start settings
				...opts?.settings?.start, // opts.settings.start overrides defaults
				// URLs are then specifically re-calculated, overriding any 'urls' from opts.settings.start:
				// It uses the global 'settings.start.urls'.
				urls: [
					...(search.length && !urls.length ? [BASE_URL] : []), // Prepend BASE_URL if search terms exist
					...urls,
				].filter(Boolean), // Remove any falsy URL entries
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
	return options;
}
