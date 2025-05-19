import { Logger } from "../lib/logger.js";
import { Base } from "./base.js";

export class Player {
  readonly visited: number[] = []

  // ctor
  constructor(readonly actor: Base) {}

  async play() {
    const length = this.actor.opts.settings.start.urls.length;
    for (let j = 0; j < length; j++) {
      const url = this.actor.opts.settings.start.urls[j];
      if(!url) continue;

      // if on next variation
      Logger.log(`Url: ${j + 1} of ${length}`, url);
      while (!((await this.actor.onTry(url)) instanceof Error)) {
        this.visited.length = 0;
        for (let i = 0; i < this.actor.iterations; i++) {
          Logger.log(`Iteration: ${i + 1} of ${this.actor.iterations}`);

          // if on next iteration
          if (i > 0) await this.actor.onIteration(url);

          // on each iteration
          const resulto = await this.actor.scenario(url);
          if (resulto && typeof resulto === "number") this.visited.push(resulto);
        }
      }
    }
  }
}

// export default async function (actor: Base) {
//   await actor.init();
//   return new Player(actor);
// }
