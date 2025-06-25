import { BrowserContext } from "@playwright/test";
import { promptee } from "../../../../../lib/requests.js";
import { Options } from "../../../configure.js";
import Reddit from "../../../reddit.js";
import { Post } from "../post.js";

export default async function (ctx: BrowserContext, opts: Options) {
	// Step 1 - Init
	const { reddit } = await Reddit(ctx, opts, async (_) => {
		const post = new Post(reddit);
		// Step 1.5 - define the scenario
		await reddit.navigateIntoPost();
		// Click the comment button
		await post.archived(reddit.click);
		const { content, screenshot, comments } = await post.raw();

		// Step 1.6 - Generate a comment
		await post.addComment(async () => {
			const result = await promptee.robot({
				model: "o4-mini",
				decorators: reddit.opts.ai.decorators,
				task: "generate_reddit_comment",
				image: { des: "post screenshot", b64: [screenshot] },
				generations: {
					type: "comment",
					range: { min: 1, max: 1 },
					input: {
						data: {
							post: {
								id: crypto.randomUUID(),
								url: reddit.page.url(),
								content,
								comments,
							},
							target: {
								type: "post",
							},
						},
						user_intent: "Generate a comment to this post",
					},
				},
			});
			return result[0].data;
		});
	});

	// Step 2 - Run
	await reddit.player.play();
}
