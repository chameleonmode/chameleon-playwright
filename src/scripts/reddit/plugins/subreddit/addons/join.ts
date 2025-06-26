import { BrowserContext } from "@playwright/test";
import { Options } from "../../../configure.js";
import Subreddit from "../subreddit.js";

export default async function (ctx: BrowserContext, opts: Partial<Options>) {
	const { reddit, subreddit } = await Subreddit({ ctx, opts }, async (_, __) => {
		await subreddit.joiner();
	});

	reddit.opts.settings.start.iterations.min = Math.max(
		reddit.opts.settings.start.rando.min,
		reddit.opts.settings.start.iterations.min
	);
	reddit.opts.settings.start.iterations.max = reddit.opts.settings.start.iterations.min;

	// Step 3 - Play
	await reddit.player.play();
}
