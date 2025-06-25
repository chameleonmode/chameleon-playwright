import { BrowserContext } from "@playwright/test";
import { promptee } from "../../../../../lib/requests.js";
import { Options } from "../../../configure.js";
import Reddit from "../../../reddit.js";
import { Post } from "../post.js";

export default async function (context: BrowserContext, opts: Options) {
	// Step 1 - Init
	const { reddit } = await Reddit(context, opts, async (_) => {
		const post = new Post(reddit);
		// Step 1.5 - define the scenario
		await reddit.navigateIntoPost();
		await post.archived(reddit.assert);

		// Get the post content, screenshot, and comments
		const { content, screenshot, comments, id, url } = await post.raw();
		// const comment = rando(comments);

		// Step 1.6 - Generate a reply
		const result = await promptee.robot({
			model: "o4-mini",
			decorators: reddit.opts.ai.decorators,
			task: "generate_reddit_reply",
			image: {
				des: "page screenshot",
				b64: [screenshot],
			},
			generations: {
				type: "reply",
				range: { min: 1, max: 1 },
				input: {
					data: {
						post: { id, url, content, comments },
						target: {
							type: "unknown",
						},
					},
					user_intent: "Select a comment aligned with users metadata and generate a reply to it",
				},
			},
		});
		const comment = reddit.banger(comments.find((c) => c.id === result[0].id));
		await post.replyToComment(comment.locator, async () => {
			await reddit.nap();
			return result[0].data;
		});
	});

	// Step 2 - Dance
	await reddit.player.play();
}
