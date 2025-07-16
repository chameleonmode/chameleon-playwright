import { BrowserContext } from "@playwright/test";
import { promptee } from "../../../../../lib/requests.js";
import { bang } from "../../../../../lib/utils.js";
import { Options } from "../../../configure.js";
import Subreddit from "../subreddit.js";

export default async function (ctx: BrowserContext, opts: Options) {
	const { reddit, subreddit } = await Subreddit({ ctx, opts }, async (_, __) => {
		// find post content from a comment
		await reddit.navigateIntoPost();

		// Get the post title and comment text
		// const titled = await reddit.post.title();
		const b64 = [await reddit.screenshot(reddit.page.locator("body"))];
		const comments = await reddit.getComments();
		const context = `The post will be based on ${reddit.page.url()}`;

		// Check if the user is on the right page
		// if (reddit.scopeulation.tranform().community) await reddit.page.goBack();
		await subreddit.visitCommunity();

		// Check if the user is on the right page
		await subreddit.canPost();
		b64.push(await reddit.screenshot(reddit.page.locator("body")));

		// Create a new post
		await subreddit.poster(async () => {
			const titlee = await promptee.content({
				decorators: reddit.opts.ai.decorators,
				task: `generate_post_title.`,
				image: { des: "page screenshots", b64 },
				generations: {
					type: "title",
					range: { min: 1, max: 1 },
					input: {
						data: comments.map((c) => c.text),
						user_intent: `Creating a post title on a subreddit community page. ${context}`,
					},
				},
			});
			const titler = bang(
				"post title response",
				titlee.find((data) => {
					if (data.type === "title") return data;
				}),
				{ titlee }
			);
			b64.push(await reddit.screenshot(reddit.page.locator("body")));

			const contentlee = await promptee.content({
				decorators: reddit.opts.ai.decorators,
				task: `create_post_content`,
				image: { des: "page screenshots", b64 },
				generations: {
					type: "post",
					range: { min: 1, max: 1 },
					input: {
						data: comments.map((c) => c.text),
						user_intent: `Creating post content for a post titled ${titler.data} on a subreddit community page. ${context}`,
					},
				},
			});
			const contentler = bang(
				"post content response",
				contentlee.find((data) => {
					if (data.type === "post") return data;
				}),
				{ contentlee }
			);

			// Return the title and content
			return { title: titler.data, content: contentler.data };
		});

		// nap
		await reddit.nap();
	});

	// Step 3 - Play
	await reddit.player.play();
}
