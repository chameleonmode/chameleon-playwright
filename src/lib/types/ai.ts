import { Ranger } from ".";

export namespace CUA {
	/**
	 * A click action.
	 */
	export interface Click {
		/**
		 * Indicates which mouse button was pressed during the click. One of `left`,
		 * `right`, `wheel`, `back`, or `forward`.
		 */
		button: "left" | "right" | "wheel" | "back" | "forward";

		/**
		 * Specifies the event type. For a click action, this property is always set to
		 * `click`.
		 */
		type: "click";

		/**
		 * The x-coordinate where the click occurred.
		 */
		x: number;

		/**
		 * The y-coordinate where the click occurred.
		 */
		y: number;
	}

	/**
	 * A double click action.
	 */
	export interface DoubleClick {
		/**
		 * Specifies the event type. For a double click action, this property is always set
		 * to `double_click`.
		 */
		type: "double_click";

		/**
		 * The x-coordinate where the double click occurred.
		 */
		x: number;

		/**
		 * The y-coordinate where the double click occurred.
		 */
		y: number;
	}

	/**
	 * A drag action.
	 */
	export interface Drag {
		/**
		 * An array of coordinates representing the path of the drag action. Coordinates
		 * will appear as an array of objects, eg
		 *
		 * ```
		 * [
		 *   { x: 100, y: 200 },
		 *   { x: 200, y: 300 }
		 * ]
		 * ```
		 */
		path: Array<Drag.Path>;

		/**
		 * Specifies the event type. For a drag action, this property is always set to
		 * `drag`.
		 */
		type: "drag";
	}

	export namespace Drag {
		/**
		 * A series of x/y coordinate pairs in the drag path.
		 */
		export interface Path {
			/**
			 * The x-coordinate.
			 */
			x: number;

			/**
			 * The y-coordinate.
			 */
			y: number;
		}
	}

	/**
	 * A collection of keypresses the model would like to perform.
	 */
	export interface Keypress {
		/**
		 * The combination of keys the model is requesting to be pressed. This is an array
		 * of strings, each representing a key.
		 */
		keys: Array<string>;

		/**
		 * Specifies the event type. For a keypress action, this property is always set to
		 * `keypress`.
		 */
		type: "keypress";
	}

	/**
	 * A mouse move action.
	 */
	export interface Move {
		/**
		 * Specifies the event type. For a move action, this property is always set to
		 * `move`.
		 */
		type: "move";

		/**
		 * The x-coordinate to move to.
		 */
		x: number;

		/**
		 * The y-coordinate to move to.
		 */
		y: number;
	}

	/**
	 * A screenshot action.
	 */
	export interface Screenshot {
		/**
		 * Specifies the event type. For a screenshot action, this property is always set
		 * to `screenshot`.
		 */
		type: "screenshot";
	}

	/**
	 * A scroll action.
	 */
	export interface Scroll {
		/**
		 * The horizontal scroll distance.
		 */
		scroll_x: number;

		/**
		 * The vertical scroll distance.
		 */
		scroll_y: number;

		/**
		 * Specifies the event type. For a scroll action, this property is always set to
		 * `scroll`.
		 */
		type: "scroll";

		/**
		 * The x-coordinate where the scroll occurred.
		 */
		x: number;

		/**
		 * The y-coordinate where the scroll occurred.
		 */
		y: number;
	}

	/**
	 * An action to type in text.
	 */
	export interface Type {
		/**
		 * The text to type.
		 */
		text: string;

		/**
		 * Specifies the event type. For a type action, this property is always set to
		 * `type`.
		 */
		type: "type";
	}

	/**
	 * A wait action.
	 */
	export interface Wait {
		/**
		 * Specifies the event type. For a wait action, this property is always set to
		 * `wait`.
		 */
		type: "wait";
	}

	export type Actionable = {
		type: "click" | "scroll" | "keypress" | "type" | "wait" | "screenshot";
		action: Click | DoubleClick | Drag | Keypress | Move | Screenshot | Scroll | Type | Wait;
	};
}
export type Actionable = CUA.Actionable;
export type Action =
	| CUA.Click
	| CUA.DoubleClick
	| CUA.Drag
	| CUA.Keypress
	| CUA.Move
	| CUA.Screenshot
	| CUA.Scroll
	| CUA.Type
	| CUA.Wait;

export type Model = "gpt-4.1" | "o4-mini";
export type Kind = "comment" | "post" | "reply" | "title" | "search" | "prompt" | "term" | "";
export type Tone = "sarcastic" | "informative" | "relatable" | "straightforward";
export type Target = "comment" | "post" | "unknown";

export type RedditComment = { id: string; index: number; text: string; attributes: any; locator?: any };
export type CommentTarget = { type: Target; comment?: RedditComment };
export type RedditCommentPrompt = {
	post: { id: string; url: string; content?: any; comments?: RedditComment[] };
	target?: CommentTarget;
};

export interface Input {
	data: string[] | RedditCommentPrompt;
	user_intent: string; // user intent for context
}
export interface Output {
	type: Kind;
	data: string;
	id: string;
	reason: any;
}
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
	export interface Generators {
		sys?: string;
		type?: Kind;
		input: Input;
		range: Ranger;
	}
	export interface Image {
		/**
		 * Description of the screenshot
		 */
		des: string;

		/**
		 * base64 encoded image
		 */
		b64: string[];
	}

	export interface Genoration {
		/**
		 * The prompt text.
		 */
		task: string | "generate_reddit_comment" | "generate_reddit_reply";

		/**
		 * The model to use for the prompt.
		 */
		model: Model;

		/**
		 * The generations to use for the prompt.
		 */
		generations: Generators;

		/**
		 * The type of the prompt.
		 */
		decorators: Decorations;
	}

	export interface Prompt extends Genoration {
		/**
		 * The temperature to use for the prompt.
		 */
		image?: Image;
	}
}

export const tones: Tone[] = ["sarcastic", "informative", "relatable", "straightforward"];
