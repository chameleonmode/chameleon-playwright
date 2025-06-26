import { BrowserContext } from "@playwright/test";
import { Options } from "../../../configure.js";
import User from "../user.js";

export default async function (ctx: BrowserContext, opts: Options) {
	const { reddit, user } = await User({ ctx, opts }, async (_, __) => await user.follow());
	reddit.opts.args.scope = "People";

	// Step 2 - Play
	await reddit.player.play();
}
