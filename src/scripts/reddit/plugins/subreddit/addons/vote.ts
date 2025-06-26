import { BrowserContext } from "@playwright/test";
import { Options } from "../../../configure.js";
import Subreddit from "../subreddit.js";

export default async function (ctx: BrowserContext, opts: Options) {
	const { reddit, subreddit } = await Subreddit({ ctx, opts }, async (_, __) => {
		// Step 1.5 - Define
		await subreddit.voter();
	});

	// Step 3 - Play
	await reddit.player.play();
}
