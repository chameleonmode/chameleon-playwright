import { BrowserContext } from "@playwright/test";
import { Options } from "../../settings.js";
import X from "../../page.js";

export default async function (context: BrowserContext, opts: Options) {
  // Step 1 - Init
  const { x, player } = await X(context, opts);
  await x.searcho(x.opts.args.search)
  // Step 2 - Dance
  await player.start(async () => {
    
    const expecto = await x.findo(
      // Step 3 - Moves
      async () => {
        await x.like();
      },
      player.visited
    );

    return expecto.index;
  });
}
