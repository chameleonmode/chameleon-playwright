import { Locator } from "@playwright/test";
import { Parameters, Funco } from "../../../../lib/types/index.js";
import { Options } from "../../configure.js";
import Reddito, { Reddit } from "../../reddit.js";

export class Post {
	constructor(readonly actor: Reddit) {}

	// Get post title text
	async title() {
		return this.actor.txtContent('h1[id^="post-title-"][slot="title"]');
	}

	// Add comment to main thread
	async addComment(comment: () => Promise<string>) {
		// Type comment in textbox
		await this.actor.pressSequentially(
			this.actor.page.locator("#subgrid-container").getByRole("textbox"),
			await comment()
		);

		// Submit comment
		await this.actor.click(this.actor.page.locator('button.button-primary[slot="submit-button"]'));
	}

	// Reply to specific comment
	async replyToComment(locator: Locator, reply: () => Promise<string>) {
		await locator.scrollIntoViewIfNeeded();
		await this.actor.nap();

		// Click reply button
		const comment = locator.locator('button:has-text("Reply")');
		await this.actor.click(comment);

		// Wait for reply box and type response
		const replyBox = locator.locator(
			"shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
		);
		await replyBox.waitFor();
		await this.actor.type(await reply());

		// Submit reply
		await this.actor.click(replyBox.locator("button[slot='submit-button']"));
	}
}

export default async function (params: Parameters<Options>, action: Funco) {
	const { reddit } = await Reddito(params, action);
	const post = new Post(reddit);
	return { reddit, post };
}
