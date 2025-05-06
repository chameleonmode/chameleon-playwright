import { BrowserContext } from "@playwright/test";
import { Options } from "../../reddit.js";
import Reddit from "../../page.js";
import { User } from "./page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { reddit, player } = await Reddit(context, opts, async () => await user.follow());
  const user = new User(reddit);
  // Step 2 - Play
  await player.play();
}
