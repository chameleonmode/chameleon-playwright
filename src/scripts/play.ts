import { random } from "../lib/utils.js";
import { Base } from "./page.js";

export class Player {
  constructor(readonly actor: Base, readonly threads: number[] = [], readonly times: number = 1) {}
  async start(dance: (rano: number[]) => Promise<number>) {
    for (let i = 0; i < this.times; i++) {
      console.log(`
         Step: ${i + 1} of ${this.times}`);

      if (i > 0) {
        this.actor.nap();
        this.actor.page.goBack();
      }
      const resulto = await dance(this.threads);
      this.threads.push(resulto);
    }
  }
}

export default async function (actor: Base) {
  await actor.init();
  if (actor.opts.start.url) await actor.navigate(actor.opts.start.url); // Added navigation to the start URL
  return new Player(
    actor,
    [],
    random(actor.opts.settings.iterations.min, actor.opts.settings.iterations.max)
  );
}
