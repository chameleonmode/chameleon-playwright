import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import Reddit from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async () => await reddit.user.follower());

  // Step 2 - Play
  await player.play();
}
