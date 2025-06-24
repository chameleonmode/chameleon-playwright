import { BrowserContext } from "@playwright/test";
import { configure, Options } from "../../../configure.js";
import Reddit from "../../../reddit.js";
import { User } from "../user.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const options = configure(opts);
  options.args.scope = "People";
  const { reddit } = await Reddit(context, options, async () => await new User(reddit).follow());
  // Step 2 - Play
  await reddit.player.play();
}
