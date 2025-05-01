import { Base } from "./base.js";

export class Player {
  constructor(readonly actor: Base, public visited: number[] = []) {}

  async play() {
    const length = this.actor.opts.settings.start.urls.length;
    for (let j = 0; j < length; j++) {
      const url = this.actor.opts.settings.start.urls[0];
      if(!url) continue;

      // if on next variation
      console.log(`Variation: ${j + 1} of ${length}`, url);
      while ((await this.actor.onTry(url)) === undefined) {
        this.visited = [];
        for (let i = 0; i < this.actor.iterations; i++) {
          console.log(`Iteration: ${i + 1} of ${this.actor.iterations}`);

          // if on next iteration
          if (i > 0) await this.actor.onRetry(url);

          // on each iteration
          const resulto = await this.actor.scenario(url);
          if (resulto && typeof resulto === "number") this.visited.push(resulto);
        }
      }
    }
  }
}

export default async function (actor: Base) {
  await actor.init();
  return new Player(actor);
}
