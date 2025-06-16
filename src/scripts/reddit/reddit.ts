// File: reddit.ts
import { Logger } from "../../lib/logger.js";
import { AI, Opts, Artifact, Settings } from "../../lib/types/index.js";

export const BASE_URL: string = "https://www.reddit.com";

//
export type Scope = "Posts" | "Communities" | "Comments" | "Media" | "People";
export type Sort = "Relevance" | "Hot" | "Top" | "New" | "Comments";
export type Filter = "All" | "Year" | "Month" | "Week" | "Today" | "Hour";

export interface Args {
	search: string[];
	scope: Scope;
	sort: Sort;
	filter: Filter;
	artifacters: Artifact[];
}
export interface Options extends Opts<Args> {}
export const args: Args = {
	search: ["popeye"],
	scope: "Posts",
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
	model: "gpt",
	decorators: {
		system: "You are helpful!",
		human: "reddit content creator",
		audience: "adaptive to the general audience of the task context",
		background: "surfing reddit",
		tone: "adaptive to the general tone of context",
		prefix: "As a social media expert you know how to make perfect decisions so consider the following:",
		suffix: "Respond as creative as possible.",
	},
};
export function configure(opts?: Partial<Options>) {
	Logger.debug("Opts", { opts });
	const search = opts?.args?.search || [];
	const options: Options = {
		run: opts?.run ?? {},
		args: { ...args, ...opts?.args }, // opts.args overrides default args
		settings: {
			start: {
				...settings.start, // Default start settings
				...opts?.settings?.start, // opts.settings.start overrides defaults
				// URLs are then specifically re-calculated, overriding any 'urls' from opts.settings.start:
				// It uses the global 'settings.start.urls'.
				urls: [
					...(search.length ? [BASE_URL] : []), // Prepend BASE_URL if search terms exist
					...settings.start.urls, // Append default start URLs
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
