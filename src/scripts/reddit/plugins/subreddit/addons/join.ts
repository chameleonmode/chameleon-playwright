import { BrowserContext } from "@playwright/test";
import { configure, Options } from "../../../configure.js";
import Reddit from "../../../reddit.js";
import { Subreddit } from "../subreddit.js";

export default async function (context: BrowserContext, opts: Partial<Options>) {
	// Step 0 - Setup
	// setup options
	const options = configure(opts);
	options.settings.start.iterations.min = Math.max(
		options.settings.start.rando.min,
		options.settings.start.iterations.min
	);
	options.settings.start.iterations.max = options.settings.start.iterations.min;
	// Step 1 - Init
	const { reddit } = await Reddit(context, options, async (_) => {
		const subreddit = new Subreddit(reddit);
		await subreddit.joiner();
	});

	// Step 3 - Play
	await reddit.player.play();
}
