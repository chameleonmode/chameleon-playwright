import { Locator } from "@playwright/test";
import { Reddit } from "../../reddit.js";
import { trySequentially } from "../../../../lib/utils.js";

export class Post {
	constructor(readonly pager: Reddit) {}

	// Get post title text
	async title() {
		return this.pager.txtContent('h1[id^="post-title-"][slot="title"]');
	}

	// Extract full post data with screenshot
	async raw() {
		const locator = this.pager.page.locator("#i18n-shreddit-post-translator-content >> shreddit-post");
		await locator.waitFor();

		// Take screenshot of post element
		const screenshot = await this.pager.screenshot(locator);

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
				tag: "shreddit-post",
				attributes: extractAttributes(root),
				title: root.querySelector("h1")?.textContent?.trim() || null,
				flair: root.querySelector("shreddit-post-flair")?.textContent?.trim() || null,
				body: extractTextContent(root.querySelector('[slot="text-body"]') || root),
				media: extractMedia(root),
			};
		});

		const comments = await this.pager.getComments();
		return { id: crypto.randomUUID(), url: this.pager.page.url(), content, screenshot, comments };
	}

	// Handle archived posts or find comment section
	async archived(func: (locator: Locator) => Promise<unknown>) {
		await this.pager.nap();
    return await this.pager.joinConversation();

		// Try multiple strategies to find comment area
		//  const results = await trySequentially([
		//     async () => await func.call(this.pager, await this.pager.joinConversation()),
		//     async () => await func.call(this.pager, this.pager.page.getByRole("button", { name: "Add a comment" })),
		//   ]);

		// return this.pager.bang("Archived or Comment button", results.fulfilled.length > 0, {
		//   fulfilled: results.fulfilled,
		//   rejected: results.errors,
		// });
	}

	// Add comment to main thread
	async addComment(comment: () => Promise<string>) {
		// Type comment in textbox
		await this.pager.pressSequentially(
			this.pager.page.locator("#subgrid-container").getByRole("textbox"),
			await comment()
		);

		// Submit comment
		await this.pager.click(this.pager.page.locator('button.button-primary[slot="submit-button"]'));
	}

	// Reply to specific comment
	async replyToComment(locator: Locator, reply: () => Promise<string>) {
		await locator.scrollIntoViewIfNeeded();
		await this.pager.nap();

		// Click reply button
		const comment = locator.locator("shreddit-comment-action-row button").first();
		await this.pager.click(comment);

		// Wait for reply box and type response
		const replyBox = locator.locator(
			"shreddit-comment-action-row shreddit-async-loader comment-composer-host faceplate-form shreddit-composer"
		);
		await replyBox.waitFor();
		await this.pager.type(await reply());

		// Submit reply
		await this.pager.click(replyBox.locator("button[slot='submit-button']").first());
	}
}
