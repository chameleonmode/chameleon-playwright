import { Base } from "./base.js";

export class Player {
  constructor(readonly actor: Base, public visited: number[] = []) {}

  async play() {
    for (let j = 0; j < this.actor.opts.settings.start.urls.length; j++) {
      const url = this.actor.opts.settings.start.urls[j];
      await this.actor.navigate(url);
      await this.actor.nap();
      while ((await this.actor.onTry()) === undefined) {
        this.visited = [];
        for (let i = 0; i < this.actor.iterations; i++) {
          console.log(`Iteration: ${i + 1} of ${this.actor.iterations}`);

          // if on next iteration
          if (i > 0) await this.actor.onRetry();

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
