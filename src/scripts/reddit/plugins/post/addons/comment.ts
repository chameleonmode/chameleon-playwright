import { BrowserContext } from "@playwright/test";
import { promptee } from "../../../../../lib/requests.js";
import { Options } from "../../../configure.js";
import Post from "../post.js";

export default async function (ctx: BrowserContext, opts: Options) {
	const { reddit, post } = await Post({ ctx, opts }, async (_, __) => {
		const posts = (await reddit.navigateIntoPost()) ?? (await reddit.joinConversation());
		const raw =
			Array.isArray(posts) && reddit.banger(posts.length)
				? await reddit.findo(posts.sort(() => Math.random() - 0.5), async (_) => {
						await reddit.joinConversation();
						return await post.raw();
				  })
				: await post.raw();
				
		// Step 1.6 - Generate a comment
		const postee = { id: raw.id, url: raw.url, content: raw.content, comments: raw.comments };
		await post.addComment(async () => {
			const result = await promptee.robot({
				model: "o4-mini",
				decorators: reddit.opts.ai.decorators,
				task: "generate_reddit_comment",
				image: { des: "post screenshot", b64: [raw.screenshot] },
				generations: {
					type: "comment",
					range: { min: 1, max: 1 },
					input: {
						data: {
							post: postee,
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
