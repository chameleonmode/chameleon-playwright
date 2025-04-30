import { random } from "../lib/utils.js";
import { Base } from "./page.js";

export class Player {
  constructor(
    readonly actor: Base, 
    readonly iterations: number,
    readonly visited: number[] = []
  ) {}
  
  async start(dance: () => Promise<number>) {
    let v = 0;
    while (await this.actor.onTry() === undefined) {
      console.log(`variation: ${v++} of ${this.iterations}`);
      for (let i = 0; i < this.iterations; i++) {
        console.log(`Iteration: ${i + 1} of ${this.iterations}`);

        if (i > 0) await this.actor.onRetry();
        const resulto = await dance();
        this.visited.push(resulto);
      }
    }
  }
}

export default async function (actor: Base) {
  await actor.init();
  return new Player(
    actor,
    random(actor.opts.settings.iterations.min, actor.opts.settings.iterations.max)
  );
}
