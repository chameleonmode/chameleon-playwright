import { Locator } from "@playwright/test";
import { Funco, Logger, Parameters, bang, promptee, randy } from "../../../../lib/index.js";
import Reddito, { Reddit, Options, RedditComment } from "../../reddit.js";

export class Subreddit {
	constructor(readonly reddit: Reddit) {}

	// Assert if user can create a post
	async canPost() {
		await this.reddit.nap();
		const locator = this.reddit.page.locator("#subgrid-container faceplate-tracker[noun=create_post]");
		await this.reddit.click(locator);
	}

	// Navigate to subreddit community
	async visitCommunity() {
		const locator = this.reddit.page.locator('span.avatar a[href^="/r/"]');
		await this.reddit.click(locator);
	}

	// Vote on posts (upvote/downvote)
	async voter() {
		const ups: Locator[] = [];
		// Join conversation if not in community or people scope
		if (await this.reddit.joinConversation()) {
			const these = await this.reddit.getComments();
			const min = Math.min(these.length, this.reddit.opts.settings.start.rando.min);
			bang("Vote count", min > 0);
			try {
					// Ensure we only use comments under the minimum amount defined in settings
					const data = these.sort(() => randy()).slice(0, min);
					const promptmise = promptee.ranking({
						task: `rank these reddit comments for voting positively ${min} times on. your reply data needs to be a ordered array of the provided comment id and your ranking number.`,
						generations: {
							type: "ranking",
							range: { min: 1, max: 1 },
							input: {
								data: data.sort(() => randy()),
								user_intent: `This batch comments are @${this.reddit.page.url()}`,
							},
						},
					});
					const reply = await this.reddit.waitabit(promptmise);
					const ranked = reply[0].data
						.map((item) => these.find((c) => c.id === item.id))
						.filter((comment): comment is RedditComment => comment !== undefined);
					ups.push(...ranked.map((c) => c.locator.getByRole("button", { name: "Upvote" })));
			} catch (error) {
				Logger.warn("Error in ranking wait", error);
			}
		} else await this.reddit.scrollabit();
		// If no comments found, use the main page's upvote button
		if (ups.length === 0) {
			const locator = await this.reddit.page.getByRole("button", { name: "Upvote" }).all();
			ups.push(...locator);
		}
		const downs = await this.reddit.page.getByRole("button", { name: "Downvote" }).all();
		// Calculate voting limits to avoid errors
		const count = Math.min(ups.length, downs.length) - 1;
		const length = Math.min(count, this.reddit.opts.settings.start.rando.min);
		bang("Vote count", length > 0, { upCount: ups.length, downCount: downs.length, count, length });

		// Perform voting with 96% upvote bias
		for (let i = 0; i < length; i++) {
			await this.reddit.click(Math.random() * 69 <= 96 ? ups[i] : downs[i]);
		}

		return {
			ups: { locator: ups, count: ups.length },
			downs: { locator: downs, count: downs.length },
		};
	}

	// Join subreddit if not already a member
	async joiner() {
		await this.reddit.scrollabit();

		// Click the "Join" button
		const locator = this.reddit.page.getByRole("button", { name: "Join", exact: true });
		await this.reddit.click(locator);
	}

	// Create a new post with title and content
	async poster(contents: () => Promise<{ title: string; content: string }>) {
		await this.reddit.nap();

		// Locate form elements
		const titleLocator = this.reddit.page.locator("#innerTextArea").first();
		const bodyLocator = this.reddit.page.locator('div[slot="rte"][aria-label="Post body text field"]');

		// Verify post type is text
		const postTypeValue = await this.reddit.page
			.locator('r-post-type-select[name="type"]')
			.getAttribute("value");
		bang("Post type", postTypeValue === "TEXT", { postTypeValue });
		bang("Post body text field", await bodyLocator.innerText(), { bodyLocator });
		bang("Post title text field", await titleLocator.count(), { titleLocator });

		// Fill in post content
		const { title, content } = await contents();
		await this.reddit.pressSequentially(titleLocator, title);
		await this.reddit.pressSequentially(bodyLocator, content);

		// Submit the post
		const submitButton = this.reddit.page
			.locator("r-post-form-submit-button#submit-post-button")
			.getByRole("button");
		await this.reddit.click(submitButton);
	}
}

export default async function (opts: Parameters<Options>, action: Funco) {
	const { reddit } = await Reddito(opts, action);
	const subreddit = new Subreddit(reddit);
	return { reddit, subreddit };
}
