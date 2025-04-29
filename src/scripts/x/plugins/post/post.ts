import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import X from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { x } = await X(context, opts);

  // Step 2 - Dance
  await x.poster(await x.ai("want to create an tweet: ", { input: x.opts.args.search, type: "post", range:"20-30" })) 
}
  