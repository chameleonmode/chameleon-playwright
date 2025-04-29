import { random } from "../lib/utils.js";
import { Base } from "./page.js";

export class Player {
  constructor(readonly actor: Base, readonly iterations: number, readonly visited: number[] = []) {}
  async start(dance: () => Promise<number>) {
    for (let i = 0; i < this.iterations; i++) {
      console.log(`
         Iteration: ${i + 1} of ${this.iterations}`);

      if (i > 0) {
        await this.actor.nap();
        await this.actor.page.goBack();
      }
      const resulto = await dance();
      this.visited.push(resulto);
    }
  }
}

export default async function (actor: Base, postInit: () => Promise<void>) {
  await actor.init();
  if (actor.opts.settings.start.url) await actor.navigate(actor.opts.settings.start.url); // Added navigation to the start URL
  await actor.nap();
  await postInit();
  return new Player(
    actor,
    random(actor.opts.settings.iterations.min, actor.opts.settings.iterations.max)
  );
}
