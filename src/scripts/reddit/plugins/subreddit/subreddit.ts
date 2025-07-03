import { Locator } from "@playwright/test";
import { Funco, Logger, Parameters, promptee } from "../../../../lib/index.js";
import { bang, delay } from "../../../../lib/utils.js";
import { Options, RedditComment } from "../../configure.js";
import Reddito, { Reddit } from "../../reddit.js";

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
		const comments: RedditComment[] = [];
		// Join conversation if not in community or people scope
		if (await this.reddit.joinConversation()) {
			const these = await this.reddit.getComments();
			const min = Math.min(these.length, this.reddit.opts.settings.start.rando.min);
			try {
				while (comments.length < min) {
					const promptmise = promptee.ranking({
						task: `rank these reddit comments for up-voting make sure to mix and match the best comments that relate to the users incception metadata.
				do not only rank the top comments, but also include some of the lower ranked comments that are relevant to the users metadata.`,
						generations: {
							type: "ranking",
							range: { min: 1, max: 1 },
							input: {
								data: these.filter((comment) => !comments.some((c) => c.id === comment.id)),
								user_intent: `Rank all of these comments to up-vote on @${this.reddit.page.url()}`,
							},
						},
					});
					await this.reddit.scrollabit(9);
					let racer = await Promise.race([promptmise, delay(100)]);
					if (typeof racer === "number") await this.reddit.scrollabit(6);
					racer = await Promise.race([promptmise, delay(100)]);
					if (typeof racer === "number") await this.reddit.scrollabit(3);
					racer = await Promise.race([promptmise, delay(100)]);
					if (typeof racer === "number") await this.reddit.scrollabit();
					const reply = await promptmise;
					const ranked = reply[0].data
						.sort((a) => a.rank)
						.map((item) => these.find((c) => c.id === item.id))
						.filter((comment): comment is RedditComment => comment !== undefined);
					comments.push(...ranked);
				}
			} catch (error) {
				Logger.warn("Error in ranking wait", error);
			}
		} else {
			// Scroll to load more posts
			await this.reddit.scrollabit();
		}
		
		// Get upvote and downvote buttons
		const ups = comments.length
			? comments.map((c) => c.locator.getByRole("button", { name: "Upvote" }))
			: this.reddit.page.getByRole("button", { name: "Upvote" });
		const downs = comments.length
			? comments.map((c) => c.locator.getByRole("button", { name: "Downvote" }))
			: this.reddit.page.getByRole("button", { name: "Downvote" });
		const upCount = Array.isArray(ups) ? ups.length : await ups.count();
		const downCount = Array.isArray(downs) ? downs.length : await downs.count();

		// Calculate voting limits to avoid errors
		const count = Math.min(upCount, downCount) - 1;
		const length = Math.min(count, this.reddit.opts.settings.start.rando.min);
		bang("Vote count", length > 0, { upCount, downCount, count, length });

		// Perform voting with 96% upvote bias
		for (let i = 0; i < length; i++) {
			const upLocator = Array.isArray(ups) ? ups[i] : ups.nth(i);
			const downLocator = Array.isArray(downs) ? downs[i] : downs.nth(i);
			await this.reddit.click(Math.random() * 100 <= 96 ? upLocator : downLocator);
		}

		return {
			ups: { locator: ups, count: upCount },
			downs: { locator: downs, count: downCount },
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

export default async function (params: Parameters<Options>, action: Funco) {
	const { reddit } = await Reddito(params, action);
	const subreddit = new Subreddit(reddit);
	return { reddit, subreddit };
}
