import { Ranger } from ".";

export type Model = "gpt-4.1" | "o4-mini";
export type Tone = "sarcastic" | "informative" | "relatable" | "straightforward";

export interface Decorations {
	system: string; // 2. SYSTEM ROLE (keeps the model “on brand”)
	prefix?: string;
	tone: Tone | string | null;
	human: string;
	audience: string;
	background: string;
	suffix?: string;
}

export interface AI {
	model: Model;
	decorators: Decorations;
}

export namespace requests {
	export type Kind = "comment" | "post" | "reply" | "title" | "term" | "ranking";
	export type RankingOrderReply = {
		id: string;
		rank: number;
		reason: string;
	}
	export interface Output<T> {
		type: Kind;
		data: T;
		id: string;
		reason: any;
	}
	export interface Prompt<T> {
		model: Model;
		decorators: Decorations;
		task: string | "generate_reddit_comment" | "generate_reddit_reply" | "reddit_thread_ranking";
		image?: {
			des: string;
			b64: string[];
		};
		generations: {
			type: Kind;
			range: Ranger;
			input: {
				data: T; // data to be processed
				user_intent: string; // user intent for context
			};
		};

		/**
		 * The type of the prompt.
		 */
	}
}
